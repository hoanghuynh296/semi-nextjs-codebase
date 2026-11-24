// Button's phone touch size (#146, review of #157): on a phone with a touch screen every Button is at least 44 × 44px
// as real size (BTN_HIT), so a tap lands on the button it is on, never on a neighbour, and a scroll row does not
// grow a vertical overflow. Buttons are built with buttonClass() into the docs page, so the real CSS applies.
import { expect, test } from "@playwright/test";
import { buttonClass } from "../styles/buttons";

const icon = buttonClass("ghost", "sm", { iconOnly: true });

test("Button on a touch phone: 44px real size, adjacent icon buttons get their own taps, a scroll row has no vertical overflow", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await page.goto("/components/button/");
  expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
  await page.evaluate((cls) => {
    const box = document.createElement("div");
    box.innerHTML = `<div id="pair" class="flex items-center gap-1"><button id="a" class="${cls}" aria-label="A">A</button><button id="b" class="${cls}" aria-label="B">B</button></div>
      <div id="row" class="flex items-center gap-2 overflow-x-auto py-0.5">${`<button class="${cls}" aria-label="x">x</button>`.repeat(20)}</div>`;
    document.querySelector("main")!.prepend(box);
    (window as unknown as { taps: string[] }).taps = [];
    for (const id of ["a", "b"]) document.getElementById(id)!.addEventListener("click", () => (window as unknown as { taps: string[] }).taps.push(id));
  }, icon);
  const [a, b] = [await page.locator("#a").boundingBox(), await page.locator("#b").boundingBox()];
  for (const r of [a!, b!]) expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(44);
  expect(b!.x - (a!.x + a!.width)).toBeGreaterThanOrEqual(3); // the gap stays: nothing covers it
  await page.touchscreen.tap(a!.x + a!.width - 2, a!.y + a!.height / 2);
  await page.touchscreen.tap(b!.x + 2, b!.y + b!.height / 2);
  expect(await page.evaluate(() => (window as unknown as { taps: string[] }).taps)).toEqual(["a", "b"]);
  const row = page.locator("#row");
  expect(await row.evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
  await page.close();
});

test("Button with a mouse: the drawn size (sm icon 28px), no touch growth", async ({ page }) => {
  await page.goto("/components/button/");
  await page.evaluate((cls) => document.querySelector("main")!.insertAdjacentHTML("afterbegin", `<button id="m" class="${cls}" aria-label="M">M</button>`), icon);
  const r = await page.locator("#m").boundingBox();
  expect([Math.round(r!.width), Math.round(r!.height)]).toEqual([28, 28]);
});

test("Button badge: the drawn count is aria-hidden; with an aria-label the label says it, without one the count is screen-reader text", async ({ page }) => {
  await page.goto("/components/badge/");
  const ex = page.locator('[data-example="badge/attention"]');
  await expect(ex.getByRole("button", { name: "Thông báo, 3 chưa đọc", exact: true })).toBeVisible();
  await expect(ex.getByRole("button", { name: "Duyệt (2)", exact: true })).toBeVisible();
});
