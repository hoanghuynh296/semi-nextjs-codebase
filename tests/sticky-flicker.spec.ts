// StickyContextBar scroll-up flicker regression (#193): per-frame invariants while scrolling up.
// A non-cancelable wheel event means Chrome already scrolls the sequence on the compositor and has painted the new
// position; writing scrollTop back then shows two positions on alternate frames (the reported flicker). Each run
// records per frame the scroller's scrollTop, the bar's top, data-stuck and --sticky-pin, plus every wheel event and
// every scrollTop write, and checks: data-stuck changes at most once per upward gesture, the bar's top never reverses
// direction, and no scrollTop write follows a non-cancelable wheel event of the same gesture.
// Two input paths: Input.dispatchMouseEvent replays the captured sequence (tests/fixtures/sticky-wheel.json; CDP sends
// every such event as cancelable), and Input.synthesizeScrollGesture drives Chrome's own gesture pipeline, which sends
// the rest of a natively scrolled sequence as non-cancelable (the path that flickered).
// "Zoom" runs at the device scale and CSS viewport that browser zoom gives (deviceScaleFactor x zoom, width / zoom).
import { expect, test, type CDPSession, type Page } from "@playwright/test";
import fs from "node:fs";

type Seq = [gapMs: number, deltaY: number, cancelable: number][];
const FIXTURE = JSON.parse(fs.readFileSync(new URL("./fixtures/sticky-wheel.json", import.meta.url), "utf8")) as {
  down: Seq;
  flingUp: Seq;
  unpinUp: Seq;
};

type Frame = { t: number; st: number; top: number; stuck: boolean; pin: string };
type Ev = { t: number; kind: "wheel" | "write" | "mark"; dy?: number; cancelable?: boolean; to?: number; name?: string };

async function instrument(page: Page, host: string) {
  await page.evaluate((sel) => {
    const scroller = document.querySelector<HTMLElement>(sel)!;
    const bar = scroller.querySelector<HTMLElement>("[data-sticky-bar]")!;
    const w = window as unknown as { __frames: unknown[]; __ev: unknown[] };
    w.__frames = [];
    w.__ev = [];
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop")!;
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      get() {
        return desc.get!.call(this);
      },
      set(v: number) {
        w.__ev.push({ t: performance.now(), kind: "write", to: v });
        desc.set!.call(this, v);
      },
    });
    window.addEventListener(
      "wheel",
      (e) => w.__ev.push({ t: performance.now(), kind: "wheel", dy: e.deltaY, cancelable: e.cancelable }),
      { capture: true, passive: true },
    );
    const edge = () => {
      const r = scroller.getBoundingClientRect();
      return r.top + scroller.clientTop + (parseFloat(getComputedStyle(scroller).paddingTop) || 0);
    };
    const loop = () => {
      w.__frames.push({
        t: performance.now(),
        st: scroller.scrollTop,
        top: bar.getBoundingClientRect().top - edge(),
        stuck: bar.hasAttribute("data-stuck"),
        pin: scroller.style.getPropertyValue("--sticky-pin"),
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, host);
}

const mark = (page: Page, name: string) =>
  page.evaluate((n) => (window as unknown as { __ev: unknown[] }).__ev.push({ t: performance.now(), kind: "mark", name: n }), name);

async function collect(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[]; __ev: Ev[] };
    return { frames: w.__frames, ev: w.__ev };
  });
}

/** Per-frame invariants of the window between marks `from` and `to`. */
function check(data: { frames: Frame[]; ev: Ev[] }, from: string, to: string, label: string) {
  const t0 = data.ev.find((e) => e.kind === "mark" && e.name === from)!.t;
  const t1 = data.ev.find((e) => e.kind === "mark" && e.name === to)!.t;
  const frames = data.frames.filter((f) => f.t >= t0 && f.t <= t1);
  const ev = data.ev.filter((e) => e.t >= t0 && e.t <= t1);
  let toggles = 0;
  let reversals = 0;
  let dir = 0;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].stuck !== frames[i - 1].stuck) toggles++;
    const d = frames[i].top - frames[i - 1].top;
    if (Math.abs(d) > 0.5) {
      if (dir && Math.sign(d) !== dir) reversals++;
      dir = Math.sign(d);
    }
  }
  // A write after a non-cancelable wheel event of this gesture lands after the compositor painted the native position.
  let native = false;
  let fightingWrites = 0;
  for (const e of ev) {
    if (e.kind === "wheel" && e.cancelable === false) native = true;
    if (e.kind === "write" && native) fightingWrites++;
  }
  const log = frames.map((f) => `${f.t.toFixed(1)} st=${f.st.toFixed(1)} top=${f.top.toFixed(2)} stuck=${+f.stuck} pin=${f.pin}`);
  expect.soft(toggles, `${label}: data-stuck toggles\n${log.join("\n")}`).toBeLessThanOrEqual(1);
  expect.soft(reversals, `${label}: bar top reversals\n${log.join("\n")}`).toBe(0);
  expect.soft(fightingWrites, `${label}: scrollTop writes during native scrolling`).toBe(0);
  return frames.at(-1)!;
}

async function replay(cdp: CDPSession, x: number, y: number, seq: Seq) {
  const start = performance.now();
  let at = 0;
  for (const [gap, dy] of seq) {
    at += gap;
    const wait = start + at - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY: dy });
  }
}

async function open(page: Page, url: string, host: string) {
  await page.goto(url);
  await page.waitForFunction(
    (sel) => parseFloat(document.querySelector<HTMLElement>(sel)?.style.getPropertyValue("--sticky-pin") || "0") > 0,
    host,
  );
  await page.waitForTimeout(300);
}

const DISPLAYS = [
  { name: "DPR 1", dpr: 1, zoom: 1 },
  { name: "DPR 2", dpr: 2, zoom: 1 },
  { name: "90% zoom", dpr: 1, zoom: 0.9 },
  { name: "110% zoom", dpr: 1, zoom: 1.1 },
] as const;

for (const d of DISPLAYS) {
  test.describe(`scroll-up flicker (#193) at ${d.name}`, () => {
    test.use({ deviceScaleFactor: d.dpr * d.zoom });

    test("layout-pin list: captured wheel replay pins, holds a fling and unpins on a new gesture", async ({ page }) => {
      await page.setViewportSize({ width: Math.round(1440 / d.zoom), height: Math.round(820 / d.zoom) });
      await open(page, "/demo/sticky-list/", "#main");
      await instrument(page, "#main");
      const box = (await page.locator("[data-page-body]").boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + Math.min(200, box.height / 2);
      await page.mouse.move(x, y);
      const cdp = await page.context().newCDPSession(page);

      await replay(cdp, x, y, FIXTURE.down);
      await page.waitForTimeout(400);
      await mark(page, "fling");
      await replay(cdp, x, y, FIXTURE.flingUp);
      // The stop: longer than the 400ms gesture gap.
      await page.waitForTimeout(500);
      await mark(page, "unpin");
      await replay(cdp, x, y, FIXTURE.unpinUp);
      await replay(cdp, x, y, FIXTURE.unpinUp);
      await page.waitForTimeout(300);
      await mark(page, "end");

      const data = await collect(page);
      const held = check(data, "fling", "unpin", "fling up");
      expect(held.stuck).toBe(true);
      const after = check(data, "unpin", "end", "new gesture up");
      expect(after.stuck).toBe(false);
      expect(after.st).toBe(0);
    });

    test("layout-pin list: Chrome's own gesture pipeline (non-cancelable tail) holds and unpins without writes during native scroll", async ({ page }) => {
      await page.setViewportSize({ width: Math.round(1440 / d.zoom), height: Math.round(820 / d.zoom) });
      await open(page, "/demo/sticky-list/", "#main");
      await instrument(page, "#main");
      const box = (await page.locator("[data-page-body]").boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + Math.min(200, box.height / 2);
      const cdp = await page.context().newCDPSession(page);

      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: -900, speed: 1200, gestureSourceType: "mouse" });
      await page.waitForTimeout(500);
      await mark(page, "fling");
      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 1400, speed: 1600, gestureSourceType: "mouse" });
      await page.waitForTimeout(500);
      await mark(page, "unpin");
      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 400, speed: 800, gestureSourceType: "mouse" });
      await page.waitForTimeout(300);
      await mark(page, "end");

      const data = await collect(page);
      expect(check(data, "fling", "unpin", "fling up").stuck).toBe(true);
      expect(check(data, "unpin", "end", "new gesture up").stuck).toBe(false);
    });

    test("scrolling page without layout-pin (below md): an upward fling near the pin stops there without flicker", async ({ page }) => {
      await page.setViewportSize({ width: Math.round(630 / d.zoom), height: Math.round(820 / d.zoom) });
      await open(page, "/demo/sticky-list/", "#main");
      await instrument(page, "#main");
      const box = (await page.locator("[data-page-body]").boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + 40;
      const cdp = await page.context().newCDPSession(page);
      // Scroll a little past the pin, then fling back up: before #193 every frame of the tail was written back.
      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: -360, speed: 1200, gestureSourceType: "mouse" });
      await page.waitForTimeout(500);
      const start = await page.evaluate(() => {
        const m = document.getElementById("main")!;
        return { st: m.scrollTop, pin: parseFloat(m.style.getPropertyValue("--sticky-pin")) };
      });
      expect(start.st).toBeGreaterThan(start.pin);
      await mark(page, "fling");
      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 1600, speed: 1600, gestureSourceType: "mouse" });
      await page.waitForTimeout(400);
      await mark(page, "end");
      const data = await collect(page);
      const last = check(data, "fling", "end", "fling up (no layout-pin)");
      expect(last.stuck).toBe(true);
      expect(Math.abs(last.st - start.pin)).toBeLessThanOrEqual(1);
    });

    test("padded scroller (component doc example): pin and data-stuck use the padding edge, fling holds without writes during native scroll", async ({ page }) => {
      await page.setViewportSize({ width: Math.round(1440 / d.zoom), height: Math.round(820 / d.zoom) });
      const host = "[data-sticky-host]";
      await open(page, "/components/sticky-context-bar/", host);
      await page.locator(host).scrollIntoViewIfNeeded();
      await page.evaluate((sel) => document.querySelector(sel)!.scrollIntoView({ block: "center" }), host);
      await page.waitForTimeout(300);
      await instrument(page, host);
      const hb = (await page.locator(host).boundingBox())!;
      const x = hb.x + hb.width / 2;
      const y = hb.y + hb.height - 60;
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: -600, speed: 1200, gestureSourceType: "mouse" });
      await page.waitForTimeout(500);
      const pinned = await page.evaluate((sel) => {
        const h = document.querySelector<HTMLElement>(sel)!;
        const bar = h.querySelector<HTMLElement>("[data-sticky-bar]")!;
        const edge = h.getBoundingClientRect().top + h.clientTop + parseFloat(getComputedStyle(h).paddingTop);
        return { stuck: bar.hasAttribute("data-stuck"), top: bar.getBoundingClientRect().top - edge };
      }, host);
      expect(pinned.stuck).toBe(true);
      expect(Math.abs(pinned.top)).toBeLessThanOrEqual(1);
      await mark(page, "fling");
      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 1200, speed: 1600, gestureSourceType: "mouse" });
      await page.waitForTimeout(400);
      await mark(page, "end");
      const last = check(await collect(page), "fling", "end", "fling up (padded scroller)");
      expect(last.stuck).toBe(true);
    });
  });
}

// #207: one upward gesture never unpins, with or without layout-pin. The bar holds at the pin for the whole gesture
// (long wheel, slow trackpad with 250-350ms pauses, fling with momentum); only a stop at the pin followed by a NEW
// upward gesture unpins it. Every target runs Chrome's own gesture pipeline (non-cancelable tails) where it can.
type Target = { name: string; url: string; host: string; width: number; point: (page: Page) => Promise<{ x: number; y: number }> };
const TARGETS: Target[] = [
  {
    name: "layout-pin list (md+)",
    url: "/demo/sticky-list/",
    host: "#main",
    width: 1440,
    point: async (page) => {
      const b = (await page.locator("[data-page-body]").boundingBox())!;
      return { x: b.x + b.width / 2, y: b.y + Math.min(200, b.height / 2) };
    },
  },
  {
    name: "page scroller below md (no layout-pin)",
    url: "/demo/sticky-list/",
    host: "#main",
    width: 700,
    point: async (page) => {
      const b = (await page.locator("#main").boundingBox())!;
      return { x: b.x + b.width / 2, y: b.y + b.height - 120 };
    },
  },
  {
    name: "padded doc example (no layout-pin)",
    url: "/components/sticky-context-bar/",
    host: "[data-sticky-host]",
    width: 1440,
    point: async (page) => {
      const b = (await page.locator("[data-sticky-host]").boundingBox())!;
      return { x: b.x + b.width / 2, y: b.y + b.height - 60 };
    },
  },
];

async function state(page: Page, host: string) {
  return page.evaluate((sel) => {
    const h = document.querySelector<HTMLElement>(sel)!;
    return {
      st: h.scrollTop,
      range: h.scrollHeight - h.clientHeight,
      pin: parseFloat(h.style.getPropertyValue("--sticky-pin")),
      stuck: h.querySelector("[data-sticky-bar]")!.hasAttribute("data-stuck"),
    };
  }, host);
}

/** Frames between two marks: data-stuck must hold on every one of them. */
function framesBetween(data: { frames: Frame[]; ev: Ev[] }, from: string, to: string) {
  const t0 = data.ev.find((e) => e.kind === "mark" && e.name === from)!.t;
  const t1 = data.ev.find((e) => e.kind === "mark" && e.name === to)!.t;
  return data.frames.filter((f) => f.t >= t0 && f.t <= t1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Slow trackpad: short bursts of small deltas with 250-350ms pauses between them (fingers resting on the pad). */
const SLOW_TRACKPAD: Seq = Array.from({ length: 16 }, (_, i) => [
  [i === 0 ? 0 : [150, 200, 250][i % 3], -14, 1],
  [16, -22, 1],
  [16, -26, 1],
  [16, -14, 1],
] as Seq).flat();

/** depth: how far past the pin the gesture starts (the slow input travels less than the others). */
const INPUTS: { name: string; depth: number; run: (cdp: CDPSession, x: number, y: number) => Promise<void> }[] = [
  {
    name: "long continuous wheel",
    depth: 2400,
    run: (cdp, x, y) => cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 3200, speed: 900, gestureSourceType: "mouse" }),
  },
  {
    name: "slow trackpad with 150-250ms pauses",
    depth: 700,
    run: async (cdp, x, y) => {
      await replay(cdp, x, y, SLOW_TRACKPAD);
      // The same pauses through Chrome's own pipeline: each burst is a new native sequence. Starting a synthesized
      // gesture takes Chrome ~100ms (more under load), so these sleeps give ~150-250ms between two wheel events,
      // well clear of the 400ms stop even on a loaded machine.
      for (const gap of [50, 130, 100, 150]) {
        await sleep(gap);
        await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 120, speed: 600, gestureSourceType: "mouse" });
      }
    },
  },
  {
    name: "fling with momentum",
    depth: 2400,
    run: async (cdp, x, y) => {
      await replay(cdp, x, y, FIXTURE.flingUp);
      await sleep(120);
      await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 2400, speed: 3000, gestureSourceType: "mouse" });
    },
  },
];

for (const d of [DISPLAYS[0], DISPLAYS[3]]) {
  test.describe(`#207 at ${d.name}`, () => {
  test.use({ deviceScaleFactor: d.dpr * d.zoom });
  for (const target of TARGETS) {
    for (const input of INPUTS) {
      test(`#207 ${target.name}, ${input.name} at ${d.name}: stays stuck for the whole gesture, unpins only on a new one`, async ({ page }) => {
        await page.setViewportSize({ width: Math.round(target.width / d.zoom), height: Math.round(820 / d.zoom) });
        await open(page, target.url, target.host);
        await page.evaluate((sel) => document.querySelector(sel)!.scrollIntoView({ block: "center" }), target.host);
        await page.waitForTimeout(200);
        const { x, y } = await target.point(page);
        await page.mouse.move(x, y);
        const cdp = await page.context().newCDPSession(page);
        // Scroll well past the pin (the page itself without layout-pin, the list with it).
        await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: -input.depth, speed: 2400, gestureSourceType: "mouse" });
        await page.waitForTimeout(600);
        const start = await state(page, target.host);
        expect(start.stuck, "stuck before the gesture").toBe(true);
        await instrument(page, target.host);
        await mark(page, "gesture");
        await input.run(cdp, x, y);
        await page.waitForTimeout(150);
        await mark(page, "stop");
        const held = await state(page, target.host);
        // The stop: the user rests at the pin, inner list at its top.
        await page.waitForTimeout(600);
        await mark(page, "unpin");
        await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: 500, speed: 800, gestureSourceType: "mouse" });
        await page.waitForTimeout(300);
        await mark(page, "end");
        const data = await collect(page);
        const during = framesBetween(data, "gesture", "stop");
        const lost = during.filter((f) => !f.stuck).map((f) => `${f.t.toFixed(1)} st=${f.st.toFixed(1)} top=${f.top.toFixed(2)}`);
        // The input really is one gesture: no pause between two wheel events reaches the 400ms "stop".
        const t0 = data.ev.find((e) => e.kind === "mark" && e.name === "gesture")!.t;
        const t1 = data.ev.find((e) => e.kind === "mark" && e.name === "stop")!.t;
        const wheels = data.ev.filter((e) => e.kind === "wheel" && e.t >= t0 && e.t <= t1).map((e) => e.t);
        const maxGap = Math.max(0, ...wheels.slice(1).map((t, i) => t - wheels[i]));
        // First: if a pause reached the stop, the input was two gestures and the run proves nothing about the bar.
        expect(maxGap, "longest pause inside the gesture (input, not the bar)").toBeLessThan(400);
        expect(lost, `data-stuck cleared during one upward gesture (start st=${start.st}, pin=${start.pin}, longest pause ${maxGap.toFixed(0)}ms)`).toEqual([]);
        check(data, "gesture", "stop", input.name);
        expect(Math.abs(held.st - held.pin), "held at the pin").toBeLessThanOrEqual(1);
        const after = check(data, "unpin", "end", "new gesture up");
        expect(after.stuck, "a new gesture after the stop unpins").toBe(false);
      });
    }
  }
  });
}
