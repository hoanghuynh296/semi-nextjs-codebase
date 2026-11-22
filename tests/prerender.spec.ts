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
