// States kit (#66): EmptyState variants, the phone cap with long content, PageSkeleton shapes, and the docs site's own
// not-found route (the exported 404.html).
import { expect, test } from "@playwright/test";

test("EmptyState variants: first-use has one sentence and one action, no-results has a hint and 'Xoá lọc'", async ({ page }) => {
  await page.goto("/components/empty-state/");
  const first = page.locator('[data-empty="first-use"]').first();
  await expect(first).toContainText("Chưa có máy in nào");
  await expect(first.getByRole("button")).toHaveCount(1);
  await expect(first.locator(".text-muted").filter({ hasText: "Thử bỏ" })).toHaveCount(0);

  const none = page.locator('[data-empty="no-results"]').first();
  await expect(none).toContainText("Không có máy in khớp bộ lọc");
  await expect(none).toContainText("Thử bỏ bớt bộ lọc hoặc đổi từ khoá.");
  await expect(none.getByRole("button", { name: "Xoá lọc" })).toBeVisible();
});

test("phone cap: an empty state stays within 40% of a 375×568 screen and, when it overflows, is a named focusable region", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 568 }, isMobile: true, hasTouch: true });
  await page.goto("/components/empty-state/");
  const box = page.locator('[data-empty="first-use"]').first();
  await box.scrollIntoViewIfNeeded();
  await box.evaluate((el) => {
    const hint = document.createElement("div");
    hint.textContent = "Rất dài. ".repeat(120);
    el.appendChild(hint);
  });
  await expect.poll(async () => (await box.boundingBox())?.height ?? 999).toBeLessThanOrEqual(568 * 0.4 + 1);
  await expect(box).toHaveAttribute("tabindex", "0");
  await expect(box).toHaveAttribute("aria-label", "Chưa có máy in nào");
  // the top (icon and title) is not clipped by centring
  const top = await box.evaluate((el) => ({ scrollTop: el.scrollTop, title: el.children[1].getBoundingClientRect().top - el.getBoundingClientRect().top }));
  expect(top.title).toBeGreaterThanOrEqual(0);
  await page.close();
});

test("PageSkeleton shapes render the shape of cards, a list and a detail page, without full-page height in the shell", async ({ page }) => {
  await page.goto("/components/skeleton/");
  const cards = page.locator('[data-shape="cards"]');
  const list = page.locator('[data-shape="list"]');
  const detail = page.locator('[data-shape="detail"]');
  await expect(cards.locator('[role="status"] .shimmer').first()).toBeAttached();
  expect(await cards.locator(".shimmer").count()).toBeGreaterThan(6);
  expect(await list.locator("[role=status] > div").count()).toBe(8);
  expect(await detail.locator(".grid > *").count()).toBe(2);
  const h = await cards.evaluate((el) => (el.firstElementChild as HTMLElement).getBoundingClientRect().height);
  expect(h).toBeGreaterThan(0);
  expect(await cards.evaluate((el) => getComputedStyle(el.firstElementChild!).height !== `${innerHeight}px`)).toBe(true);
});

test("the docs site's own not-found page: one h1 and a link home", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.getByRole("heading", { level: 1, name: "Không tìm thấy trang" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", /\/$/);
});
