// SectionHeader and MediaCard (#191) on their doc pages: the card is one link or button reached by Tab (Enter opens
// it), slot controls are their own controls after it, a badge on the media never blocks opening, hover scales the media
// (not under reduced motion), and the pager ‹ › scrolls the rail by keyboard, disabled at the ends. Phones: 75% cards.
import { expect, test, type Page } from "@playwright/test";

/** React adopts the static HTML (slow on CI): wait for its fiber key before pressing anything. */
async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector("main");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  });
}

test("MediaCard by keyboard (#191): Tab reaches the card, then its slot button, then the next card; Enter opens it; focus ring around the card", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/media-card/");
  await hydrated(page);
  const ex = page.locator('[data-example="media-card/grid"]');
  const status = ex.getByRole("status");
  const first = ex.getByRole("button", { name: "Hướng dẫn in mô hình kiến trúc" });
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  // the focus ring is drawn around the whole card (the cover spans media and caption)
  const card = ex.locator("[data-media-card]").first();
  const [cb, kb] = [(await first.boundingBox())!, (await card.boundingBox())!];
  expect(Math.abs(cb.width - kb.width)).toBeLessThan(1);
  expect(Math.abs(cb.height - kb.height)).toBeLessThan(1);
  expect(await first.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(status).toHaveText("Đã mở: Hướng dẫn in mô hình kiến trúc");
  // the pill Button in the slot is its own control, next in the tab order
  await page.keyboard.press("Tab");
  const save = ex.getByRole("button", { name: "Lưu" }).first();
  await expect(save).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(status).toHaveText("Đã mở: Lưu: Hướng dẫn in mô hình kiến trúc");
  await page.keyboard.press("Tab");
  const second = ex.getByRole("button", { name: "Chậu cây mini in 3D" });
  await expect(second).toBeFocused();
  await page.keyboard.press("Space");
  await expect(status).toHaveText("Đã mở: Chậu cây mini in 3D");
});

test("MediaCard pointer (#191): a click on the overlay badge opens the card, the slot button runs its own action; no slot renders when absent", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/media-card/");
  await hydrated(page);
  const ex = page.locator('[data-example="media-card/grid"]');
  const status = ex.getByRole("status");
  const card = ex.locator("[data-media-card]").first();
  // the badge lets the pointer through: a real click at its centre lands on the card's button
  const badge = (await card.locator('[data-slot="top-left"]').getByText("12:04").boundingBox())!;
  await page.mouse.click(badge.x + badge.width / 2, badge.y + badge.height / 2);
  await expect(status).toHaveText("Đã mở: Hướng dẫn in mô hình kiến trúc");
  await card.getByRole("button", { name: "Lưu" }).click();
  await expect(status).toHaveText("Đã mở: Lưu: Hướng dẫn in mô hình kiến trúc");
  // the link example has no slots: nothing renders for them
  const link = page.locator('[data-example="media-card/link"] [data-media-card]');
  await expect(link.locator("[data-slot]")).toHaveCount(0);
  const a = link.getByRole("link", { name: "Bộ sưu tập mùa hè" });
  await a.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#media-card-link$/);
});

for (const reduced of [false, true]) {
  test(`MediaCard hover scale (#191): ${reduced ? "still under prefers-reduced-motion" : "1.05 in 300ms ease-out"}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
    const page = await ctx.newPage();
    await page.goto("/components/media-card/");
    await hydrated(page);
    const card = page.locator('[data-example="media-card/link"] [data-media-card]');
    const media = card.locator("img").locator("..");
    if (!reduced) expect(await media.evaluate((el) => getComputedStyle(el).transition)).toMatch(/scale 0\.3s ease-out/);
    await card.hover();
    await page.waitForTimeout(450);
    const scale = await media.evaluate((el) => getComputedStyle(el).scale);
    expect(scale).toBe(reduced ? "none" : "1.05");
    await ctx.close();
  });
}

test("SectionHeader pager by keyboard (#191): ‹ disabled at the start, › scrolls the rail one view, ‹ comes back, › disabled at the end", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/section-header/");
  await hydrated(page);
  const ex = page.locator('[data-example="section-header/rail"]');
  const group = ex.getByRole("group", { name: "Video mới" });
  const prev = group.getByRole("button", { name: "Mục trước" });
  const next = group.getByRole("button", { name: "Mục sau" });
  const rail = ex.locator("[data-rail]");
  const left = () => rail.evaluate((el) => el.scrollLeft);
  // a smooth scroll lands over several frames: wait until two reads 150ms apart agree before judging ‹ / ›
  const settled = async () => {
    let prevAt = -1;
    await expect.poll(async () => {
      const now = await left();
      const same = now === prevAt;
      prevAt = now;
      await page.waitForTimeout(150);
      return same;
    }).toBe(true);
  };
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();
  // Tab from "Xem tất cả" skips the disabled ‹ and lands on ›
  await ex.getByRole("button", { name: "Xem tất cả" }).focus();
  await page.keyboard.press("Tab");
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(left).toBeGreaterThan(100);
  await settled();
  await expect(prev).toBeEnabled();
  for (let i = 0; i < 6 && (await next.isEnabled()); i++) {
    const at = await left();
    await next.focus();
    await page.keyboard.press("Space");
    await expect.poll(left).toBeGreaterThan(at);
    await settled();
  }
  await expect(next).toBeDisabled();
  const max = await rail.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(Math.abs((await left()) - max)).toBeLessThan(2);
  await prev.focus();
  await page.keyboard.press("Enter");
  await expect.poll(left).toBeLessThan(max - 100);
  await expect(next).toBeEnabled();
});

test("SectionHeader rail on a phone (#191): cards are 75% of the rail, the pager buttons are 44px", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("/components/section-header/");
  await hydrated(page);
  const ex = page.locator('[data-example="section-header/rail"]');
  const rail = (await ex.locator("[data-rail]").boundingBox())!;
  const card = (await ex.locator("[data-media-card]").first().boundingBox())!;
  expect(Math.abs(card.width - rail.width * 0.75)).toBeLessThan(2);
  for (const name of ["Mục trước", "Mục sau"]) {
    const b = (await ex.getByRole("button", { name }).boundingBox())!;
    expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(44);
  }
  await ctx.close();
});
