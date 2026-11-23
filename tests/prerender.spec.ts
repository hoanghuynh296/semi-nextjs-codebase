// The server-rendered regression app (tests/prerender-app, npm run build:prerender-test first) with Next's App Router:
// useFilterParams must keep Next in step (useSearchParams, router.refresh) and follow Next's own navigations (#100).
import { expect, test } from "@playwright/test";
import { PRERENDER_PORT } from "../playwright.config";

const BASE = `http://127.0.0.1:${PRERENDER_PORT}`;

test("useFilterParams under Next's App Router: useSearchParams sees each change, router.refresh keeps it, Back restores", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/filters/a`);
  // with Cache Components Next keeps the previous entry of the route mounted but hidden (Activity): read the shown one
  const hook = page.getByTestId("hook-status").filter({ visible: true });
  const next = page.getByTestId("next-status").filter({ visible: true });
  await expect(hook).toHaveText("none");
  const bar = page.getByRole("search", { name: "Search orders" }).filter({ visible: true });
  await bar.getByRole("button", { name: "Status" }).click();
  await page.getByRole("dialog", { name: "Status" }).getByRole("checkbox", { name: "New" }).check();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/filters\/a\?f\.status=new$/);
  await expect(hook).toHaveText("new");
  await expect(next).toHaveText("new");
  // a refresh re-renders from the server for the current URL, not the one Next had before the write
  await page.getByRole("button", { name: "Refresh" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\?f\.status=new$/);
  await expect(next).toHaveText("new");
  await expect(hook).toHaveText("new");
  // the switch chip: a second history entry; Back undoes it in both
  await bar.getByRole("button", { name: "Paid" }).click();
  await expect(page).toHaveURL(/f\.paid=1/);
  await page.goBack();
  await expect(page).not.toHaveURL(/f\.paid/);
  await expect(bar.getByRole("button", { name: "Paid" })).toHaveAttribute("aria-pressed", "false");
  await expect(next).toHaveText("new");
  // Next's own navigations to the same route: a Link and router.push; the hook follows them
  await page.getByRole("link", { name: "Done only" }).click();
  await expect(next).toHaveText("done");
  await expect(hook).toHaveText("done");
  await page.getByRole("button", { name: "Push both" }).click();
  await expect(next).toHaveText("new,done");
  await expect(hook).toHaveText("new,done");
  // and the chip row reads it too
  await expect(bar.getByRole("button", { name: "Status · 2" })).toBeVisible();
});

// React reports updates scheduled inside an insertion effect only in development: run against `next dev`
// (SEMI_DEV_URL=http://127.0.0.1:4332 after `npx next dev tests/prerender-app -p 4332`). Skipped in test:ui.
test("useFilterParams in next dev: same-route Link and router.push log no React error", async ({ page }) => {
  const dev = process.env.SEMI_DEV_URL;
  test.skip(!dev, "set SEMI_DEV_URL to a running `next dev tests/prerender-app`");
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await page.goto(`${dev}/filters/a`);
  const hook = page.getByTestId("hook-status").filter({ visible: true });
  await page.getByRole("link", { name: "Done only" }).click();
  await expect(hook).toHaveText("done");
  await page.getByRole("button", { name: "Push both" }).click();
  await expect(hook).toHaveText("new,done");
  await page.goBack();
  await expect(hook).toHaveText("done");
  expect(errors).toEqual([]);
});

test("DetailOverlay under Next's App Router: open by URL, Back closes it at the same scroll, the palette is app-wide (#102)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/items/a`);
  const list = page.getByRole("list", { name: "Items" }).filter({ visible: true });
  const row = list.getByRole("button", { name: "Item 30", exact: true });
  await row.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800);
  const y = await page.evaluate(() => window.scrollY);
  await row.click();
  await expect(page).toHaveURL(/\/items\/a\?open=r30$/);
  const dialog = page.getByRole("dialog", { name: "Item 30" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Mục 30 trên 40")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Mục sau" }).click();
  await expect(page).toHaveURL(/\?open=r31$/);
  await expect(page.getByRole("dialog", { name: "Item 31" })).toBeVisible();
  // ‹ › replaced the entry: one Back is the list, at the same scroll, and Next's router agrees (refresh keeps it)
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/items\/a$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(y);
  await expect(row).toBeFocused();
  // Forward opens it again; the entry is still known as ours, so Escape goes back (no duplicate list entry)
  const entries = await page.evaluate(() => history.length);
  await page.goForward();
  await expect(page.getByRole("dialog", { name: "Item 31" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/items\/a$/);
  expect(await page.evaluate(() => history.length)).toBe(entries);
  await page.goForward();
  await expect(page.getByRole("dialog", { name: "Item 31" })).toBeVisible();
  // at the end › turns disabled and focus moves to ‹
  await page.goto(`${BASE}/items/a?open=r39`);
  await page.getByRole("dialog").getByRole("button", { name: "Mục sau" }).click();
  await expect(page.getByRole("dialog", { name: "Item 40" })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Mục trước" })).toBeFocused();
  // a deep link (server-rendered) opens it after hydration; close removes the param without leaving the page
  await page.goto(`${BASE}/items/a?open=r5`);
  await expect(page.getByRole("dialog", { name: "Item 5" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(page).toHaveURL(/\/items\/a$/);
  // the root layout's CommandPalette: ⌘K, the page's registered action is listed first, a place navigates
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Tìm hoặc tạo" });
  await expect(palette.getByRole("option").first()).toHaveText(/New item/);
  await palette.getByRole("combobox").fill("item 3");
  await palette.getByRole("combobox").press("Enter");
  await expect(page).toHaveURL(/\?open=r3$/);
  await expect(page.getByRole("dialog", { name: "Item 3" })).toBeVisible();
});

test("SearchPill debounce under Next's App Router: a row opened while typing keeps the query on the list's entry (#128)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/items/a`);
  const search = page.getByRole("searchbox", { name: "Search items" }).filter({ visible: true });
  const list = page.getByRole("list", { name: "Items" }).filter({ visible: true });
  // the open id is written by a hydrated list: wait for it before typing
  await list.getByRole("button", { name: "Item 2", exact: true }).click();
  await expect(page).toHaveURL(/\?open=r2$/);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/items\/a$/);
  await search.fill("item");
  await expect(page).not.toHaveURL(/q=/); // still inside the debounce
  await list.getByRole("button", { name: "Item 3", exact: true }).click();
  await expect(page).toHaveURL(/\/items\/a\?q=item&open=r3$/);
  await expect(page.getByRole("dialog", { name: "Item 3" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/items\/a\?q=item$/);
  await expect(search).toHaveValue("item");
  // no late write after the debounce would have run: the list's entry still has the query, nothing else
  await page.waitForTimeout(2300);
  await expect(page).toHaveURL(/\/items\/a\?q=item$/);
});

test("SearchPill debounce: a filter chip pushed while typing keeps the query on the entry before it (#128)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/filters/a`);
  const bar = page.getByRole("search", { name: "Search orders" }).filter({ visible: true });
  const search = bar.getByRole("searchbox", { name: "Search orders" });
  const paid = bar.getByRole("button", { name: "Paid" });
  // a hydrated chip row first
  await paid.click();
  await expect(page).toHaveURL(/\?f\.paid=1$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/filters\/a$/);
  await search.fill("tiêu");
  await expect(page).not.toHaveURL(/q=/);
  await paid.click();
  await expect(page).toHaveURL(/\?q=ti%C3%AAu&f\.paid=1$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/filters\/a\?q=ti%C3%AAu$/);
  await expect(paid).toHaveAttribute("aria-pressed", "false");
  await expect(search).toHaveValue("tiêu");
  await page.waitForTimeout(2300);
  await expect(page).toHaveURL(/\/filters\/a\?q=ti%C3%AAu$/);
});

test("SearchPill debounce: a Link to another route while typing drops the pending query (#128)", async ({ page }) => {
  await page.goto(`${BASE}/items/a`);
  const list = page.getByRole("list", { name: "Items" }).filter({ visible: true });
  await list.getByRole("button", { name: "Item 2", exact: true }).click();
  await expect(page).toHaveURL(/\?open=r2$/);
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox", { name: "Search items" }).filter({ visible: true }).fill("item");
  await page.getByRole("link", { name: "To filters" }).click();
  await expect(page).toHaveURL(/\/filters\/a$/);
  await page.waitForTimeout(2300);
  await expect(page).toHaveURL(/\/filters\/a$/);
});

for (const nav of [true, false]) {
  test(`SearchPill in a persisting layout: a Link to another route while typing drops the pending query, ${nav ? "with" : "without"} the Navigation API (#128)`, async ({ page }) => {
    // with it the URL listener cancels the send; without it (Firefox, Safari < 26) the send checks the path
    if (!nav) await page.addInitScript(() => Object.defineProperty(window, "navigation", { value: undefined, configurable: true }));
    await page.goto(`${BASE}/layout-search/a`);
    const search = page.getByRole("searchbox", { name: "Search everything" });
    // Enter sends at once: the layout is hydrated
    await search.fill("h");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/layout-search\/a\?q=h$/);
    await search.fill("late");
    await page.getByRole("link", { name: "Page B" }).click();
    await expect(page.getByRole("heading", { name: "Page B" })).toBeVisible();
    await expect(page).toHaveURL(/\/layout-search\/b\?q=h$/);
    await page.waitForTimeout(2300);
    await expect(page).toHaveURL(/\/layout-search\/b\?q=h$/);
  });
}

test("DetailOverlay without the Navigation API (Firefox, Safari < 26): close after leaving the list and coming back by a link stays on the list (#105)", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "navigation", { value: undefined, configurable: true }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/items/a`);
  expect(await page.evaluate(() => (window as unknown as { navigation?: unknown }).navigation)).toBeUndefined();
  const list = page.getByRole("list", { name: "Items" }).filter({ visible: true });
  // our own entry: ‹ › keep it ours, Escape goes back
  await list.getByRole("button", { name: "Item 2", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Mục sau" }).click();
  await expect(page).toHaveURL(/\?open=r3$/);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/items\/a$/);
  // open, Back, leave for another route, come back with ?open= by router.push: close must not leave the list
  await list.getByRole("button", { name: "Item 2", exact: true }).click();
  await page.goBack();
  await page.getByRole("link", { name: "To filters" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/filters\/a$/);
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Tìm hoặc tạo" });
  await palette.getByRole("combobox").fill("item 3");
  await palette.getByRole("combobox").press("Enter");
  await expect(page.getByRole("dialog", { name: "Item 3" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/items\/a$/);
});

test("WorkspaceLayout and FeatureIntro under Next's App Router: prerendered without the intro, which opens after mount once (#106)", async ({ page, request }) => {
  // the server HTML has the workspace and no dialog (storage is read after mount only)
  const html = await (await request.get(`${BASE}/workspace/a`)).text();
  expect(html.replace(/<!-- -->/g, "")).toContain("Send (3)");
  expect(html).toContain('data-page-type="workspace"');
  expect(html).not.toContain("One screen per request");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/workspace/a`);
  const intro = page.getByRole("dialog", { name: "One screen per request" });
  await expect(intro).toBeVisible();
  await expect(intro.getByRole("button", { name: "Tiếp" })).toBeFocused();
  // one intro at a time: the second waits
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(intro).toBeHidden();
  const second = page.getByRole("dialog", { name: "Second intro" });
  await expect(second).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(second).toBeHidden();
  // seen: not again after a reload
  await page.reload();
  await expect(page.getByRole("region", { name: "Bảng điều khiển" }).filter({ visible: true })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const spin = page.getByRole("spinbutton", { name: "tons" }).filter({ visible: true });
  await spin.focus();
  await page.keyboard.press("ArrowUp");
  await expect(spin).toHaveAttribute("aria-valuenow", "4");
  await expect(page.getByRole("button", { name: "Send (4)" }).filter({ visible: true })).toBeVisible();
});

test("AppShell under Next's App Router (#144): prerendered with its header; a slot keeps one instance across a collapse, every breakpoint and a route change", async ({ page, request }) => {
  // a static route prerenders the shell; the middle that reads search params waits in its own Suspense
  const html = await (await request.get(`${BASE}/shell-guard`)).text();
  expect(html).toContain('aria-label="Prerender"');
  expect(html).toContain('aria-label="Tài khoản: Ada Lovelace"');
  expect(html).toMatch(/Count (<!-- -->)?0/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/shell/a?q=chair`);
  await expect(page.locator("header").getByTestId("query-middle")).toHaveText("Search: chair");
  const count = page.getByRole("button", { name: /^Count/ });
  // the first click may land before hydration: retry until the count moves
  await expect(async () => {
    await count.click();
    await expect(count).not.toHaveText("Count 0", { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  const n = await count.textContent();
  const mounts = () => page.evaluate(() => (window as unknown as { __slotMounts: number }).__slotMounts);
  expect(await mounts()).toBe(1);
  // collapse and expand
  await page.locator("aside").getByRole("button", { name: "Thu gọn menu" }).click();
  await page.locator("aside").getByRole("button", { name: "Mở rộng menu" }).click();
  // every range: wide, the default rail, md (forced rail), phone, and back
  for (const width of [1100, 900, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
  }
  await expect(count).toHaveText(n!);
  expect(await mounts()).toBe(1);
  // a route change (a nav link): the shell and the slot stay
  await page.locator("aside").getByRole("link", { name: "Late" }).click();
  await expect(page).toHaveURL(/\/shell\/late$/);
  await expect(count).toHaveText(n!);
  expect(await mounts()).toBe(1);
  // the default crumbs: the active sub-item under its parent
  await expect(page.getByRole("navigation", { name: "Đường dẫn" })).toHaveText(/Orders.*Open/);
});

test("AppShell nav shortcuts under Next's App Router (#144): Alt + digit clicks the nav link, so the unsaved-changes guard asks first; fields and editors keep the key", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/shell-guard`);
  const input = page.getByRole("textbox", { name: "Note" });
  await expect(async () => {
    await input.fill("draft");
    await expect(page.locator("aside").getByRole("link", { name: "Home" })).toHaveAttribute("title", /\((Alt\+1|⌥1)\)$/, { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  // in the field the key is the field's
  await input.press("Alt+Digit1");
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/shell-guard$/);
  await page.getByTestId("editor").click();
  await page.keyboard.press("Alt+Digit1");
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/shell-guard$/);
  // outside a field: the guard asks; "Ở lại" stays, "Rời đi" goes
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Alt+Digit1");
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Ở lại" }).click();
  await expect(page).toHaveURL(/\/shell-guard$/);
  await page.keyboard.press("Alt+Digit1");
  await page.getByRole("alertdialog").getByRole("button", { name: "Rời đi" }).click();
  await expect(page).toHaveURL(/\/shell\/a$/);
});

async function replayTwice(page: import("@playwright/test").Page) {
  const replayed = page.getByRole("dialog", { name: "Replayed intro" });
  for (let round = 0; round < 2; round++) {
    // the first click may land before hydration: retry until the dialog shows
    await expect(async () => {
      if (!(await replayed.count())) await page.getByRole("button", { name: "Replay intro" }).filter({ visible: true }).click();
      await expect(replayed).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await page.keyboard.press("Escape");
    await expect(replayed).toBeHidden();
    // it does not come back by itself (a listener left behind by the second effect run would reopen it)
    await page.waitForTimeout(400);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
}

test("FeatureIntro replay (forceOpen) closes for good; an intro without slides takes no slot (#110)", async ({ page }) => {
  await page.addInitScript(() => ["prerender-workspace", "prerender-second"].forEach((id) => localStorage.setItem(`semi_intro_${id}`, "1")));
  await page.goto(`${BASE}/workspace/a`);
  await expect(page.getByRole("region", { name: "Bảng điều khiển" }).filter({ visible: true })).toBeVisible();
  await replayTwice(page);
});

// StrictMode runs effects twice only in development: run against `next dev` (SEMI_DEV_URL, as above). Skipped in test:ui.
test("FeatureIntro under StrictMode in next dev: a replayed intro closes for good (#110)", async ({ page }) => {
  const dev = process.env.SEMI_DEV_URL;
  test.skip(!dev, "set SEMI_DEV_URL to a running `next dev tests/prerender-app`");
  await page.addInitScript(() => ["prerender-workspace", "prerender-second"].forEach((id) => localStorage.setItem(`semi_intro_${id}`, "1")));
  await page.goto(`${dev}/workspace/a`);
  await expect(page.getByRole("button", { name: "Replay intro" }).filter({ visible: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await replayTwice(page);
});
