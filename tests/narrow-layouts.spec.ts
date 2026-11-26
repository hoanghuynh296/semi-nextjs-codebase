// Narrow layouts (#188): the reader / detail header keeps the title at least 60% of the pane (actions wrap under it),
// the route header shows only the current page below sm and uses the content's 16px inset, and ListReaderLayout only
// sits side by side while the reader keeps 360px (else the reader replaces the list). Phone, tablet and small laptop.
import { expect, test, type Browser } from "@playwright/test";

const SIZES = [
  { width: 390, height: 844, phone: true },
  { width: 744, height: 1024, phone: false },
  { width: 1024, height: 768, phone: false },
] as const;

async function newPage(browser: Browser, size: (typeof SIZES)[number]) {
  const ctx = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    isMobile: size.phone,
    hasTouch: size.phone,
    colorScheme: "dark",
  });
  return ctx.newPage();
}

/** Visible crumbs of the route header, and the trail's left edge from the header's left edge. */
async function trail(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>('header nav[aria-label="Đường dẫn"]')!;
    const header = nav.closest("header")!;
    const items = [...nav.querySelectorAll<HTMLElement>("ol > li")].filter((li) => li.getBoundingClientRect().width > 0);
    const first = items[0].getBoundingClientRect();
    return {
      count: items.length,
      current: items.length === 1 && items[0].querySelector('[aria-current="page"]') !== null,
      inset: Math.round(first.left - header.getBoundingClientRect().left),
    };
  });
}

for (const path of ["/demo/list-reader/", "/demo/sticky-reader/?open=m-1"]) {
  for (const size of SIZES) {
    test(`reader header, breadcrumb and reader width · ${path} · ${size.width}px (#188)`, async ({ browser }) => {
      const page = await newPage(browser, size);
      await page.goto(path);
      const pane = page.locator("[data-reader-pane]");
      const list = page.locator("[data-reader-list]");
      const title = pane.locator("[data-reader-header] h2");
      await expect(title).toBeVisible();

      // the title (with its expand toggle when it is cut, #196) keeps at least 60% of the reader pane (the actions
      // wrap under it when they do not fit)
      const paneBox = (await pane.boundingBox())!;
      const titleBox = (await title.boundingBox())!;
      const blockBox = (await pane.locator("[data-reader-title]").boundingBox())!;
      expect(blockBox.width).toBeGreaterThanOrEqual(paneBox.width * 0.6);
      // long titles clamp to 3 lines (line height 24px), the full text stays in the tooltip
      expect(titleBox.height).toBeLessThanOrEqual(3 * 24 + 1);
      expect(await title.getAttribute("title")).toBeTruthy();

      // side by side only while the reader keeps 360px; else the reader replaces the list
      if (await list.isVisible()) expect(paneBox.width).toBeGreaterThanOrEqual(360);
      else await expect(pane.getByRole("button", { name: "Về danh sách" })).toBeVisible();

      // below sm the breadcrumb is the current page only
      const crumbs = await trail(page);
      if (size.width < 640) {
        expect(crumbs.count).toBe(1);
        expect(crumbs.current).toBe(true);
      } else expect(crumbs.count).toBeGreaterThan(1);
      await page.context().close();
    });
  }
}

for (const size of SIZES) {
  test(`route header inset and one crumb · /demo/workspace/ · ${size.width}px (#188)`, async ({ browser }) => {
    const page = await newPage(browser, size);
    await page.goto("/demo/workspace/");
    await expect(page.getByRole("navigation", { name: "Đường dẫn" })).toBeVisible();
    const crumbs = await trail(page);
    expect(crumbs.count).toBe(1);
    // the same horizontal inset as the content (16px), phones included
    expect(crumbs.inset).toBe(16);
    await page.context().close();
  });
}

test("ListReaderLayout at 744 (single pane): the reader replaces the list, Back and an item work by keyboard (#188)", async ({ browser }) => {
  const page = await newPage(browser, SIZES[1]);
  await page.goto("/demo/list-reader/");
  const pane = page.locator("[data-reader-pane]");
  const list = page.locator("[data-reader-list]");
  const back = pane.getByRole("button", { name: "Về danh sách" });
  await expect(back).toBeVisible();
  await expect(list).toBeHidden();
  // the static HTML is there before React hydrates: retry until Enter on Back shows the list (the one manual focus)
  await expect(async () => {
    await back.focus();
    await page.keyboard.press("Enter");
    await expect(list).toBeVisible({ timeout: 500 });
  }).toPass();
  await expect(pane).toBeHidden();
  // focus moved to the row that was open, never to <body>
  const first = list.getByRole("button").first();
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(pane).toBeVisible();
  await expect(list).toBeHidden();
  await expect(page).toHaveURL(/open=m-1/);
  // focus moved to the reader's title; Shift+Tab reaches Back, Enter gives focus back to the row
  await expect(pane.locator("[data-reader-header] h2")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(back).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(list).toBeVisible();
  await expect(first).toBeFocused();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  await page.keyboard.press("Enter");
  await expect(pane.locator("[data-reader-header] h2")).toBeFocused();
  // wide enough for both: side by side again, the Back button hidden
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(list).toBeVisible();
  await expect(back).toBeHidden();
  expect((await pane.boundingBox())!.width).toBeGreaterThanOrEqual(360);
  await page.context().close();
});

test("ReaderHeader with an app's own onBack inside ListReaderLayout at 744 (single pane): Back shows and works by keyboard (#188 review)", async ({ browser }) => {
  const page = await newPage(browser, SIZES[1]);
  await page.goto("/demo/sticky-reader/");
  const pane = page.locator("[data-reader-pane]");
  const list = page.locator("[data-reader-list]");
  const back = pane.getByRole("button", { name: "Về danh sách" });
  await expect(list).toBeHidden();
  await expect(back).toBeVisible();
  await expect(async () => {
    await back.focus();
    await page.keyboard.press("Enter");
    await expect(list).toBeVisible({ timeout: 500 });
  }).toPass();
  await expect(pane).toBeHidden();
  await expect(list.getByRole("button", { name: /Thư trao đổi #1 —/ })).toBeFocused();
  await page.context().close();
});

test("DetailOverlay on a phone: the title keeps 60% of the header, ‹ › wrap under it (#188)", async ({ browser }) => {
  const page = await newPage(browser, SIZES[0]);
  await page.goto("/components/detail-overlay/?item=DH-1041");
  const dialog = page.getByRole("dialog");
  const header = dialog.locator("[data-detail-header]");
  const title = header.locator("[data-detail-title]");
  const nav = header.locator("[data-detail-nav]");
  await expect(title).toBeVisible();
  const [h, tb, nb] = [(await header.boundingBox())!, (await title.boundingBox())!, (await nav.boundingBox())!];
  expect(tb.width).toBeGreaterThanOrEqual(h.width * 0.6);
  expect(nb.y).toBeGreaterThanOrEqual(tb.y + tb.height - 1);
  // keyboard still steps through the results from the wrapped row
  await header.getByRole("button", { name: "Mục sau" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/item=DH-1041/);
  await page.context().close();
});

test("DetailOverlay on a laptop keeps its one 56px header row, title and subtitle included (#188)", async ({ browser }) => {
  const page = await newPage(browser, { width: 1280, height: 800, phone: false } as unknown as (typeof SIZES)[number]);
  await page.goto("/components/detail-overlay/?item=DH-1041");
  const header = page.getByRole("dialog").locator("[data-detail-header]");
  await expect(header).toBeVisible();
  expect(Math.round((await header.boundingBox())!.height)).toBe(56);
  await page.context().close();
});

// #196: where list + reader + SubNav do not fit, the SubNav (not the list) gives way: a trigger opens it in a sheet.
for (const size of [SIZES[0], SIZES[2]]) {
  test(`SubNav becomes a sheet trigger · /demo/list-reader/ · ${size.width}px (#196)`, async ({ browser }) => {
    const page = await newPage(browser, size);
    await page.goto("/demo/list-reader/");
    const trigger = page.getByRole("button", { name: "Thư mục hộp thư: Hộp thư đến" });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("[data-page-subnav]")).toBeHidden();
    const list = page.locator("[data-reader-list]");
    const pane = page.locator("[data-reader-pane]");
    if (size.width >= 1024) {
      // the room the SubNav gave: list and reader side by side, the reader at least 360px, no Back
      await expect(list).toBeVisible();
      expect((await pane.boundingBox())!.width).toBeGreaterThanOrEqual(360);
      await expect(pane.getByRole("button", { name: "Về danh sách" })).toBeHidden();
    } else await expect(list).toBeHidden();
    // keyboard: Enter opens the sheet (retry until hydrated), Tab to a folder, Enter chooses it and closes the sheet
    const sheet = page.getByRole("dialog", { name: "Thư mục hộp thư" });
    await expect(async () => {
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(sheet).toBeVisible({ timeout: 500 });
    }).toPass();
    const sent = sheet.getByRole("button", { name: /Đã gửi/ });
    for (let i = 0; i < 8 && !(await sent.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(sent).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(sheet).toBeHidden();
    const chosen = page.getByRole("button", { name: "Thư mục hộp thư: Đã gửi" });
    await expect(chosen).toBeVisible();
    await expect(chosen).toBeFocused();
    // Escape closes it too
    await page.keyboard.press("Enter");
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await page.context().close();
  });
}

test("SubNav stays a card where list + reader + SubNav fit (1440) (#196)", async ({ browser }) => {
  const page = await newPage(browser, { width: 1440, height: 900, phone: false } as unknown as (typeof SIZES)[number]);
  await page.goto("/demo/list-reader/");
  await expect(page.locator("[data-page-subnav]")).toBeVisible();
  await expect(page.locator("[data-page-subnav-trigger]")).toBeHidden();
  await expect(page.locator("[data-reader-list]")).toBeVisible();
  expect((await page.locator("[data-reader-pane]").boundingBox())!.width).toBeGreaterThanOrEqual(360);
  await page.context().close();
});

// #196: a cut title can be read in full on touch (no native tooltip there): a toggle with aria-expanded, by keyboard.
async function expandByKeyboard(page: import("@playwright/test").Page, title: import("@playwright/test").Locator, toggle: import("@playwright/test").Locator) {
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(await toggle.getAttribute("aria-controls")).toBe(await title.getAttribute("id"));
  const cut = (await title.boundingBox())!.height;
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => (await title.boundingBox())!.height).toBeGreaterThan(cut + 1);
  // the whole text shows: nothing cut any more
  expect(await title.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect.poll(async () => Math.round((await title.boundingBox())!.height)).toBe(Math.round(cut));
}

for (const size of [SIZES[0], SIZES[2]]) {
  test(`ReaderHeader: a title cut at 3 lines expands by keyboard · ${size.width}px (#196)`, async ({ browser }) => {
    const page = await newPage(browser, size);
    await page.goto("/demo/list-reader/?open=m-2");
    const header = page.locator("[data-reader-pane] [data-reader-header]");
    const title = header.locator("h2");
    await expect(title).toBeVisible();
    expect((await title.boundingBox())!.height).toBeLessThanOrEqual(3 * 24 + 1);
    await expandByKeyboard(page, title, header.getByRole("button", { name: "Xem đủ tiêu đề" }));
    await page.context().close();
  });

  test(`DetailOverlay: a cut title expands by keyboard, a title that fits has no toggle · ${size.width}px (#196)`, async ({ browser }) => {
    const page = await newPage(browser, size);
    await page.goto("/components/detail-overlay/?item=DH-1046");
    const header = page.getByRole("dialog").locator("[data-detail-header]");
    const title = header.locator("[data-detail-title] h2");
    await expect(title).toBeVisible();
    await expandByKeyboard(page, title, header.getByRole("button", { name: "Xem đủ tiêu đề" }));
    // ‹ to DH-1045 (short title): the toggle goes away
    await header.getByRole("button", { name: "Mục trước" }).click();
    await expect(page).toHaveURL(/item=DH-1045/);
    await expect(header.locator("[data-title-toggle]")).toHaveCount(0);
    await page.context().close();
  });
}
