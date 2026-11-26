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

test("touch phone: adjacent Citation chips [2][3] get their own taps, 44px tall, at least 24px wide, no overlap (#186)", async ({ browser }) => {
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
      wide: Math.round(r2.width + gap) >= 24, // its area reaches half the gap on each side
    };
  }, await three.elementHandle());
  expect(res).toEqual({ gap: 8, rightOf2: 2, leftOf3: 3, middle: true, twoNear3: 2, tall: [2, 2], notTaller: 0, wide: true });
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

// Carousel dots: real boxes, no pseudo-element, so a tap on a dot never opens its neighbour, on a tablet or with a mouse.
for (const [label, opts, min] of [
  ["touch tablet 820x1180", { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true }, 44],
  ["mouse 1440", { viewport: { width: 1440, height: 900 } }, 24],
] as const) {
  test(`${label}: Carousel dots are ${min}px boxes side by side, and a tap near a dot's edge opens that dot (#186)`, async ({ browser }) => {
    const page = await browser.newPage(opts);
    await page.goto("/components/carousel/");
    await hydrated(page);
    const dots = page.locator("main").getByRole("button", { name: /\d$/ }).filter({ hasNotText: /./ });
    await expect(dots.first()).toBeVisible();
    await dots.first().scrollIntoViewIfNeeded();
    const res = await dots.first().evaluate((first) => {
      const all = [...first.parentElement!.querySelectorAll("button")];
      return all.map((d, i) => {
        const r = d.getBoundingClientRect();
        const cy = r.y + r.height / 2;
        const at = (x: number, y: number) => all.indexOf(document.elementFromPoint(x, y)?.closest("button") as HTMLButtonElement);
        const pseudo = getComputedStyle(d, "::before").content !== "none";
        return { size: Math.min(r.width, r.height), left: at(r.left + 1, cy), right: at(r.right - 1, cy), top: at(r.x + r.width / 2, r.top + 1), bottom: at(r.x + r.width / 2, r.bottom - 1), i, pseudo };
      });
    });
    expect(res.length).toBeGreaterThan(1);
    for (const d of res) {
      expect(d.size).toBeGreaterThanOrEqual(min);
      expect([d.left, d.right, d.top, d.bottom, d.pseudo]).toEqual([d.i, d.i, d.i, d.i, false]);
    }
    await page.close();
  });
}

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


// #187: selection controls (tabs, segmented, chips, checkbox / radio / switch rows, breadcrumb, table header, stepper).
// Dense rows grow their items to 44px on a touch phone (BTN_HIT, real size); a labelled Checkbox / Radio / Switch row is
// the target (12px padding there); a box without a label keeps HIT_AREA. [doc page, locator inside main, name, drawn
// size with a mouse at 1440]
const SELECTION: [string, string, string, [number, number]][] = [
  ["segmented-control", '[data-example="segmented-control/counts"] [data-density-view] [role="radio"]', "SegmentedControl item", [81, 24]],
  ["subpage-toolbar", '[data-example="subpage-toolbar/list-page"] [data-density-view] [role="radio"]', "SubpageToolbar status segments", [68, 24]],
  ["workspace-layout", '[data-example="workspace-layout/request"] [data-density-view] [role="radio"]', "WorkspaceHeader tabs", [86, 24]],
  ["chat-model-picker", 'button[aria-label^="Model AI"]', "ChatModelPicker chip", [68, 24]],
  ["pill-tabs", '[data-example="pill-tabs/sections"] [data-density-view] [role="tab"]', "PillTabs tab", [98, 30]],
  ["text-tabs", '[data-example="text-tabs/heading"] [data-density-view] [role="tab"]', "TextTabs tab", [126, 34]],
  ["tabs", '[data-example="tabs/underline"] [data-density-view] [role="tab"]', "Tabs tab", [89, 36]],
  ["filter-chip-row", '[data-example="filter-chip-row/many"] [data-density-view] [role="group"] button >> nth=1', "FilterChipRow chip", [140, 32]],
  ["filter-chip-row", '[data-example="filter-chip-row/many"] [data-density-view] button:text-is("Xoá lọc")', "FilterChipRow clear", [64, 32]],
  ["menubar", '[role="menubar"] [role="menuitem"]', "Menubar menu", [41, 28]],
  ["theme", '[data-example="theme/switchers"] [data-density-view] [role="radio"][aria-label="Tối"] >> nth=1', "ThemeSwitcher option (icon)", [32, 26]],
  ["toggle", '[data-example="toggle/toggle"] [data-density-view] button[aria-pressed]', "Toggle", [76, 34]],
  ["toggle", '[data-example="toggle/group"] [data-density-view] [role="radio"]', "ToggleGroup option", [36, 26]],
  ["checkbox", '[data-example="checkbox/states"] [data-density-view] label', "Checkbox label row", [1094, 22]],
  ["checkbox", '[data-example="checkbox/row-select"] [data-density-view] input >> xpath=..', "Checkbox without label (HIT_AREA)", [16, 16]],
  ["radio-group", '[data-example="radio-group/basic"] [data-density-view] label', "RadioGroup label row", [1094, 46]],
  ["switch", '[data-example="switch/basic"] [data-density-view] label', "Switch label row", [172, 22]],
  ["switch", '[data-example="switch/card-header"] [data-density-view] [role="switch"]', "Switch without label (HIT_AREA)", [36, 20]],
  ["breadcrumb", '[data-example="breadcrumb/collapsed"] [data-density-view] nav a', "Breadcrumb link", [35, 18]],
  ["breadcrumb", '[data-example="breadcrumb/collapsed"] [data-density-view] button[aria-label="Hiện các mục ẩn"]', "Breadcrumb …", [15, 18]],
  ["data-table", '[data-example="data-table/orders"] [data-density-view] th[aria-sort] button', "DataTable sort header", [60, 18]],
  ["data-table", '[data-example="data-table/orders"] [data-density-view] th[data-check] input >> xpath=..', "DataTable select-all", [16, 16]],
  ["stepper", '[data-example="stepper/basic"] [data-density-view] button[aria-label^="Tăng"]', "Stepper +", [36, 36]],
  ["chip", '[data-example="chip/toggle"] [data-density-view] button[aria-pressed="false"]', "Chip (off)", [63, 34]],
];

test("touch phone 390x844: selection controls have a 44 × 44 hit area and a tap near each edge lands on them (#187)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  let at = "";
  for (const [doc, sel, name] of SELECTION) {
    if (doc !== at) {
      await page.goto(`/components/${doc}/`);
      await hydrated(page);
      at = doc;
    }
    const box = await hitBox(page.locator("main").locator(sel).first());
    expect.soft(Math.min(box.w, box.h), name).toBeGreaterThanOrEqual(44);
    expect.soft(box.lands, `${name}: a tap near each edge of the 44px box lands on it`).toBe(true);
  }
  await page.close();
});

test("touch phone: dense selection rows grow on one row, never overlap, and scroll sideways inside the page (#187)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const [doc, ex, item, scrolls] of [
    ["segmented-control", "overflow", '[role="radio"]', true],
    ["pill-tabs", "sections", '[role="tab"]', true],
    ["filter-chip-row", "many", '[role="group"] button', true],
    ["breadcrumb", "collapsed", "nav :is(a, button)", false],
    ["chip", "toggle", "button[aria-pressed]", false],
  ] as const) {
    await page.goto(`/components/${doc}/`);
    await hydrated(page);
    const preview = page.locator(`[data-example="${doc}/${ex}"] [data-density-view]`);
    await preview.scrollIntoViewIfNeeded();
    const res = await preview.evaluate((root, sel) => {
      const items = [...root.querySelectorAll<HTMLElement>(sel)].filter((n) => n.getClientRects().length);
      const boxes = items.map((n) => n.getBoundingClientRect());
      const scroller = items[0].parentElement!.closest<HTMLElement>(".overflow-x-auto, [role=group]") ?? items[0].parentElement!;
      return {
        count: items.length,
        rows: new Set(boxes.map((b) => Math.round(b.y))).size,
        minH: Math.round(Math.min(...boxes.map((b) => b.height))),
        overlap: boxes.some((b, i) => i > 0 && b.left < boxes[i - 1].right - 0.5 && Math.round(b.y) === Math.round(boxes[i - 1].y)),
        scrolls: scroller.scrollWidth > scroller.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    }, item);
    expect(res.count, doc).toBeGreaterThan(2);
    expect({ ...res, count: 0 }, doc).toEqual({ count: 0, rows: 1, minH: 44, overlap: false, scrolls, pageOverflow: 0 });
  }
  await page.close();
});

test("touch phone: a tap on a Checkbox / Radio / Switch label row toggles it once; Space on the switch too (#187)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  // tap the far right of the row (text or the empty end of the row), away from the box itself
  const tapRowEnd = async (row: import("@playwright/test").Locator) => {
    await row.scrollIntoViewIfNeeded();
    const b = (await row.boundingBox())!;
    await page.touchscreen.tap(b.x + b.width - 60, b.y + 4);
  };
  await page.goto("/components/switch/");
  await hydrated(page);
  const row = page.locator('[data-example="switch/basic"] [data-density-view] label').nth(1);
  const sw = row.getByRole("switch");
  const before = await sw.getAttribute("aria-checked");
  await tapRowEnd(row.locator("span").first());
  await expect(sw).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
  await sw.tap(); // the switch itself: one toggle, not two (the row is its label)
  await expect(sw).toHaveAttribute("aria-checked", before!);
  await sw.focus();
  await page.keyboard.press("Space");
  await expect(sw).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");

  await page.goto("/components/radio-group/");
  await hydrated(page);
  const radios = page.locator('[data-example="radio-group/basic"] [data-density-view] label');
  const second = radios.nth(1);
  await second.locator("span").first().tap({ position: { x: 4, y: 4 } });
  await expect(second.locator("input")).toBeChecked();
  await second.locator("input").focus();
  await page.keyboard.press("ArrowUp"); // the native radio group still moves by arrows (the third option is disabled)
  await expect(radios.nth(0).locator("input")).toBeChecked();

  await page.goto("/components/checkbox/");
  await hydrated(page);
  const box = page.locator('[data-example="checkbox/basic"] [data-density-view] label').first();
  const input = box.locator("input");
  const was = await input.isChecked();
  await tapRowEnd(box.locator("span").last());
  expect(await input.isChecked()).toBe(!was);
  await input.focus();
  await page.keyboard.press("Space");
  expect(await input.isChecked()).toBe(was);
  await page.close();
});

test("mouse 1440: the drawn size of every selection control stays (#187)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let at = "";
  for (const [doc, sel, name, drawn] of SELECTION) {
    if (name === "Switch label row") continue; // the row became the <label>; its switch is checked below
    if (doc !== at) {
      await page.goto(`/components/${doc}/`);
      await hydrated(page);
      at = doc;
    }
    expect.soft((await hitBox(page.locator("main").locator(sel).first())).drawn, name).toEqual(drawn);
  }
  await page.goto("/components/switch/");
  await hydrated(page);
  expect((await hitBox(page.locator('[data-example="switch/basic"] [role="switch"]').first())).drawn).toEqual([36, 20]);
});

test("touch phone 320: ToggleGroup is never wider than its container, scrolls inside its own track, keeps the focused option visible (#187)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true });
  for (const [path, group, overflows] of [
    ["/components/toggle/", '[data-example="toggle/group"] [data-density-view] [role="toolbar"]', false],
    ["/components/toggle/", '[data-example="toggle/group"] [data-density-view] [role="radiogroup"]', false],
    ["/icons/", '[role="radiogroup"][aria-label="Màu ô icon"]', true],
  ] as const) {
    await page.goto(path);
    await hydrated(page);
    const g = page.locator(group).first();
    await g.scrollIntoViewIfNeeded();
    const res = await g.evaluate((el) => {
      const items = [...el.querySelectorAll("button")].map((b) => b.getBoundingClientRect());
      const r = el.getBoundingClientRect();
      const parent = el.parentElement!.getBoundingClientRect();
      return {
        rows: new Set(items.map((b) => Math.round(b.y))).size,
        minH: Math.round(Math.min(...items.map((b) => b.height))),
        inside: r.left >= parent.left - 0.5 && r.right <= parent.right + 0.5,
        scrolls: el.scrollWidth > el.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(res, path + " " + group).toEqual({ rows: 1, minH: 44, inside: true, scrolls: overflows, pageOverflow: 0 });
    // ArrowRight to the last option: each focused option is in view inside the track
    const buttons = g.locator("button");
    const n = await buttons.count();
    await buttons.first().focus();
    for (let i = 1; i < n; i++) {
      await page.keyboard.press("ArrowRight");
      await expect(buttons.nth(i)).toBeFocused();
      const seen = await buttons.nth(i).evaluate((b) => {
        const [r, t] = [b.getBoundingClientRect(), b.parentElement!.getBoundingClientRect()];
        return r.left >= t.left - 1 && r.right <= t.right + 1 && r.right <= innerWidth + 1;
      });
      expect(seen, `${path} option ${i + 1} of ${n} in view`).toBe(true);
    }
  }
  await page.close();
});


// #190: Chip, TAG and Badge have no border; an unselected Chip has the subtle button fill (hover one step up), a
// selected one keeps its tint and shows a leading check; Space / Enter toggle it; Badge tone="overlay" blurs the media.
for (const theme of ["dark", "light"] as const) {
  test(`Chip and Badge without a border, Chip check and keyboard, Badge overlay · ${theme} (#190)`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("semi-theme", t), theme);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/components/chip/");
    await hydrated(page);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
    const style = (el: Locator) =>
      el.evaluate((n) => {
        const s = getComputedStyle(n);
        const probe = document.createElement("span");
        probe.className = "bg-subtle-button";
        n.parentElement!.append(probe);
        const subtle = getComputedStyle(probe).backgroundColor;
        probe.className = "bg-tint-hover";
        const hover = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { border: s.borderTopWidth, bg: s.backgroundColor, subtle, hover, checks: n.querySelectorAll("svg").length, h: Math.round(n.getBoundingClientRect().height) };
      });
    const offChip = page.locator('[data-example="chip/toggle"] [data-density-view] button[aria-pressed]').filter({ hasText: "PETG" });
    await expect(offChip).toHaveAttribute("aria-pressed", "false");
    const s0 = await style(offChip);
    expect(s0.border).toBe("0px");
    expect(s0.bg).toBe(s0.subtle);
    expect(s0.checks).toBe(0);
    expect(s0.h).toBe(34);
    await offChip.hover();
    const sh = await style(offChip);
    expect(sh.bg).toBe(sh.hover);
    // keyboard: Tab-reachable, Space turns it on (check appears, still no border), Enter turns it off again
    await offChip.focus();
    await page.keyboard.press("Space");
    await expect(offChip).toHaveAttribute("aria-pressed", "true");
    const s1 = await style(offChip);
    expect(s1.border).toBe("0px");
    expect(s1.checks).toBe(1);
    expect(s1.bg).not.toBe(s1.subtle);
    expect(s1.h).toBe(34);
    await page.keyboard.press("Enter");
    await expect(offChip).toHaveAttribute("aria-pressed", "false");
    expect((await style(offChip)).checks).toBe(0);

    await page.goto("/components/badge/");
    await hydrated(page);
    const badges = page.locator('[data-example="badge/tones"] [data-density-view] span.rounded-full');
    expect(await badges.count()).toBeGreaterThan(3);
    for (const w of await badges.evaluateAll((ns) => ns.map((n) => getComputedStyle(n).borderTopWidth))) expect(w).toBe("0px");
    const overlay = page.locator('[data-example="badge/overlay"] [data-density-view] span.rounded-full').first();
    const o = await overlay.evaluate((n) => {
      const s = getComputedStyle(n);
      return { border: s.borderTopWidth, blur: s.backdropFilter, fs: s.fontSize };
    });
    expect(o).toEqual({ border: "0px", blur: "blur(12px)", fs: "12px" });
  });
}
