// Button's phone touch size (#146, review of #157): on a phone with a touch screen every Button is at least 44 × 44px
// as real size (BTN_HIT), so a tap lands on the button it is on, never on a neighbour, and a scroll row does not
// grow a vertical overflow. Buttons are built with buttonClass() into the docs page, so the real CSS applies.
import { expect, test } from "@playwright/test";
import { buttonClass } from "../styles/buttons";
import type { Page } from "@playwright/test";

/** Waits for React to adopt the page (hydration can replace nodes on a slow CI runner), then puts `html` in a fixed
 *  box on <body>, outside React's tree, at the top left of the viewport (on screen, so a tap reaches it). */
async function probe(page: Page, html: string) {
  await page.waitForFunction(() => {
    const el = document.querySelector("main");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  });
  await page.evaluate((h) => {
    const box = Object.assign(document.createElement("div"), { id: "btn-probes", innerHTML: h });
    box.style.cssText = "position:fixed;top:8px;left:8px;right:8px;z-index:9999;background:var(--color-panel, #fff)";
    document.body.append(box);
  }, html);
}

const icon = buttonClass("ghost", "sm", { iconOnly: true });

test("Button on a touch phone: 44px real size, adjacent icon buttons get their own taps, a scroll row has no vertical overflow", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await page.goto("/components/button/");
  expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
  await probe(
    page,
    `<div id="pair" class="flex items-center gap-1"><button id="a" class="${icon}" aria-label="A">A</button><button id="b" class="${icon}" aria-label="B">B</button></div>
     <div id="row" class="flex items-center gap-2 overflow-x-auto py-0.5">${`<button class="${icon}" aria-label="x">x</button>`.repeat(20)}</div>`,
  );
  await page.evaluate(() => {
    (window as unknown as { taps: string[] }).taps = [];
    for (const id of ["a", "b"]) document.getElementById(id)!.addEventListener("click", () => (window as unknown as { taps: string[] }).taps.push(id));
  });
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
  await probe(page, `<button id="m" class="${icon}" aria-label="M">M</button>`);
  const r = await page.locator("#m").boundingBox();
  expect([Math.round(r!.width), Math.round(r!.height)]).toEqual([28, 28]);
});

test("Button badge: the drawn count is aria-hidden; with an aria-label the label says it, without one the count is screen-reader text", async ({ page }) => {
  await page.goto("/components/badge/");
  const ex = page.locator('[data-example="badge/attention"]');
  await expect(ex.getByRole("button", { name: "Thông báo, 3 chưa đọc", exact: true })).toBeVisible();
  await expect(ex.getByRole("button", { name: "Duyệt (2)", exact: true })).toBeVisible();
});

// #162: CodeBlock's copy button at 44px on a touch phone stays inside its title row (above the border) and, with no
// title, inside the block and clear of the code.
test("CodeBlock on a touch phone: the 44px copy button stays in its title row, or clear of the code with no title (#162)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await page.goto("/components/code-block/");
  const ex = page.locator('[data-example="code-block/basic"]');
  const [plain, titled] = [ex.locator("pre").nth(0).locator(".."), ex.locator("pre").nth(1).locator("..")];
  // titled: the row holds the button; the border-b sits under it
  const head = titled.locator("div.border-b").first();
  const [h, b1] = [await head.boundingBox(), await head.getByRole("button").boundingBox()];
  expect(Math.min(b1!.width, b1!.height)).toBeGreaterThanOrEqual(44);
  expect(b1!.y).toBeGreaterThanOrEqual(h!.y - 0.5);
  expect(b1!.y + b1!.height).toBeLessThanOrEqual(h!.y + h!.height - 1 + 0.5); // above the 1px border
  // plain: the button sits inside the block, the code's padding keeps text clear of it
  const [box, b2] = [await plain.boundingBox(), await plain.getByRole("button").boundingBox()];
  expect(Math.min(b2!.width, b2!.height)).toBeGreaterThanOrEqual(44);
  expect(b2!.y + b2!.height).toBeLessThanOrEqual(box!.y + box!.height + 0.5);
  const textRight = await plain.locator("pre").evaluate((el) => el.getBoundingClientRect().right - parseFloat(getComputedStyle(el).paddingRight));
  expect(textRight).toBeLessThanOrEqual(b2!.x + 0.5);
  await page.close();
});

const outlined = (el: Element) => {
  const s = getComputedStyle(el);
  return `${s.outlineStyle} ${s.outlineWidth}`;
};

// #162: hand-made brand buttons take Button's focus look (2px outline), not the old ring or none.
test("FilterPanel apply and NumPadPopup confirm: a 2px focus outline, like Button (#162)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await page.goto("/components/filter-panel/");
  const open = page.locator('[data-example="filter-panel/phone"]').getByRole("button", { name: /^Bộ lọc/ });
  const panel = page.getByRole("dialog", { name: "Bộ lọc" });
  await expect(async () => {
    await open.click();
    await expect(panel).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  const apply = panel.getByRole("button", { name: /kết quả|^Đóng$/ }).last();
  await page.keyboard.press("Tab"); // keyboard modality, so focus() shows :focus-visible
  await apply.focus();
  expect(await apply.evaluate(outlined)).toBe("solid 2px");

  await page.goto("/components/number-input/");
  const input = page.locator('[data-example="number-input/basic"] input');
  const pad = page.getByRole("dialog");
  await expect(async () => {
    await input.click();
    await expect(pad).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  const ok = pad.getByRole("button", { name: "Xác nhận" });
  await page.keyboard.press("Tab");
  await ok.focus();
  expect(await ok.evaluate(outlined)).toBe("solid 2px");
  await page.close();
});

// #162: Button's focus outline is drawn (outline-solid with outline-2: Tailwind 4's outline-none sets the style to none).
test("Button: a visible 2px focus outline in the focus colour", async ({ page }) => {
  await page.goto("/components/button/");
  const btn = page.locator('[data-example="button/variants"] button.bg-subtle-button').first();
  await expect(btn).toBeVisible();
  await page.keyboard.press("Tab");
  await btn.focus();
  expect(await btn.evaluate(outlined)).toBe("solid 2px");
});
