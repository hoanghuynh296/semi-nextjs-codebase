// StickyContextBar pin behaviour, pinned BarActions slot, and URL state (#150, #129, #124, #139).
import { expect, test, type Page } from "@playwright/test";
import { PRERENDER_PORT } from "../playwright.config";

const PRERENDER_BASE = `http://127.0.0.1:${PRERENDER_PORT}`;

/** Sends a realistic trackpad wheel sequence: initial deltas followed by a decelerating momentum tail. */
async function trackpadWheel(page: Page, x: number, y: number, deltas: number[], gapMs = 16) {
  await page.mouse.move(x, y);
  for (const dy of deltas) {
    await page.mouse.wheel(0, dy);
    if (gapMs > 0) await page.waitForTimeout(gapMs);
  }
}

async function readMetrics(page: Page, innerSelector: string) {
  return page.evaluate((sel) => {
    const main = document.getElementById("main");
    const bar = document.querySelector<HTMLElement>("[data-sticky-bar]");
    const inner = document.querySelector<HTMLElement>(sel);
    return {
      mainScroll: main?.scrollTop ?? -1,
      mainRange: main ? main.scrollHeight - main.clientHeight : -1,
      pinVar: main ? parseFloat(main.style.getPropertyValue("--sticky-pin")) : NaN,
      viewVar: main ? parseFloat(main.style.getPropertyValue("--sticky-view")) : NaN,
      stuck: bar?.hasAttribute("data-stuck") ?? false,
      searching: bar?.hasAttribute("data-searching") ?? false,
      innerScroll: inner?.scrollTop ?? -1,
      innerOverflow: inner ? inner.scrollHeight - inner.clientHeight : -1,
    };
  }, innerSelector);
}

for (const width of [1440, 834] as const) {
  test(`list page trackpad pin, fling-up hold, and new-gesture unpin 5x in a row at ${width}px (normal + selection mode)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 820 });
    await page.goto("/demo/sticky-list/");
    await expect(page.locator("[data-sticky-bar]")).toBeVisible();
    await page.waitForFunction(() => {
      const m = document.getElementById("main");
      return m && parseFloat(m.style.getPropertyValue("--sticky-pin")) > 0;
    });

    const bodyBox = await page.locator("[data-page-body]").boundingBox();
    expect(bodyBox).not.toBeNull();
    const cx = bodyBox!.x + bodyBox!.width / 2;
    const cy = bodyBox!.y + Math.min(200, bodyBox!.height / 2);

    const runCycle = async () => {
      // 1. Trackpad scroll down (small deltas + momentum) pins the bar and scrolls the inner list.
      await trackpadWheel(page, cx, cy, [24, 40, 64, 80, 96, 80, 56, 32, 16, 8]);
      const pinned = await readMetrics(page, "[data-page-body]");
      expect(pinned.stuck).toBe(true);
      expect(Math.abs(pinned.mainScroll - pinned.pinVar)).toBeLessThanOrEqual(2);
      // Exact scroll range equals pin height.
      expect(Math.abs(pinned.mainRange - pinned.pinVar)).toBeLessThanOrEqual(2);
      expect(pinned.innerScroll).toBeGreaterThan(0);

      // 2. Fast upward fling + momentum tail: scrolls inner list to top (0) and STOPS at the pin (never unpins).
      await trackpadWheel(page, cx, cy, [-180, -240, -240, -180, -120, -64, -32, -16, -8]);
      const afterFling = await readMetrics(page, "[data-page-body]");
      expect(afterFling.innerScroll).toBe(0);
      expect(afterFling.stuck).toBe(true);
      expect(Math.abs(afterFling.mainScroll - afterFling.pinVar)).toBeLessThanOrEqual(2);

      // 3. Wait for gesture idle (> 400ms: the stop), then a NEW deliberate upward gesture from list top unpins.
      await page.waitForTimeout(460);
      await trackpadWheel(page, cx, cy, [-36, -48, -64, -48, -24]);
      const unpinned = await readMetrics(page, "[data-page-body]");
      expect(unpinned.mainScroll).toBe(0);
      expect(unpinned.stuck).toBe(false);
      await page.waitForTimeout(460);
    };

    // Repeat 5 times in normal mode.
    for (let i = 0; i < 5; i++) {
      await runCycle();
    }

    // Now select one row (enters selection mode) and verify scroll range + pin/fling/unpin still hold.
    const firstRowCheckbox = page.locator("tbody input[type='checkbox']").first();
    await firstRowCheckbox.check();
    await expect(page.locator("[data-selection-bar]").filter({ visible: true })).toBeVisible();
    const selRange = await readMetrics(page, "[data-page-body]");
    expect(Math.abs(selRange.mainRange - selRange.pinVar)).toBeLessThanOrEqual(2);
    await runCycle();
  });

  test(`list + reader page trackpad pin, independent panel scroll, fling-up hold, and unpin at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 820 });
    await page.goto("/demo/sticky-reader/?open=m-1");
    await expect(page.locator("[data-sticky-bar]")).toBeVisible();
    await page.waitForFunction(() => {
      const m = document.getElementById("main");
      return m && parseFloat(m.style.getPropertyValue("--sticky-pin")) > 0;
    });

    // At 834 (< lg), ListReaderLayout shows only the active reader pane when ?open= is set; at 1440 (lg+), both list and reader show.
    const primarySelector = width >= 1024 ? "[data-reader-list]" : "[data-reader-pane]";
    const primaryBox = await page.locator(primarySelector).boundingBox();
    expect(primaryBox).not.toBeNull();
    const lx = primaryBox!.x + primaryBox!.width / 2;
    const ly = primaryBox!.y + Math.min(200, primaryBox!.height / 2);

    // Pin and scroll primary panel.
    await trackpadWheel(page, lx, ly, [32, 48, 80, 96, 80, 48, 24]);
    const pinned = await readMetrics(page, primarySelector);
    expect(pinned.stuck).toBe(true);
    expect(Math.abs(pinned.mainScroll - pinned.pinVar)).toBeLessThanOrEqual(2);
    expect(pinned.innerScroll).toBeGreaterThan(0);

    // At 1440 (lg+), reader panel is also visible beside list and scrolls independently while page stays pinned.
    if (width >= 1024) {
      const readerBox = await page.locator("[data-reader-pane]").boundingBox();
      expect(readerBox).not.toBeNull();
      await trackpadWheel(page, readerBox!.x + readerBox!.width / 2, readerBox!.y + 180, [60, 80, 80]);
      const readerState = await readMetrics(page, "[data-reader-pane]");
      expect(readerState.stuck).toBe(true);
      expect(readerState.innerScroll).toBeGreaterThan(0);
    }

    // Fling up on primary panel stops at pin; new gesture unpins.
    await trackpadWheel(page, lx, ly, [-200, -240, -200, -120, -48, -16]);
    const held = await readMetrics(page, primarySelector);
    expect(held.innerScroll).toBe(0);
    expect(held.stuck).toBe(true);

    await page.waitForTimeout(460);
    await trackpadWheel(page, lx, ly, [-40, -64, -64, -32]);
    const unpinned = await readMetrics(page, primarySelector);
    expect(unpinned.mainScroll).toBe(0);
    expect(unpinned.stuck).toBe(false);
  });
}

test("focus pins on short list, chips do not pin, filter/sort/search keep state, and unmount cleans CSS vars", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 820 });
  await page.goto("/demo/sticky-list/?short=1");
  await page.waitForFunction(() => {
    const m = document.getElementById("main");
    return m && parseFloat(m.style.getPropertyValue("--sticky-pin")) > 0;
  });

  // Focusing a filter chip does NOT pin or set data-searching.
  const statusChip = page.locator("[data-sticky-bar]").getByRole("button", { name: "Trạng thái" });
  await statusChip.focus();
  await page.waitForTimeout(300);
  let m = await readMetrics(page, "[data-page-body]");
  expect(m.mainScroll).toBe(0);
  expect(m.stuck).toBe(false);
  expect(m.searching).toBe(false);

  // Changing filter while unpinned keeps it unpinned.
  await statusChip.click();
  await page.getByRole("dialog", { name: "Trạng thái" }).getByRole("checkbox", { name: "Đang xử lý" }).check();
  await page.keyboard.press("Escape");
  m = await readMetrics(page, "[data-page-body]");
  expect(m.stuck).toBe(false);
  expect(m.mainScroll).toBe(0);

  // Focusing the search input on a short list (2 rows) smoothly pins it in <= 250ms.
  const searchInput = page.locator("[data-sticky-bar] input[type='search']");
  await searchInput.focus();
  await expect(page.locator("[data-sticky-bar]")).toHaveAttribute("data-searching", "");
  await page.waitForTimeout(350);
  m = await readMetrics(page, "[data-page-body]");
  expect(m.stuck).toBe(true);
  expect(Math.abs(m.mainScroll - m.pinVar)).toBeLessThanOrEqual(2);

  // Typing a search that yields 0 results while pinned keeps it pinned.
  await searchInput.fill("no-matching-row-xyz");
  await page.waitForTimeout(100);
  m = await readMetrics(page, "[data-page-body]");
  expect(m.stuck).toBe(true);
  expect(Math.abs(m.mainScroll - m.pinVar)).toBeLessThanOrEqual(2);

  // Clearing search & changing sort while pinned keeps it pinned.
  await searchInput.fill("");
  await searchInput.blur();
  await page.locator("[data-sticky-bar]").getByRole("button", { name: /Sắp xếp/ }).filter({ visible: true }).click();
  await page.getByRole("menuitemradio", { name: "Giá trị cao" }).click();
  m = await readMetrics(page, "[data-page-body]");
  expect(m.stuck).toBe(true);

  // Unmounting StickyContextBar clears --sticky-pin, --sticky-view, and data-sticky-host.
  await page.getByTestId("toggle-bar").click();
  await expect(page.locator("[data-sticky-bar]")).toHaveCount(0);
  const cleaned = await page.evaluate(() => {
    const main = document.getElementById("main");
    return {
      host: main?.hasAttribute("data-sticky-host") ?? false,
      pin: main?.style.getPropertyValue("--sticky-pin") ?? "",
      view: main?.style.getPropertyValue("--sticky-view") ?? "",
    };
  });
  expect(cleaned).toEqual({ host: false, pin: "", view: "" });
});

test("BarActions slot: 2-slot cap, [•••][main] order, 8px gap, inset matches '/' hint, hidden on focus & out of a11y tree", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 820 });
  await page.goto("/demo/sticky-list/");
  await page.waitForFunction(() => {
    const m = document.getElementById("main");
    return m && parseFloat(m.style.getPropertyValue("--sticky-pin")) > 0;
  });

  const field = page.locator("[data-sticky-bar] [data-field-frame]");
  const actionsWrap = field.locator("[data-bar-actions]");

  // Unpinned: BarActions is hidden (out of a11y tree) and measure "/" hint inset from field right edge.
  await expect(actionsWrap).toBeHidden();
  await expect(field.getByRole("button", { name: "Tạo đơn" })).toHaveCount(0);
  const hintInset = await page.evaluate(() => {
    const f = document.querySelector("[data-sticky-bar] [data-field-frame]")!.getBoundingClientRect();
    const k = document.querySelector("[data-sticky-bar] [data-field-frame] kbd")!.getBoundingClientRect();
    return f.right - k.right;
  });

  // Pin by wheel down.
  const bodyBox = await page.locator("[data-page-body]").boundingBox();
  await trackpadWheel(page, bodyBox!.x + 120, bodyBox!.y + 120, [48, 80, 96]);
  await expect(page.locator("[data-sticky-bar]")).toHaveAttribute("data-stuck", "");
  await expect(actionsWrap).toBeVisible();

  // At most 2 slots: [•••][Tạo đơn], ••• on left, 8px apart, last inset matches "/" hint.
  const buttons = actionsWrap.locator("button");
  await expect(buttons).toHaveCount(2);
  await expect(buttons.nth(0)).toHaveAttribute("aria-label", "Thao tác khác");
  await expect(buttons.nth(1)).toHaveAttribute("aria-label", "Tạo đơn");

  const geom = await page.evaluate(() => {
    const f = document.querySelector("[data-sticky-bar] [data-field-frame]")!.getBoundingClientRect();
    const btns = Array.from(document.querySelectorAll("[data-bar-actions] button")).map((b) => b.getBoundingClientRect());
    return {
      gap: btns[1].left - btns[0].right,
      lastInset: f.right - btns[1].right,
      orderOk: btns[0].left < btns[1].left,
    };
  });
  expect(geom.orderOk).toBe(true);
  expect(Math.abs(geom.gap - 8)).toBeLessThanOrEqual(1);
  expect(Math.abs(geom.lastInset - hintInset)).toBeLessThanOrEqual(1.5);

  // Focusing the search field hides BarActions (out of a11y tree); blurring restores them.
  const searchInput = page.locator("[data-sticky-bar] input[type='search']");
  await searchInput.focus();
  await expect(actionsWrap).toBeHidden();
  await expect(field.getByRole("button", { name: "Tạo đơn" })).toHaveCount(0);
  await searchInput.blur();
  await expect(actionsWrap).toBeVisible();
});

test("URL state (#129, #124, #139): legacy rewrite, patch single entry, ?sort= sync/reload/Back, and single radio arrow keys", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 820 });

  // 1. Legacy params rewritten once after hydration with replace (zero extra history entries).
  await page.goto(`${PRERENDER_BASE}/sticky/list?status=done&old_q=SO-1002`);
  await expect(page).toHaveURL(/f\.status=done/);
  await expect(page).toHaveURL(/q=SO-1002/);
  await expect(page).not.toHaveURL(/[?&]status=/);
  await expect(page).not.toHaveURL(/[?&]old_q=/);
  const histAfterLegacy = await page.evaluate(() => history.length);

  // 2. patch() changes multiple filters in ONE history entry.
  await page.getByTestId("patch-filters").click();
  await expect(page).toHaveURL(/f\.status=done/);
  await expect(page).toHaveURL(/f\.box=sales/);
  const histAfterPatch = await page.evaluate(() => history.length);
  expect(histAfterPatch).toBe(histAfterLegacy + 1);

  // External replaceFilters replaces without adding a history entry.
  await page.getByTestId("replace-ext").click();
  await expect(page).toHaveURL(/f\.status=open/);
  expect(await page.evaluate(() => history.length)).toBe(histAfterPatch);

  // 3. ?sort=key.dir shared by FilterChipRow, DataTable, and FilterPanel; restores on reload and Back; onResultsChange matches.
  await page.locator("[data-sticky-bar] input[type='search']").fill("");
  await page.locator("[data-sticky-bar]").getByRole("button", { name: /Sắp xếp/ }).first().click();
  await page.getByRole("menuitemradio", { name: "Giá trị cao" }).click();
  await expect(page).toHaveURL(/sort=total\.desc/);
  await expect(page.getByTestId("result-ids")).toHaveText(/^SO-1039/);

  await page.reload();
  await expect(page).toHaveURL(/sort=total\.desc/);
  await expect(page.getByTestId("result-ids")).toHaveText(/^SO-1039/);

  await page.goBack();
  await expect(page).not.toHaveURL(/sort=total\.desc/);
  await expect(page.getByTestId("result-ids")).toHaveText(/^SO-1003/);

  // 4. #139: empty single chip is disabled (cannot open empty menu).
  const emptyChip = page.locator("[data-sticky-bar]").getByRole("button", { name: "Kho hàng" });
  await expect(emptyChip).toBeDisabled();

  // 5. #139: FilterPanel single radiogroup has accessible name (no extra wrapping role="group") and arrowing adds ZERO history entries.
  await page.getByTestId("open-panel").click();
  const dialog = page.getByRole("dialog", { name: "Bộ lọc" });
  await expect(dialog).toBeVisible();
  // "Hộp thư" is active (f.box=sales), so FilterPanel opens its accordion automatically.
  const radioGroup = dialog.getByRole("radiogroup", { name: "Hộp thư" });
  await expect(radioGroup).toBeVisible();
  const hasExtraGroup = await radioGroup.evaluate((el) => Boolean(el.parentElement?.getAttribute("role") === "group"));
  expect(hasExtraGroup).toBe(false);

  const histBeforeArrows = await page.evaluate(() => history.length);
  const checkedRadio = radioGroup.locator("input[type='radio']:checked");
  await checkedRadio.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(page).toHaveURL(/f\.box=/);
  expect(await page.evaluate(() => history.length)).toBe(histBeforeArrows);

  // 6. DataTable.onResultsChange with inline rows/columns + setState does not infinite-loop.
  await page.waitForTimeout(200);
  const calls1 = Number(await page.getByTestId("results-calls").textContent());
  await page.waitForTimeout(200);
  const calls2 = Number(await page.getByTestId("results-calls").textContent());
  expect(calls1).toBeGreaterThan(0);
  expect(calls1).toBeLessThan(15);
  expect(calls2).toBe(calls1);
});

test("short-list focus-pin works below md (< 768px), reduced-motion pins instantly, and wheel cancels smoothTo", async ({ page }) => {
  // (a) Short-list focus-pin at < 768px (phone viewport, no layout-pin CSS).
  await page.setViewportSize({ width: 430, height: 820 });
  await page.goto("/demo/sticky-list/?short=1");
  await page.waitForFunction(() => {
    const m = document.getElementById("main");
    return m && parseFloat(m.style.getPropertyValue("--sticky-pin")) > 0;
  });
  const phoneInput = page.locator("[data-sticky-bar] input[type='search']");
  await phoneInput.focus();
  await page.waitForTimeout(350);
  const phoneMetrics = await readMetrics(page, "[data-page-body]");
  expect(phoneMetrics.stuck).toBe(true);
  expect(Math.abs(phoneMetrics.mainScroll - phoneMetrics.pinVar)).toBeLessThanOrEqual(2);

  // (b1) Reduced-motion pins synchronously without waiting 250ms.
  await page.setViewportSize({ width: 1440, height: 820 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/sticky-list/?short=1");
  await page.waitForFunction(() => {
    const m = document.getElementById("main");
    return m && parseFloat(m.style.getPropertyValue("--sticky-pin")) > 0;
  });
  const reducedInput = page.locator("[data-sticky-bar] input[type='search']");
  await reducedInput.focus();
  const reducedScroll = await page.evaluate(() => {
    const m = document.getElementById("main")!;
    return { y: m.scrollTop, pin: parseFloat(m.style.getPropertyValue("--sticky-pin")) };
  });
  expect(Math.abs(reducedScroll.y - reducedScroll.pin)).toBeLessThanOrEqual(2);

  // (b2) Wheel during smoothTo cancels the animation and fallback timer does not snap back to pin.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/demo/sticky-list/");
  await page.waitForFunction(() => {
    const m = document.getElementById("main");
    return m && parseFloat(m.style.getPropertyValue("--sticky-pin")) > 0;
  });
  const desktopInput = page.locator("[data-sticky-bar] input[type='search']");
  await desktopInput.focus();
  await page.waitForTimeout(30);
  await page.evaluate(() => {
    const m = document.getElementById("main")!;
    m.dispatchEvent(new WheelEvent("wheel", { deltaY: -40, bubbles: true, cancelable: true }));
    m.scrollTop = 0;
  });
  await page.waitForTimeout(360);
  const afterCancel = await readMetrics(page, "[data-page-body]");
  expect(afterCancel.mainScroll).toBeLessThan(afterCancel.pinVar - 2);
  expect(afterCancel.stuck).toBe(false);
});

// #207: one upward gesture never unpins, with or without layout-pin. Replays (all events cancelable) a long continuous
// wheel, a slow trackpad with 150-250ms pauses and a fling with momentum on the layout-pin list and on the padded doc
// example (no layout-pin); data-stuck must never clear during the gesture, then a stop + a new upward gesture unpins.
const SLOW_BURSTS = Array.from({ length: 14 }, () => [-12, -20, -24, -12]);
const GESTURES_207: { name: string; run: (page: Page, x: number, y: number) => Promise<void> }[] = [
  { name: "long continuous wheel", run: (page, x, y) => trackpadWheel(page, x, y, Array(70).fill(-40)) },
  {
    name: "slow trackpad with 150-250ms pauses",
    run: async (page, x, y) => {
      for (const [i, burst] of SLOW_BURSTS.entries()) {
        // Plus ~50ms (more under load) for the last wheel of a burst to go through: ~150-250ms between two wheel events.
        if (i) await page.waitForTimeout([100, 150, 200][i % 3]);
        await trackpadWheel(page, x, y, burst);
      }
    },
  },
  {
    name: "fling with momentum",
    run: (page, x, y) =>
      trackpadWheel(page, x, y, [-180, -240, -240, -200, -160, -120, -96, -72, -56, -40, -32, -24, -16, -12, -8, -6, -4, -2, -1]),
  },
];
const TARGETS_207 = [
  { name: "layout-pin list", url: "/demo/sticky-list/", host: "#main", over: "[data-page-body]", down: 800 },
  { name: "padded doc example without layout-pin", url: "/components/sticky-context-bar/", host: "[data-sticky-host]", over: "[data-sticky-host]", down: 800 },
];

for (const target of TARGETS_207) {
  test(`#207 ${target.name}: a long, a slow and a fling upward gesture never unpin; a stop + new gesture does`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 820 });
    await page.goto(target.url);
    await page.waitForFunction(
      (sel) => parseFloat(document.querySelector<HTMLElement>(sel)?.style.getPropertyValue("--sticky-pin") || "0") > 0,
      target.host,
    );
    await page.evaluate((sel) => document.querySelector(sel)!.scrollIntoView({ block: "center" }), target.host);
    await page.waitForTimeout(200);
    const box = (await page.locator(target.over).first().boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + Math.min(box.height - 40, 200);
    // Records every data-stuck change with its time.
    await page.evaluate((sel) => {
      const bar = document.querySelector(sel)!.querySelector("[data-sticky-bar]")!;
      const w = window as unknown as { __stuckLog: [number, boolean][]; __wheels: number[] };
      w.__stuckLog = [];
      w.__wheels = [];
      window.addEventListener("wheel", () => w.__wheels.push(performance.now()), { capture: true, passive: true });
      new MutationObserver(() => w.__stuckLog.push([performance.now(), bar.hasAttribute("data-stuck")])).observe(bar, {
        attributes: true,
        attributeFilter: ["data-stuck"],
      });
    }, target.host);
    const read = () =>
      page.evaluate((sel) => {
        const h = document.querySelector<HTMLElement>(sel)!;
        return {
          now: performance.now(),
          st: h.scrollTop,
          pin: parseFloat(h.style.getPropertyValue("--sticky-pin")),
          stuck: h.querySelector("[data-sticky-bar]")!.hasAttribute("data-stuck"),
          log: (window as unknown as { __stuckLog: [number, boolean][] }).__stuckLog,
          wheels: (window as unknown as { __wheels: number[] }).__wheels,
        };
      }, target.host);

    for (const g of GESTURES_207) {
      // Pin and scroll well past it (the list with layout-pin, the scroller itself without).
      await trackpadWheel(page, x, y, Array(Math.round(target.down / 80)).fill(80));
      await page.waitForTimeout(460);
      const start = await read();
      expect(start.stuck, `${g.name}: stuck before`).toBe(true);
      await g.run(page, x, y);
      const held = await read();
      const cleared = held.log.filter(([t, stuck]) => t >= start.now && !stuck);
      // The input really is one gesture: no pause between two of its wheel events reaches the 400ms "stop".
      const wheels = held.wheels.filter((t) => t >= start.now);
      const gaps = wheels.slice(1).map((t, i) => Math.round(t - wheels[i]));
      // First: if a pause reached the stop, the input was two gestures and the run proves nothing about the bar.
      expect(Math.max(...gaps), `${g.name}: longest pause inside the gesture (input, not the bar)`).toBeLessThan(400);
      expect(cleared, `${g.name}: data-stuck cleared during the gesture (wheel gaps ${gaps.filter((d) => d > 40).join(", ")} ms)`).toEqual([]);
      expect(held.stuck, `${g.name}: still stuck`).toBe(true);
      expect(Math.abs(held.st - held.pin), `${g.name}: held at the pin`).toBeLessThanOrEqual(2);
      // The stop, then a new upward gesture unpins.
      await page.waitForTimeout(460);
      await trackpadWheel(page, x, y, [-36, -48, -64, -48, -24]);
      await page.waitForTimeout(300);
      expect((await read()).stuck, `${g.name}: a new gesture after the stop unpins`).toBe(false);
    }
  });
}

// #207 review: two more ways one gesture could unpin.
// (1) A trackpad sequence whose first event is pure horizontal (deltaY 0): Chrome only lets that first event be
//     cancelled, so without layout-pin the bar must prevent it, or the vertical rest scrolls natively past the pin.
// (2) A gesture that starts above the pin going down, pins, and reverses within the same gesture must stay pinned.
const TARGETS_207_REVIEW = [
  { name: "layout-pin list", url: "/demo/sticky-list/", host: "#main", over: "[data-page-body]", width: 1440, layout: true },
  { name: "page scroller below md", url: "/demo/sticky-list/", host: "#main", over: "#main", width: 700, layout: false },
  { name: "padded doc example", url: "/components/sticky-context-bar/", host: "[data-sticky-host]", over: "[data-sticky-host]", width: 1440, layout: false },
];

async function setup207(page: Page, t: (typeof TARGETS_207_REVIEW)[number]) {
  await page.setViewportSize({ width: t.width, height: 820 });
  await page.goto(t.url);
  await page.waitForFunction(
    (sel) => parseFloat(document.querySelector<HTMLElement>(sel)?.style.getPropertyValue("--sticky-pin") || "0") > 0,
    t.host,
  );
  await page.evaluate((sel) => document.querySelector(sel)!.scrollIntoView({ block: "center" }), t.host);
  await page.waitForTimeout(200);
  const box = (await page.locator(t.over).first().boundingBox())!;
  await page.evaluate((sel) => {
    const bar = document.querySelector(sel)!.querySelector("[data-sticky-bar]")!;
    const w = window as unknown as { __stuckLog: [number, boolean][]; __wheel: [number, number, boolean, boolean][] };
    w.__stuckLog = [];
    w.__wheel = [];
    // Bubbling listener on window: runs after the bar's handler on the scroller, so defaultPrevented is its verdict.
    window.addEventListener("wheel", (e) => w.__wheel.push([e.deltaX, e.deltaY, e.cancelable, e.defaultPrevented]), { passive: true });
    new MutationObserver(() => w.__stuckLog.push([performance.now(), bar.hasAttribute("data-stuck")])).observe(bar, {
      attributes: true,
      attributeFilter: ["data-stuck"],
    });
  }, t.host);
  const read = () =>
    page.evaluate((sel) => {
      const h = document.querySelector<HTMLElement>(sel)!;
      const w = window as unknown as { __stuckLog: [number, boolean][]; __wheel: [number, number, boolean, boolean][] };
      return {
        now: performance.now(),
        st: h.scrollTop,
        pin: parseFloat(h.style.getPropertyValue("--sticky-pin")),
        stuck: h.querySelector("[data-sticky-bar]")!.hasAttribute("data-stuck"),
        log: w.__stuckLog,
        wheel: w.__wheel,
      };
    }, t.host);
  return { x: box.x + box.width / 2, y: box.y + Math.min(box.height - 40, 200), read };
}

for (const t of TARGETS_207_REVIEW) {
  test(`#207 ${t.name}: an upward gesture whose first event is pure horizontal stays pinned`, async ({ page }) => {
    const { x, y, read } = await setup207(page, t);
    await trackpadWheel(page, x, y, Array(10).fill(80));
    await page.waitForTimeout(460);
    const start = await read();
    expect(start.stuck, "stuck before").toBe(true);
    const from = start.wheel.length;
    await page.mouse.move(x, y);
    await page.mouse.wheel(-30, 0);
    await page.waitForTimeout(16);
    await trackpadWheel(page, x, y, Array(40).fill(-40));
    const held = await read();
    const first = held.wheel[from];
    expect(first.slice(0, 2), "the gesture starts sideways").toEqual([-30, 0]);
    if (!t.layout) expect(first[3], "the horizontal first event is prevented while the bar holds").toBe(true);
    expect(held.log.filter(([at, stuck]) => at >= start.now && !stuck), "data-stuck cleared during the gesture").toEqual([]);
    expect(Math.abs(held.st - held.pin), "held at the pin").toBeLessThanOrEqual(2);
    await page.waitForTimeout(460);
    await trackpadWheel(page, x, y, [-36, -48, -64, -48, -24]);
    await page.waitForTimeout(300);
    expect((await read()).stuck, "a new gesture after the stop unpins").toBe(false);
  });

  test(`#207 ${t.name}: a gesture that pins on the way down and reverses stays pinned`, async ({ page }) => {
    const { x, y, read } = await setup207(page, t);
    const start = await read();
    expect(start.stuck, "not stuck before").toBe(false);
    expect(start.st).toBeLessThan(start.pin);
    // One gesture (16ms apart): down past the pin, then straight back up much further than it went down.
    await trackpadWheel(page, x, y, [...Array(8).fill(40), ...Array(30).fill(-40)]);
    const held = await read();
    const changes = held.log.filter(([at]) => at >= start.now).map(([, stuck]) => stuck);
    expect(changes, "data-stuck is set once and never cleared within the gesture").toEqual([true]);
    expect(Math.abs(held.st - held.pin), "held at the pin").toBeLessThanOrEqual(2);
    await page.waitForTimeout(460);
    await trackpadWheel(page, x, y, [-36, -48, -64, -48, -24]);
    await page.waitForTimeout(300);
    expect((await read()).stuck, "a new gesture after the stop unpins").toBe(false);
  });
}

test("#207 padded doc example under reduced motion: a driven wheel step lands at once (no easing)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const t = TARGETS_207_REVIEW[2];
  const { x, y, read } = await setup207(page, t);
  await trackpadWheel(page, x, y, Array(10).fill(80));
  await page.waitForTimeout(460);
  const start = await read();
  expect(start.stuck).toBe(true);
  expect(start.st - start.pin).toBeGreaterThan(150);
  await page.mouse.wheel(0, -120);
  // Two frames: an eased step (45% of the rest per frame) would still be on its way.
  const st = await page.evaluate(
    (sel) =>
      new Promise<number>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r(document.querySelector<HTMLElement>(sel)!.scrollTop))),
      ),
    t.host,
  );
  expect(Math.abs(st - (start.st - 120))).toBeLessThanOrEqual(1);
});
