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
