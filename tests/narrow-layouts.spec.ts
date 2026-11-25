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

      // the title keeps at least 60% of the reader pane (the actions wrap under it when they do not fit)
      const paneBox = (await pane.boundingBox())!;
      const titleBox = (await title.boundingBox())!;
      expect(titleBox.width).toBeGreaterThanOrEqual(paneBox.width * 0.6);
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

test("ListReaderLayout at 1024 (rail + sub-nav): the reader replaces the list, Back and an item work by keyboard (#188)", async ({ browser }) => {
  const page = await newPage(browser, SIZES[2]);
  await page.goto("/demo/list-reader/");
  const pane = page.locator("[data-reader-pane]");
  const list = page.locator("[data-reader-list]");
  const back = pane.getByRole("button", { name: "Về danh sách" });
  await expect(back).toBeVisible();
  await expect(list).toBeHidden();
  // the static HTML is there before React hydrates: retry until Enter on Back shows the list
  await expect(async () => {
    await back.focus();
    await page.keyboard.press("Enter");
    await expect(list).toBeVisible({ timeout: 500 });
  }).toPass();
  await expect(pane).toBeHidden();
  const first = list.getByRole("button").first();
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(pane).toBeVisible();
  await expect(list).toBeHidden();
  await expect(page).toHaveURL(/open=m-1/);
  // wide enough for both: side by side again, the Back button hidden
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(list).toBeVisible();
  await expect(back).toBeHidden();
  expect((await pane.boundingBox())!.width).toBeGreaterThanOrEqual(360);
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
