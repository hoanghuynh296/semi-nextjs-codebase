// Form kit (#67): FormActions order and stickiness on a phone (375×812, above the keyboard and the safe area),
// useUnsavedGuard in the Next.js app router (link, back, reload, tab close), Field kind attributes, validation timing.
import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/form-actions/";
const FORM = '[data-example="form-actions/page-form"] form';

const names = (page: Page, sel: string) => page.locator(`${sel} [data-form-actions] button`).allInnerTexts();

test("FormActions: Huỷ (ghost) then Tạo (primary), right-aligned; the destructive action alone on the left", async ({ page }) => {
  await page.goto(PAGE);
  expect((await names(page, FORM)).map((s) => s.trim())).toEqual(["Huỷ", "Tạo"]);
  const bar = page.locator(`${FORM} [data-form-actions]`);
  const [cancel, create] = [bar.getByRole("button", { name: "Huỷ" }), bar.getByRole("button", { name: "Tạo" })];
  const b = await page.locator(FORM).boundingBox(); // the bar bleeds into the page padding and pads itself back: buttons end where the form ends
  const [c, p] = [await cancel.boundingBox(), await create.boundingBox()];
  expect(c!.x).toBeLessThan(p!.x);
  expect(Math.abs(p!.x + p!.width - (b!.x + b!.width))).toBeLessThanOrEqual(2); // right edge of the row
  await expect(create).toHaveAttribute("type", "submit");
  await expect(cancel).toHaveAttribute("type", "button");
  expect(await cancel.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)"); // ghost
  expect(await create.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)"); // filled

  const sel = '[data-example="form-actions/destructive"] form';
  expect((await names(page, sel)).map((s) => s.trim())).toEqual(["Xoá máy in", "Huỷ", "Lưu"]);
  const row = page.locator(`${sel} [data-form-actions]`);
  const rb = await page.locator(sel).boundingBox();
  const del = await row.getByRole("button", { name: "Xoá máy in" }).boundingBox();
  const save = await row.getByRole("button", { name: "Lưu" }).boundingBox();
  expect(del!.x - rb!.x).toBeLessThanOrEqual(2); // left edge
  expect(Math.abs(save!.x + save!.width - (rb!.x + rb!.width))).toBeLessThanOrEqual(2); // right edge
});

test("FormActions in a Modal: the footer, the same order, 44px buttons on a phone", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await page.goto(PAGE);
  await page.locator('[data-example="form-actions/modal"]').getByRole("button", { name: "Đổi tên máy in" }).click();
  const dialog = page.getByRole("dialog", { name: "Đổi tên máy in" });
  await expect(dialog.locator('[data-form-actions="modal"]')).toBeVisible();
  expect((await dialog.locator("[data-form-actions] button").allInnerTexts()).map((s) => s.trim())).toEqual(["Huỷ", "Lưu"]);
  for (const name of ["Huỷ", "Lưu"]) expect((await dialog.getByRole("button", { name, exact: true }).boundingBox())!.height).toBeCloseTo(44, 0);
  expect(await dialog.locator('[data-form-actions="modal"]').evaluate((el) => getComputedStyle(el).position)).not.toBe("sticky");
  await dialog.getByRole("button", { name: "Huỷ" }).click();
  await expect(dialog).toHaveCount(0);
  await page.close();
});

/** A phone with a tall form: the preview box does not scroll, so the bar sticks to the page's viewport. */
async function phoneWithTallForm(browser: import("@playwright/test").Browser, keyboard = false) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  if (keyboard) {
    // a stand-in visualViewport the test can shrink (a headless browser has no on-screen keyboard)
    await page.addInitScript(() => {
      const vv = Object.assign(new EventTarget(), { height: window.innerHeight, offsetTop: 0, scale: 1 });
      Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
    });
  }
  await page.goto(PAGE);
  // the static HTML shows before React hydrates (slow on CI); hydration can replace the form's nodes, so wait for it
  // before the test edits the DOM (React puts its fiber key on a node it has adopted)
  await page.waitForFunction((form) => {
    const el = document.querySelector(form);
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  }, FORM);
  await page.evaluate((form) => {
    const f = document.querySelector(form) as HTMLElement;
    for (let el: HTMLElement | null = f; el && el !== document.body; el = el.parentElement) el.style.overflow = "visible";
    const spacer = document.createElement("div");
    spacer.style.height = "1600px";
    f.insertBefore(spacer, f.querySelector("[data-form-actions]"));
  }, FORM);
  await page.locator(FORM).scrollIntoViewIfNeeded();
  await page.evaluate((form) => window.scrollTo(0, (document.querySelector(form) as HTMLElement).getBoundingClientRect().top + scrollY - 100), FORM);
  return page;
}

test("FormActions on a phone: sticks to the bottom of the screen with 44px buttons, however far the form runs on", async ({ browser }) => {
  const page = await phoneWithTallForm(browser);
  const bar = page.locator(`${FORM} [data-form-actions]`);
  const place = async () => (await bar.boundingBox())!;
  let b = await place();
  expect(b.y + b.height).toBeCloseTo(812, 0); // pinned to the bottom edge while the form is still above it
  await page.mouse.wheel(0, 400);
  b = await place();
  expect(b.y + b.height).toBeCloseTo(812, 0);
  expect(await bar.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
  for (const name of ["Huỷ", "Tạo"]) expect((await bar.getByRole("button", { name, exact: true }).boundingBox())!.height).toBeCloseTo(44, 0);
  // the home-indicator inset sits below the buttons (env() is 0 here, so the 12px floor shows)
  expect(await bar.evaluate((el) => (el as HTMLElement).style.paddingBottom)).toContain("env(safe-area-inset-bottom)");
  expect(parseFloat(await bar.evaluate((el) => getComputedStyle(el).paddingBottom))).toBeGreaterThanOrEqual(12);
  await page.close();
});

test("FormActions on a phone: the bar rides above the on-screen keyboard and drops back when it closes", async ({ browser }) => {
  const page = await phoneWithTallForm(browser, true);
  const bar = page.locator(`${FORM} [data-form-actions]`);
  const bottom = async () => {
    const b = (await bar.boundingBox())!;
    return Math.round(b.y + b.height);
  };
  expect(await bottom()).toBe(812);
  await page.evaluate(() => {
    // the keyboard opens: the visual viewport is 342px shorter
    Object.assign(window.visualViewport!, { height: 470 });
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect.poll(bottom).toBe(812 - 342); // bar bottom = top of the keyboard
  const pad = await bar.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
  expect(pad).toBeCloseTo(12, 0); // the keyboard covers the safe area: no extra inset
  await page.evaluate(() => {
    Object.assign(window.visualViewport!, { height: 812 });
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect.poll(bottom).toBe(812);
  await page.close();
});

// ---- useUnsavedGuard with the app router (the docs site is a Next.js app router app) ----

const nameField = (page: Page) => page.locator(FORM).getByLabel("Tên máy in", { exact: false });
const toButton = (page: Page) => page.locator('a[href$="/components/button/"]').first();

test("useUnsavedGuard · route change: a link click asks, Ở lại keeps the typed text, Rời đi goes", async ({ page }) => {
  await page.goto(PAGE);
  await nameField(page).fill("Bambu P1S");
  await toButton(page).click();
  const ask = page.getByRole("alertdialog", { name: "Rời khỏi trang?" });
  await expect(ask).toContainText("Bạn có thay đổi chưa lưu");
  await ask.getByRole("button", { name: "Ở lại" }).click();
  await expect(page).toHaveURL(/\/components\/form-actions\/$/);
  await expect(nameField(page)).toHaveValue("Bambu P1S");
  await toButton(page).click();
  await page.getByRole("alertdialog", { name: "Rời khỏi trang?" }).getByRole("button", { name: "Rời đi" }).click();
  await expect(page).toHaveURL(/\/components\/button\/$/);
});

test("useUnsavedGuard · a clean form never asks", async ({ page }) => {
  await page.goto(PAGE);
  await toButton(page).click();
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  // typed and then emptied again is clean too
  await page.goBack();
  await nameField(page).fill("x");
  await nameField(page).fill("");
  const prevented = await page.evaluate(() => {
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(prevented).toBe(false);
});

test("useUnsavedGuard · back and forward: asked once, Ở lại stays on the form, Rời đi goes back", async ({ page }) => {
  await page.goto("/components/button/");
  await page.locator('a[href$="/components/form-actions/"]').first().click();
  await expect(page).toHaveURL(/\/components\/form-actions\/$/);
  await nameField(page).fill("Bambu P1S");
  await page.goBack();
  const ask = page.getByRole("alertdialog", { name: "Rời khỏi trang?" });
  await expect(ask).toBeVisible();
  await ask.getByRole("button", { name: "Ở lại" }).click();
  await expect(page).toHaveURL(/\/components\/form-actions\/$/);
  await expect(nameField(page)).toHaveValue("Bambu P1S");
  await page.goBack();
  await page.getByRole("alertdialog", { name: "Rời khỏi trang?" }).getByRole("button", { name: "Rời đi" }).click();
  await expect(page).toHaveURL(/\/components\/button\/$/);
});

test("useUnsavedGuard · reload and tab close: the browser's prompt only while there are unsaved changes", async ({ page }) => {
  await page.goto(PAGE);
  const fire = () =>
    page.evaluate(() => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    });
  expect(await fire()).toBe(false);
  await nameField(page).fill("Bambu P1S");
  expect(await fire()).toBe(true);
  // the real prompt on closing the tab
  const prompt = page.waitForEvent("dialog");
  const closing = page.close({ runBeforeUnload: true });
  const d = await prompt;
  expect(d.type()).toBe("beforeunload");
  await d.accept(); // "Leave"
  await closing;
});

const LEAVE = (page: Page) => page.getByRole("alertdialog", { name: "Rời khỏi trang?" });
const historyLength = (page: Page) => page.evaluate(() => history.length);

test("useUnsavedGuard · Huỷ with confirmLeave(router.back) asks once and goes back one step", async ({ page }) => {
  await page.goto("/components/button/");
  await page.locator('a[href$="/components/form-actions/"]').first().click();
  await nameField(page).fill("Bambu P1S");
  await page.locator(FORM).getByRole("button", { name: "Huỷ" }).click();
  await LEAVE(page).getByRole("button", { name: "Rời đi" }).click();
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await page.waitForTimeout(600); // a second prompt would show by now
  await expect(LEAVE(page)).toHaveCount(0);
});

test("useUnsavedGuard · after Rời đi on a link the history has one entry for the new page: Back is one press", async ({ page }) => {
  await page.goto("/components/button/");
  await page.locator('a[href$="/components/form-actions/"]').first().click();
  await nameField(page).fill("Bambu P1S");
  await page.locator('a[href$="/components/states/"]').first().click();
  await LEAVE(page).getByRole("button", { name: "Rời đi" }).click();
  await expect(page).toHaveURL(/\/components\/states\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/components\/form-actions\/$/); // one press, not two
  await expect(nameField(page)).toHaveValue(""); // a fresh, clean page
  await page.goBack();
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await expect(LEAVE(page)).toHaveCount(0);
});

test("useUnsavedGuard · a plain <a> (hard navigation) asks once, then leaves without the browser's prompt", async ({ page }) => {
  await page.goto(PAGE);
  await nameField(page).fill("Bambu P1S");
  await page.evaluate(() => {
    const a = document.createElement("a");
    a.href = "/foundations/";
    a.id = "plain-link";
    a.textContent = "plain";
    document.body.appendChild(a);
  });
  const browserPrompts: string[] = [];
  page.on("dialog", (d) => {
    browserPrompts.push(d.type());
    void d.accept();
  });
  await page.locator("#plain-link").dispatchEvent("click");
  await LEAVE(page).getByRole("button", { name: "Rời đi" }).click();
  await expect(page).toHaveURL(/\/foundations\/$/);
  expect(browserPrompts).toEqual([]);
});

test("useUnsavedGuard · save: the entry is spent, confirmLeave(router.push) goes on without a question and Back is one press", async ({ page }) => {
  await page.goto("/components/button/");
  await page.locator('a[href$="/components/form-actions/"]').first().click();
  await expect(page).toHaveURL(/\/components\/form-actions\/$/);
  const lengthBefore = await historyLength(page);
  const f = page.locator(FORM);
  await f.getByLabel("Tên máy in").fill("Bambu P1S");
  await f.getByLabel("Email liên hệ").fill("ban@congty.vn");
  expect(await historyLength(page)).toBe(lengthBefore + 1); // one entry while dirty
  await f.getByRole("button", { name: "Tạo" }).click();
  // the example calls confirmLeave(() => router.push("/components/button/")) once the form is clean
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await expect(page.getByText("Đã tạo máy in")).toBeVisible();
  await page.waitForTimeout(600); // a pending history.back() or a late prompt would show by now
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await expect(LEAVE(page)).toHaveCount(0);
  await page.goBack();
  await page.goBack(); // button → (form) → button: the form page, then the first button page; no dead press between
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

test("useUnsavedGuard · saved but staying: the entry is spent, not a marker, and the browser no longer prompts", async ({ page }) => {
  await page.goto(PAGE);
  const state = () => page.evaluate(() => (history.state as Record<string, unknown> | null)?.__semiUnsavedGuard);
  const d = page.locator('[data-example="form-actions/destructive"] form');
  await d.getByLabel("Tên máy in").fill("Bambu P1S đổi tên");
  await expect.poll(state).toBe(true);
  await d.evaluate((el) => (el as HTMLFormElement).requestSubmit()); // saves: clean again, stays on the page
  await expect.poll(state).toBe("spent");
  const prevented = await page.evaluate(() => {
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(prevented).toBe(false);
  // dirty again re-uses the spent entry instead of stacking another one
  const n = await historyLength(page);
  await d.getByLabel("Tên máy in").fill("lại");
  await expect.poll(state).toBe(true);
  expect(await historyLength(page)).toBe(n);
});

test("useUnsavedGuard · an agreed confirmLeave that does not navigate (delete declined) guards the form again", async ({ page }) => {
  await page.goto(PAGE);
  const d = page.locator('[data-example="form-actions/destructive"] form');
  await d.getByLabel("Tên máy in").fill("Bambu P1S đổi tên");
  await d.getByRole("button", { name: "Xoá máy in" }).click();
  await LEAVE(page).getByRole("button", { name: "Rời đi" }).click();
  await page.getByRole("alertdialog", { name: "Xoá máy in này?" }).getByRole("button", { name: "Huỷ" }).click(); // no navigation
  await page.waitForTimeout(1300); // the grace period
  const prevented = () =>
    page.evaluate(() => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    });
  expect(await prevented()).toBe(true);
  expect(await page.evaluate(() => (history.state as Record<string, unknown> | null)?.__semiUnsavedGuard)).toBe(true);
  await toButton(page).click();
  await expect(LEAVE(page)).toBeVisible(); // links ask again
});

// ---- Field kind ----

test("Field kind: type, inputMode, autoComplete and enterKeyHint of each kind", async ({ page }) => {
  await page.goto("/components/field/");
  const ex = page.locator('[data-example="field/kinds"]');
  const attrs = (label: string) =>
    ex.getByLabel(label).evaluate((el) => ({ type: (el as HTMLInputElement).type, inputmode: el.getAttribute("inputmode"), autocomplete: el.getAttribute("autocomplete"), enterkeyhint: el.getAttribute("enterkeyhint") }));
  expect(await attrs("Email")).toEqual({ type: "email", inputmode: "email", autocomplete: "email", enterkeyhint: "next" });
  expect(await attrs("Số điện thoại")).toEqual({ type: "tel", inputmode: "tel", autocomplete: "tel", enterkeyhint: "next" });
  expect(await attrs("Số lượng")).toEqual({ type: "text", inputmode: "decimal", autocomplete: "off", enterkeyhint: "next" });
  expect(await attrs("Giá bán (₫)")).toEqual({ type: "text", inputmode: "decimal", autocomplete: "off", enterkeyhint: "next" });
  expect(await attrs("Website")).toEqual({ type: "url", inputmode: "url", autocomplete: "url", enterkeyhint: "next" });
  expect(await attrs("Mật khẩu")).toEqual({ type: "password", inputmode: "text", autocomplete: "current-password", enterkeyhint: "go" });
  expect(await attrs("Tìm kiếm")).toEqual({ type: "search", inputmode: "search", autocomplete: "off", enterkeyhint: "search" });
});

test("Field without a kind sets none of them, and a prop on the control wins over the kind", async ({ page }) => {
  await page.goto("/components/field/");
  const plain = await page.locator('[data-example="field/basic"] input').first().evaluate((el) => ({ im: el.getAttribute("inputmode"), ac: el.getAttribute("autocomplete"), eh: el.getAttribute("enterkeyhint") }));
  expect(plain).toEqual({ im: null, ac: null, eh: null });
  // the Wi-Fi password in the input-group example is kind="password" with its own type (text while shown)
  await page.goto("/components/input-group/");
  const wifi = page.locator('[data-example="input-group/addons"]').getByLabel("Mật khẩu Wi-Fi máy in");
  await expect(wifi).toHaveAttribute("type", "password");
  await expect(wifi).toHaveAttribute("autocomplete", "current-password");
  await page.locator('[data-example="input-group/addons"]').getByRole("button", { name: "Hiện" }).click();
  await expect(wifi).toHaveAttribute("type", "text"); // the control's own prop beat the kind's type
  await expect(wifi).toHaveAttribute("inputmode", "text");
});

// ---- validation timing ----

test("validation: silent while filling, error on blur, then it follows every change; two errors add the summary above FormActions", async ({ page }) => {
  await page.goto(PAGE);
  const f = page.locator(FORM);
  const name = f.getByLabel("Tên máy in");
  const email = f.getByLabel("Email liên hệ");
  const err = (text: string) => f.getByText(text, { exact: true });

  await name.focus();
  await page.keyboard.type("B");
  await page.keyboard.press("Backspace");
  await expect(err("Nhập tên máy in.")).toHaveCount(0); // nothing before the first blur
  await email.focus(); // blur the name
  await expect(err("Nhập tên máy in.")).toBeVisible();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(f.getByRole("alert")).toHaveCount(1); // one error: under its field only, no summary
  await name.focus();
  await page.keyboard.type("M");
  await expect(err("Nhập tên máy in.")).toHaveCount(0); // on change it clears at once

  await email.fill("abc");
  await name.focus(); // blur the email
  await expect(err("Email chưa đúng, ví dụ ten@congty.vn.")).toBeVisible();
  await email.fill("abc@congty");
  await expect(err("Email chưa đúng, ví dụ ten@congty.vn.")).toBeVisible(); // still wrong, still shown
  await email.fill("abc@congty.vn");
  await expect(err("Email chưa đúng, ví dụ ten@congty.vn.")).toHaveCount(0);

  // Tạo with everything wrong: both errors under their fields, plus the summary
  await name.fill("");
  await email.fill("");
  await f.getByRole("button", { name: "Tạo" }).click();
  const summary = f.getByRole("alert").filter({ hasText: "Có 2 mục cần sửa" });
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("Nhập tên máy in.");
  const [s, a] = [await summary.boundingBox(), await f.locator("[data-form-actions]").boundingBox()];
  expect(s!.y + s!.height).toBeLessThanOrEqual(a!.y + 1); // above FormActions
  await expect(f.getByText("Đã tạo máy in")).toHaveCount(0);
});
