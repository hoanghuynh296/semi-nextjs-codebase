// #186: on a touch phone (pointer: coarse, below sm) every icon-only button and every small dismiss / remove / clear
// control has a hit area of at least 44 × 44px: the element itself (BTN_HIT, dense rows) or its ::before (HIT_AREA,
// isolated controls). With a mouse the drawn size stays (owner direction C-014).
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** The hit box of a control: its own box, or its absolutely positioned ::before when that is larger. */
async function hitBox(el: Locator) {
  return el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    const b = getComputedStyle(node, "::before");
    const pseudo = b.content !== "none" && b.position === "absolute";
    const w = Math.max(r.width, pseudo ? parseFloat(b.width) || 0 : 0);
    const h = Math.max(r.height, pseudo ? parseFloat(b.height) || 0 : 0);
    return { x: r.x + r.width / 2 - w / 2, y: r.y + r.height / 2 - h / 2, w, h, drawn: [Math.round(r.width), Math.round(r.height)] };
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
  ["sources", 'a[aria-label^="Nguồn 1"]', "Sources citation chip", [17, 16]],
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
  }
  // Carousel dots: the dot stays 6px high, its hit area is 44
  await page.goto("/components/carousel/");
  await hydrated(page);
  const dot = await hitBox(page.locator("main").getByRole("button", { name: /2$/ }).filter({ hasNotText: /./ }).last());
  expect(dot.drawn[1]).toBe(6);
  expect(Math.min(dot.w, dot.h)).toBeGreaterThanOrEqual(44);
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
  // the phone window: first, current, last (the example is page 3 of 12)
  await page.goto("/components/pagination/");
  await hydrated(page);
  await expect(page.locator("main nav[aria-label]").first().getByRole("button")).toHaveText(["", "1", "3", "12", ""]);
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
  // the wide pager window comes back
  await page.goto("/components/pagination/");
  await expect(page.locator("main nav[aria-label]").first().getByRole("button", { name: "Trang 2", exact: true })).toBeVisible();
});
