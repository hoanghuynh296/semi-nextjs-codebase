// RouteHeader's three slots and RouteHeaderBanner (#192) in the server-rendered app (tests/prerender-app, Next's App
// Router): the banner sits in the header's centre from md and as the first row of the page content below md; closing
// either copy hides both, is remembered per id, and never moves the header's right group.
import { expect, test, type Browser, type Page } from "@playwright/test";
import { PRERENDER_PORT } from "../playwright.config";

const BASE = `http://127.0.0.1:${PRERENDER_PORT}`;
const URL = `${BASE}/banner/orders`;

async function open(browser: Browser, width: number, height: number, phone = false) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: phone, hasTouch: phone, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(URL);
  return page;
}

/** The right edges of the header's right slot and of the account avatar, and the left slot's width. */
async function header(page: Page) {
  return page.evaluate(() => {
    const h = document.querySelector<HTMLElement>("#main")!.parentElement!.querySelector("header")!;
    const slot = (n: string) => h.querySelector<HTMLElement>(`[data-route-slot="${n}"]`)!;
    const avatar = h.querySelector<HTMLElement>('[aria-label^="Tài khoản"]')!.getBoundingClientRect();
    return {
      slots: ["left", "center", "right"].map((n) => !!slot(n)),
      right: Math.round(slot("right").getBoundingClientRect().right * 10) / 10,
      avatarRight: Math.round(avatar.right * 10) / 10,
      avatarTop: Math.round(avatar.top * 10) / 10,
      left: Math.round(slot("left").getBoundingClientRect().width),
    };
  });
}

test("RouteHeader server HTML (#192): the three slot containers are prerendered; the banner waits for the store (after mount)", async ({ request }) => {
  const html = await (await request.get(URL)).text();
  for (const slot of ["left", "center", "right"]) expect(html).toContain(`data-route-slot="${slot}"`);
  expect(html).not.toContain("data-route-banner");
});

test("RouteHeaderBanner at 1440 (#192): in the header's centre, by keyboard (Tab to the CTA and close, Enter / Space); closing it never moves the right group, hides the inline copy and is remembered", async ({ browser }) => {
  const page = await open(browser, 1440, 900);
  const banner = page.locator('[data-route-banner="header"]');
  await expect(banner).toBeVisible();
  await expect(banner).toHaveAttribute("role", "status");
  await expect(page.locator('[data-route-banner="inline"]')).toBeHidden();
  const before = await header(page);
  expect(before.slots).toEqual([true, true, true]);
  // centred: the banner is inside the header's centre slot, between the trail and the right group
  const box = (await banner.boundingBox())!;
  expect(box.x).toBeGreaterThan(400);
  expect(box.x + box.width).toBeLessThan(before.right - 40);

  // keyboard: from the trail's link, Tab reaches the CTA, then the close button
  const crumbLink = page.getByRole("navigation", { name: "Đường dẫn" }).getByRole("link").first();
  await crumbLink.focus();
  await page.keyboard.press("Tab");
  const cta = banner.getByRole("button", { name: "Xem ngay" });
  await expect(cta).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __bannerCta?: number }).__bannerCta)).toBe(1);
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __bannerCta?: number }).__bannerCta)).toBe(2);
  await page.keyboard.press("Tab");
  const close = banner.getByRole("button", { name: "Đóng thông báo" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-route-banner]")).toHaveCount(0);
  // focus stays on the page: the next control of the header (the right group)
  await expect(page.getByRole("button", { name: "Thông báo" })).toBeFocused();

  // the regression the slots guard: the right group keeps its exact right edge, the centre slot stays in the DOM
  const after = await header(page);
  expect(after.slots).toEqual([true, true, true]);
  expect(after.right).toBe(before.right);
  expect(after.avatarRight).toBe(before.avatarRight);
  expect(after.avatarTop).toBe(before.avatarTop);
  // the trail gets the space back
  expect(after.left).toBeGreaterThan(before.left);

  expect(await page.evaluate(() => localStorage.getItem("semi_banner_prerender-banner"))).toBe("1");
  // the inline copy is closed too (it shows below md)
  await page.setViewportSize({ width: 744, height: 1024 });
  await page.waitForTimeout(100);
  await expect(page.locator("[data-route-banner]")).toHaveCount(0);
  // remembered: not again after a reload
  await page.reload();
  await expect(page.getByRole("heading", { name: "Đơn hàng" })).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator("[data-route-banner]")).toHaveCount(0);
  await page.context().close();
});

test("RouteHeaderBanner text truncates first (#192): at 1024 the banner's text is cut with … while the trail and the right group keep their size", async ({ browser }) => {
  const page = await open(browser, 1024, 768);
  const banner = page.locator('[data-route-banner="header"]');
  await expect(banner).toBeVisible();
  const m = await page.evaluate(() => {
    const b = document.querySelector<HTMLElement>('[data-route-banner="header"]')!;
    const text = b.querySelector<HTMLElement>(".truncate")!;
    const h = b.closest("header")!;
    const slot = (n: string) => h.querySelector<HTMLElement>(`[data-route-slot="${n}"]`)!.getBoundingClientRect();
    return {
      cut: text.scrollWidth > text.clientWidth,
      overflow: getComputedStyle(text).textOverflow,
      center: slot("center").width,
      header: h.getBoundingClientRect().width,
      leftWidth: slot("left").width,
      crumbs: h.querySelector('nav[aria-label="Đường dẫn"]')!.textContent,
    };
  });
  expect(m.cut).toBe(true);
  expect(m.overflow).toBe("ellipsis");
  expect(m.center).toBeLessThanOrEqual(m.header * 0.4 + 1);
  expect(m.leftWidth).toBeGreaterThan(100);
  await expect(page.getByRole("navigation", { name: "Đường dẫn" })).toContainText("Orders");
  // the right group's pin at 1024 too: closing never moves it
  const before = await header(page);
  await banner.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(page.locator("[data-route-banner]")).toHaveCount(0);
  const after = await header(page);
  expect(after.slots).toEqual([true, true, true]);
  expect(after.right).toBe(before.right);
  expect(after.avatarRight).toBe(before.avatarRight);
  await page.context().close();
});

for (const size of [
  { width: 744, height: 1024, phone: false },
  { width: 390, height: 844, phone: true },
]) {
  test(`RouteHeaderBanner below md · ${size.width}px (#192): one row at the top of the content, above the title; CTA and close on the row; closing hides both copies`, async ({ browser }) => {
    const page = await open(browser, size.width, size.height, size.phone);
    const row = page.locator('[data-route-banner="inline"]');
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute("role", "status");
    // the header's centre is hidden below md
    await expect(page.locator('[data-route-slot="center"]')).toBeHidden();
    await expect(page.locator('[data-route-banner="header"]')).toBeHidden();
    const title = page.getByRole("heading", { name: "Đơn hàng" });
    const r = (await row.boundingBox())!;
    const tb = (await title.boundingBox())!;
    const container = (await page.locator("[data-shell-container]").evaluate((el) => {
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return { left: b.left + parseFloat(cs.paddingLeft), right: b.right - parseFloat(cs.paddingRight) };
    }));
    expect(r.y + r.height).toBeLessThanOrEqual(tb.y);
    // full width of the content
    expect(Math.abs(r.x - container.left)).toBeLessThan(1);
    expect(Math.abs(r.x + r.width - container.right)).toBeLessThan(1);
    // at most two lines of text; the CTA and close sit on the same row
    const lines = await row.locator("p").evaluate((p) => Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)));
    expect(lines).toBeLessThanOrEqual(2);
    const cta = (await row.getByRole("button", { name: "Xem ngay" }).boundingBox())!;
    const close = row.getByRole("button", { name: "Đóng thông báo" });
    const cb = (await close.boundingBox())!;
    expect(Math.abs(cta.y + cta.height / 2 - (cb.y + cb.height / 2))).toBeLessThan(2);
    if (size.phone) {
      // touch phone (#192 review): the drawn sizes stay (the row about 40px), each control gets an invisible 44px area,
      // and the two areas never overlap (2px apart): elementFromPoint along the row's centre line, above and below
      expect(r.height).toBeLessThanOrEqual(44);
      expect(cta.height).toBeLessThan(30);
      expect(cb.height).toBeLessThan(30);
      const hits = await row.evaluate((el) => {
        const [ctaEl, closeEl] = [...el.querySelectorAll<HTMLElement>("button")];
        const a = ctaEl.getBoundingClientRect();
        const c = closeEl.getBoundingClientRect();
        const y = c.top + c.height / 2;
        const at = (x: number, yy = y) => {
          const hit = document.elementFromPoint(x, yy);
          return hit === null ? "none" : ctaEl.contains(hit) ? "cta" : closeEl.contains(hit) ? "close" : "other";
        };
        return {
          ctaRightEdge: at(a.right - 0.5),
          justPastCta: at(a.right + 0.5),
          closeAreaLeft: at(c.left - 7),
          closeAreaRight: at(c.right + 7),
          aboveCta: at(a.left + a.width / 2, a.top - 8),
          belowCta: at(a.left + a.width / 2, a.bottom + 8),
          aboveClose: at(c.left + c.width / 2, c.top - 7),
          areaWidth: parseFloat(getComputedStyle(closeEl, "::before").width),
        };
      });
      expect(hits).toEqual({
        ctaRightEdge: "cta",
        justPastCta: "other",
        closeAreaLeft: "close",
        closeAreaRight: "close",
        aboveCta: "cta",
        belowCta: "cta",
        aboveClose: "close",
        areaWidth: 44,
      });
    }
    // the header's right group does not move when the row closes (744: the centre is hidden, the pin still holds)
    const pinBefore = await header(page);
    // keyboard: Tab from the CTA reaches close, Enter closes
    await row.getByRole("button", { name: "Xem ngay" }).focus();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-route-banner]")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("semi_banner_prerender-banner"))).toBe("1");
    const pinAfter = await header(page);
    expect(pinAfter.slots).toEqual([true, true, true]);
    expect(pinAfter.right).toBe(pinBefore.right);
    expect(pinAfter.avatarRight).toBe(pinBefore.avatarRight);
    // the title moves up to the top of the content
    await expect.poll(async () => (await title.boundingBox())!.y).toBeLessThan(tb.y);
    // the header copy is closed too
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(100);
    await expect(page.locator("[data-route-banner]")).toHaveCount(0);
    await page.context().close();
  });
}

test("RouteHeaderBanner with a link CTA and the app's middle (#192 review): Tab to the link, Enter follows it; the banner covers the middle only while it shows", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/banner2/orders`);
  const banner = page.locator('[data-route-banner="header"]');
  await expect(banner).toBeVisible();
  // while the banner shows, the app's middle is not in the centre
  await expect(page.getByTestId("app-middle")).toHaveCount(0);
  const before = await header(page);
  // keyboard: from the trail's link, Tab reaches the CTA link, Enter follows it (client navigation, the shell stays)
  await page.getByRole("navigation", { name: "Đường dẫn" }).getByRole("link").first().focus();
  await page.keyboard.press("Tab");
  const cta = banner.getByRole("link", { name: "Xem bảng giá" });
  await expect(cta).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/banner2\/news$/);
  await expect(page.getByRole("heading", { name: "Tin mới" })).toBeVisible();
  await expect(banner).toBeVisible();
  // close by keyboard: the app's middle comes back in the centre slot
  await banner.getByRole("button", { name: "Đóng thông báo" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-route-banner]")).toHaveCount(0);
  const middle = page.locator('header [data-route-slot="center"]').getByTestId("app-middle");
  await expect(middle).toBeVisible();
  const after = await header(page);
  expect(after.right).toBe(before.right);
  expect(after.avatarRight).toBe(before.avatarRight);
  // remembered: after a reload only the middle
  await page.reload();
  await expect(middle).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator("[data-route-banner]")).toHaveCount(0);
  await ctx.close();
});
