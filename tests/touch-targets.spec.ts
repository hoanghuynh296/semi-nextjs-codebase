// #186: on a touch phone (pointer: coarse, below sm) every icon-only button and every small dismiss / remove / clear
// control has a hit area of at least 44 × 44px: the element itself (BTN_HIT, dense rows) or its ::before (HIT_AREA,
// isolated controls). With a mouse the drawn size stays (owner direction C-014).
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** The hit box of a control: its own box, or its absolutely positioned ::before when that is larger (sized from the
 *  pseudo-element's computed size around the control's centre). It is then proven with elementFromPoint 2px inside each
 *  edge: a tap there must land on the control itself (a pseudo-element hit reports its host), not on a neighbour. */
async function hitBox(el: Locator) {
  await el.evaluate((node) => node.scrollIntoView({ block: "center", inline: "center" }));
  return el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    const b = getComputedStyle(node, "::before");
    const pseudo = b.content !== "none" && b.position === "absolute";
    const w = Math.max(r.width, pseudo ? parseFloat(b.width) || 0 : 0);
    const h = Math.max(r.height, pseudo ? parseFloat(b.height) || 0 : 0);
    const [cx, cy] = [r.x + r.width / 2, r.y + r.height / 2];
    const edges = [[cx - w / 2 + 2, cy], [cx + w / 2 - 2, cy], [cx, cy - h / 2 + 2], [cx, cy + h / 2 - 2]];
    const lands = edges.every(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return !!hit && (hit === node || node.contains(hit));
    });
    return { x: cx - w / 2, y: cy - h / 2, w, h, lands, drawn: [Math.round(r.width), Math.round(r.height)] };
  });
}

/** Waits until React has adopted the page, so a hydration pass does not swap the nodes under the test. */
async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector("main");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  });
}

// [doc page, locator inside main, name, drawn size with a mouse]
const CONTROLS: [string, string, string, [number, number]][] = [
  ["subpage-toolbar", '[data-example="subpage-toolbar/refresh"] button[aria-label="Làm mới"]', "icon-only Button (BTN_ICON)", [34, 34]],
  ["subpage-toolbar", '[data-example="subpage-toolbar/list-page"] button[aria-label="Thêm máy in"]', "SubpageToolbar add CTA", [34, 34]],
  ["menu", 'button[aria-label="Thao tác máy in"]', "Menu trigger", [34, 34]],
  ["app-header", 'button[aria-label="Trợ lý AI"]', "AppHeader icon button", [34, 34]],
  ["ai-chat", '[data-example="ai-chat/workspace"] button[aria-label="Đóng"]', "AiChat close (MODAL_CLOSE)", [32, 32]],
  ["card-actions", '[data-example="card-actions/grid"] button[aria-label^="Thao tác với"] >> visible=true', "CardActions trigger", [32, 32]],
  ["view-switch", 'button[aria-label="Lưới"]', "ViewSwitch item", [32, 32]],
  ["pagination", 'button[aria-label="Trang sau"]', "Pagination button", [32, 32]],
  ["calendar", '[data-example="calendar/single"] button[aria-label="Tháng sau"]', "Calendar month nav", [32, 32]],
  ["guided-empty-state", 'button[aria-label="Bước sau"]', "GuidedEmptyState step nav", [32, 32]],
  ["alert", 'button[aria-label="Bỏ qua"]', "Alert dismiss", [24, 24]],
  ["multi-combobox", '[data-example="multi-combobox/basic"] button[aria-label^="Bỏ chọn"]', "MultiCombobox chip remove", [24, 24]],
  ["combobox", '[data-example="combobox/basic"] button[aria-hidden="true"]', "CustomCombobox chevron", [22, 22]],
  ["side-panel", 'button[aria-label="Thu gọn bảng cài đặt"]', "SidePanel collapse", [28, 28]],
];

test("touch phone 390x844: icon-only buttons and small dismiss / remove controls have a 44 × 44 hit area (#186)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  let at = "";
  for (const [doc, sel, name] of CONTROLS) {
    if (doc !== at) {
      await page.goto(`/components/${doc}/`);
      await hydrated(page);
      at = doc;
    }
    const box = await hitBox(page.locator("main").locator(sel).first());
    expect.soft(Math.min(box.w, box.h), name).toBeGreaterThanOrEqual(44);
    expect.soft(box.lands, `${name}: a tap near each edge of the 44px box lands on it`).toBe(true);
  }
  // Carousel dots: the dot stays 6px high, its hit area is 44
  await page.goto("/components/carousel/");
  await hydrated(page);
  const dot = await hitBox(page.locator("main").getByRole("button", { name: /2$/ }).filter({ hasNotText: /./ }).last());
  expect(await page.locator("main").getByRole("button", { name: /2$/ }).filter({ hasNotText: /./ }).last().locator("span").evaluate((s) => s.getBoundingClientRect().height)).toBe(6);
  expect(Math.min(dot.w, dot.h)).toBeGreaterThanOrEqual(44);
  expect(dot.lands).toBe(true);
  await page.close();
});

test("touch phone: Pagination and ViewSwitch grow instead, on one row, and adjacent hit areas do not overlap (#186)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const [doc, group] of [["pagination", "main nav[aria-label]"], ["view-switch", 'main [role="group"]']]) {
    await page.goto(`/components/${doc}/`);
    await hydrated(page);
    const buttons = page.locator(group).first().locator("button >> visible=true");
    const boxes = [];
    for (let i = 0; i < (await buttons.count()); i++) boxes.push(await hitBox(buttons.nth(i)));
    expect(boxes.length).toBeGreaterThan(2);
    expect(new Set(boxes.map((b) => Math.round(b.y))).size, `${doc}: one row`).toBe(1);
    for (const [i, b] of boxes.entries()) {
      expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(44);
      if (i) expect(b.x, `${doc}: no overlap`).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].w - 0.5);
    }
  }
  await page.close();
});

test("touch phone: Pagination renders one list (first · current · last), steps by keyboard and fits 320px (#186)", async ({ browser, request }) => {
  // server HTML: one list, the full window (the phone window is chosen after mount)
  const html = await (await request.get("/components/pagination/")).text();
  expect(html.split('aria-label="Trang 1"').length - 1).toBe(1);
  const page = await browser.newPage({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true });
  await page.goto("/components/pagination/");
  await hydrated(page);
  const nav = page.locator('[data-example="pagination/basic"] nav');
  await expect(nav.getByRole("button")).toHaveText(["", "1", "3", "12", ""]);
  expect(await page.locator('button[aria-label="Trang 1"]').count()).toBe(1); // no hidden duplicate
  // one row, inside the padded example card
  const fit = await nav.evaluate((n) => {
    const card = n.closest("[data-example]")!.querySelector(":scope > div:last-child") ?? n.parentElement!;
    const [nr, cr] = [n.getBoundingClientRect(), card.getBoundingClientRect()];
    const rows = new Set([...n.querySelectorAll("button")].map((b) => Math.round(b.getBoundingClientRect().y))).size;
    return { rows, inside: nr.left >= cr.left - 0.5 && nr.right <= cr.right + 0.5, overflow: document.documentElement.scrollWidth - innerWidth };
  });
  expect(fit).toEqual({ rows: 1, inside: true, overflow: 0 });
  // keyboard: Enter on "Trang sau" steps the page; focus stays on it; Tab walks the condensed list
  const next = nav.getByRole("button", { name: "Trang sau" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(nav.locator('[aria-current="page"]')).toHaveText("4");
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(nav.locator('[aria-current="page"]')).toHaveText("5");
  await expect(nav.getByRole("button")).toHaveText(["", "1", "5", "12", ""]);
  await nav.getByRole("button", { name: "Trang 1", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("button", { name: "Trang 5", exact: true })).toBeFocused();
  await page.keyboard.press("Enter"); // the current page: nothing changes
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(nav.locator('[aria-current="page"]')).toHaveText("1");
  await page.close();
});

test("touch phone: adjacent Citation chips [2][3] get their own taps, 44px tall, no overlap (#186)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto("/components/sources/");
  await hydrated(page);
  const ex = page.locator('[data-example="sources/answer"]');
  const [two, three] = [ex.locator('a[aria-label^="Nguồn 2"]').last(), ex.locator('a[aria-label^="Nguồn 3"]').last()];
  await two.scrollIntoViewIfNeeded();
  const res = await two.evaluate((a, b) => {
    const [r2, r3] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
    const at = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      return hit === a || a.contains(hit) ? 2 : hit === b || b.contains(hit) ? 3 : 0;
    };
    const cy = r2.y + r2.height / 2;
    const gap = r3.left - r2.right;
    return {
      gap: Math.round(gap),
      rightOf2: at(r2.right + gap / 4, cy), // the left half of the gap belongs to [2]
      leftOf3: at(r3.left - gap / 4, cy), // the right half to [3]
      middle: at(r2.right + gap / 2, cy) !== 0, // no dead strip between them
      twoNear3: at(r2.right - 1, cy), // the right edge of [2] opens [2], never [3]
      tall: [at(r2.x + r2.width / 2, cy - 20), at(r2.x + r2.width / 2, cy + 20)], // 44px tall on a touch phone
      notTaller: at(r2.x + r2.width / 2, cy - 24),
    };
  }, await three.elementHandle());
  expect(res).toEqual({ gap: 4, rightOf2: 2, leftOf3: 3, middle: true, twoNear3: 2, tall: [2, 2], notTaller: 0 });
  await page.close();
});

test("touch phone: the CustomCombobox chevron is its own 44px column; a tap just left of it lands on the input (#186)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto("/components/combobox/");
  await hydrated(page);
  const ex = page.locator('[data-example="combobox/basic"]');
  const chevron = ex.locator('button[aria-hidden="true"]').first();
  await chevron.scrollIntoViewIfNeeded();
  const res = await chevron.evaluate((btn) => {
    const input = btn.parentElement!.querySelector("input")!;
    const [b, i] = [btn.getBoundingClientRect(), input.getBoundingClientRect()];
    const cy = b.y + b.height / 2;
    const left = document.elementFromPoint(b.left - 2, cy);
    return {
      size: [Math.round(b.width), Math.round(b.height)],
      flushRight: Math.round(i.right - b.right),
      textClear: Math.round(i.right - parseFloat(getComputedStyle(input).paddingRight) - b.left) <= 0, // the text area ends where the column starts
      leftOfColumn: left === input,
    };
  });
  expect(res).toEqual({ size: [44, 44], flushRight: 0, textClear: true, leftOfColumn: true });
  await page.close();
});

test("mouse 1440: the drawn size of every control stays (#186)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let at = "";
  for (const [doc, sel, name, drawn] of CONTROLS) {
    if (doc !== at) {
      await page.goto(`/components/${doc}/`);
      await hydrated(page);
      at = doc;
    }
    expect.soft((await hitBox(page.locator("main").locator(sel).first())).drawn, name).toEqual(drawn);
  }
  for (const [doc, sel, name, drawn] of [["sources", 'a[aria-label^="Nguồn 1"]', "Sources citation chip", [17, 16]]] as const) {
    await page.goto(`/components/${doc}/`);
    expect.soft((await hitBox(page.locator("main").locator(sel).first())).drawn, name).toEqual(drawn);
  }
  // the wide pager window comes back
  await page.goto("/components/pagination/");
  await expect(page.locator("main nav[aria-label]").first().getByRole("button", { name: "Trang 2", exact: true })).toBeVisible();
});
