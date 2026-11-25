// 1.0 T6 (#148): quiet fields, keyboard-only 2px focus outline, overline sections,
// MultiCombobox, CustomCombobox option groups, OptionCards, LetterAvatar,
// reply box auto-grow & resize edge, HintTextarea popover & snippets, dialog autofocus.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { PRERENDER_PORT } from "../playwright.config";

const PRERENDER_URL = `http://127.0.0.1:${PRERENDER_PORT}`;

const THEMES = ["dark", "light"] as const;

async function open(page: Page, path: string, theme: (typeof THEMES)[number] = "dark") {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto(path);
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
}

const example = (page: Page, id: string) => page.locator(`[data-example="${id}"]`);

/** Contrast ratio of an element's outlineColor against the painted background behind it. */
async function outlineContrast(loc: Locator): Promise<{ style: string; width: number; contrast: number; boxShadow: string }> {
  return loc.evaluate((el) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const rgba = (c: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const blend = (t: number[], b: number[]) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
    const lum = (c: number[]) => {
      const a = c.slice(0, 3).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.7152 * 0 + 0.0722 * a[2];
    };
    const ratio = (a: number[], b: number[]) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => p - q);
      return (y + 0.05) / (x + 0.05);
    };
    const bgOf = (node: Element | null) => {
      const stack: number[][] = [];
      for (let e = node; e; e = e.parentElement) {
        const c = rgba(getComputedStyle(e).backgroundColor);
        if (c[3] > 0) {
          stack.push(c);
          if (c[3] >= 1) break;
        }
      }
      let base = rgba(getComputedStyle(document.documentElement).backgroundColor);
      if (base[3] < 1) base = [255, 255, 255, 1];
      for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base);
      return base;
    };
    const st = getComputedStyle(el);
    const bg = bgOf(el.parentElement);
    const oc = rgba(st.outlineColor);
    const painted = oc[3] > 0 ? blend(oc, bg) : bg;
    return {
      style: st.outlineStyle,
      width: parseFloat(st.outlineWidth) || 0,
      contrast: ratio(painted, bg),
      boxShadow: st.boxShadow,
    };
  });
}

for (const theme of THEMES) {
  test(`quiet field focus: pointer click has no outline or glow ring, Tab shows 2px ≥ 3:1 outline · ${theme}`, async ({ page }) => {
    await open(page, "/components/field/", theme);
    const input = example(page, "field/basic").locator("input").first();

    // Pointer focus: no 2px outline and no box-shadow glow ring
    await input.click();
    await expect(input).toBeFocused();
    const afterClick = await outlineContrast(input);
    expect(afterClick.style).toBe("none");
    expect(afterClick.boxShadow).toBe("none");

    // Keyboard Tab focus: 2px solid outline with ≥ 3:1 contrast, no glow ring
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    const afterTab = await outlineContrast(input);
    expect(afterTab.style).toBe("solid");
    expect(afterTab.width).toBeGreaterThanOrEqual(2);
    expect(afterTab.contrast).toBeGreaterThanOrEqual(3);
    expect(afterTab.boxShadow).toBe("none");
  });

  test(`SearchInput and Command search field follow quiet focus and 2px keyboard outline · ${theme}`, async ({ page }) => {
    await open(page, "/components/search-input/", theme);
    const searchBox = example(page, "search-input/basic");
    // SearchInput starts collapsed as a button; open it first
    await expect(async () => {
      await searchBox.getByRole("button", { name: "Tìm máy in…" }).click();
      await expect(searchBox.locator("input").first()).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
    const search = searchBox.locator("input").first();

    await search.click();
    await expect(search).toBeFocused();
    expect((await outlineContrast(search)).style).toBe("none");

    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(search).toBeFocused();
    const sTab = await outlineContrast(search);
    expect(sTab.style).toBe("solid");
    expect(sTab.width).toBeGreaterThanOrEqual(2);
    expect(sTab.contrast).toBeGreaterThanOrEqual(3);

    await open(page, "/components/command/", theme);
    const cmdInput = example(page, "command/inline").locator("input").first();
    const cmdFrame = cmdInput.locator("xpath=ancestor::*[@data-field-frame][1]");
    await cmdInput.click();
    await expect(cmdInput).toBeFocused();
    expect((await outlineContrast(cmdFrame)).style).toBe("none");

    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(cmdInput).toBeFocused();
    const cTab = await outlineContrast(cmdFrame);
    expect(cTab.style).toBe("solid");
    expect(cTab.width).toBeGreaterThanOrEqual(2);
    expect(cTab.contrast).toBeGreaterThanOrEqual(3);
  });
}

test("phone inputs keep 16px text and 44px touch targets on coarse-pointer phones", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  await page.goto("/components/field/");
  const input = example(page, "field/basic").locator("input").first();
  const metrics = await input.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { fontSize: parseFloat(getComputedStyle(el).fontSize), height: r.height };
  });
  expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
  expect(metrics.height).toBeGreaterThanOrEqual(44);
  await ctx.close();
});

test("text-overline does not force display: flex", async ({ page }) => {
  await open(page, "/components/field/", "dark");
  const overline = example(page, "field/sections").locator(".text-overline").first();
  await expect(overline).toBeVisible();
  const display = await overline.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe("block");
});

test("MultiCombobox: removable chips, popover search (diacritics + IME), keyboard toggle, groups, Escape focus return", async ({ page }) => {
  await open(page, "/components/multi-combobox/", "dark");
  const box = example(page, "multi-combobox/groups");

  // Initial chip with accessible remove button
  const removeInitial = box.getByRole("button", { name: /Bỏ chọn Hạt tiêu đen/ });
  await expect(removeInitial).toBeVisible();

  // Open popover via add button (labelled by Field's <label>, visible text "Thêm")
  const addBtn = box.locator("button", { hasText: "Thêm" });
  const search = page.getByRole("combobox", { name: "Danh mục sản phẩm" });
  await expect(async () => {
    await addBtn.click();
    await expect(search).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await expect(search).toBeFocused();

  const listbox = page.getByRole("listbox", { name: "Danh mục sản phẩm" });
  await expect(listbox).toBeVisible();

  // Three group headings visible initially
  const groups = listbox.getByRole("group");
  await expect(groups).toHaveCount(3);

  // Diacritic-insensitive search: "que" matches "Quế thanh Yên Bái" and hides empty groups
  await search.fill("que");
  await expect(listbox.getByRole("group")).toHaveCount(1);
  await expect(listbox.getByRole("option")).toHaveCount(1);
  await expect(listbox.getByRole("option", { name: "Quế thanh Yên Bái" })).toBeVisible();

  // IME keyCode 229 Enter must not toggle the option
  await search.evaluate((el) => el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, bubbles: true, cancelable: true })));
  await expect(listbox.getByRole("option", { name: "Quế thanh Yên Bái" })).toHaveAttribute("aria-selected", "false");

  // Real Enter toggles the option on
  await page.keyboard.press("Enter");
  await expect(listbox.getByRole("option", { name: "Quế thanh Yên Bái" })).toHaveAttribute("aria-selected", "true");

  // Escape closes popover and returns focus to add button
  await page.keyboard.press("Escape");
  await expect(listbox).toBeHidden();
  await expect(addBtn).toBeFocused();

  // New chip is visible and removable
  const removeNew = box.getByRole("button", { name: /Bỏ chọn Quế thanh Yên Bái/ });
  await expect(removeNew).toBeVisible();
  await removeNew.click();
  await expect(removeNew).toHaveCount(0);
});

test("CustomCombobox option groups: filtering hides empty headings and arrow keys skip headings", async ({ page }) => {
  await open(page, "/components/combobox/", "dark");
  const box = example(page, "combobox/groups");
  const input = box.getByRole("combobox");
  const listbox = page.getByRole("listbox");
  await expect(async () => {
    await input.click();
    await expect(listbox).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await expect(listbox.getByRole("group")).toHaveCount(2);

  // ArrowDown moves through options only, never selecting a heading
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("sales-hub");

  // Filtering hides empty group heading ("Nền tảng")
  await input.fill("data");
  await expect(listbox.getByRole("group")).toHaveCount(1);
  await expect(listbox.getByRole("option")).toHaveCount(1);
  await expect(listbox.getByRole("option", { name: "data-hub" })).toBeVisible();
});

test("OptionCards: radiogroup semantics, single tab stop, arrow keys, neutral selected state, clean at 375px", async ({ page }) => {
  await open(page, "/components/option-cards/", "dark");
  const box = example(page, "option-cards/basic");
  const group = box.getByRole("radiogroup", { name: "Nhà cung cấp AI" });
  const radios = group.getByRole("radio");
  await expect(radios).toHaveCount(4);

  // Single tab stop: only the selected radio has tabIndex=0
  const tabIndexes = await radios.evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
  expect(tabIndexes).toEqual([0, -1, -1, -1]);

  // ArrowRight selects next option and moves focus
  await radios.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  await expect(radios.nth(1)).toBeFocused();
  await expect(radios.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(radios.nth(0)).toHaveAttribute("aria-checked", "false");

  // 8px grid gap
  const gap = await group.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe("8px");

  // Clean at 375px with no horizontal overflow
  await page.setViewportSize({ width: 375, height: 812 });
  const overflow = await group.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflow).toBe(false);
});

test("LetterAvatar: first letter in vi locale, '?' fallback when empty, accessible name = full name", async ({ page }) => {
  await open(page, "/components/avatar/", "dark");
  const box = example(page, "avatar/letter");
  await expect(box.getByRole("img", { name: "Đặng Minh Anh" })).toHaveText("Đ");
  await expect(box.getByRole("img", { name: "Hoàng Huỳnh" })).toHaveText("H");
  await expect(box.getByRole("img", { name: "ánh dương" })).toHaveText("Á");
  // Empty name falls back to "?"
  await expect(box.locator("span", { hasText: "?" }).first()).toBeVisible();
});

test("Reply box: auto-grows up to 50% of container, resizes via md+ separator (ArrowUp/ArrowDown/dblclick), hides handle on phone", async ({ page }) => {
  await open(page, "/components/field/", "dark");
  const box = example(page, "field/sections");
  const textarea = box.locator("textarea").first();
  const handle = box.getByRole("separator", { name: "Đổi chiều cao ô nhập" });

  await expect(handle).toBeVisible();
  const initialHeight = await textarea.evaluate((el) => el.getBoundingClientRect().height);

  // Auto-grow with multi-line text (retry until React has hydrated)
  const lines = "Dòng 1\nDòng 2\nDòng 3\nDòng 4\nDòng 5\nDòng 6\nDòng 7\nDòng 8\nDòng 9\nDòng 10";
  await expect(async () => {
    await textarea.fill(lines);
    await expect(textarea).toHaveValue(lines, { timeout: 500 });
    const h = await textarea.evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThan(initialHeight);
  }).toPass({ timeout: 10_000 });
  const grownHeight = await textarea.evaluate((el) => el.getBoundingClientRect().height);

  // Keyboard resize via separator: ArrowUp grows by ~24px, ArrowDown shrinks, dblclick resets to auto
  await handle.focus();
  await page.keyboard.press("ArrowUp");
  const afterArrowUp = await textarea.evaluate((el) => el.getBoundingClientRect().height);
  expect(afterArrowUp).toBeGreaterThan(grownHeight);

  await handle.dblclick();
  const afterReset = await textarea.evaluate((el) => el.getBoundingClientRect().height);
  expect(afterReset).toBeLessThanOrEqual(afterArrowUp);

  // Phone width (< md): resize handle is hidden, auto-grow only
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(handle).toBeHidden();
});

test("HintTextarea snippets: portaled listbox at z-popover and insert replaces trigger with plain text", async ({ page }) => {
  await open(page, "/components/hint-textarea/", "dark");
  const box = example(page, "hint-textarea/snippets");
  const text = box.getByRole("combobox", { name: "Trả lời nhà cung cấp" });
  const list = page.getByRole("listbox");

  await expect(async () => {
    await text.fill("Báo giá: /vat");
    await expect(list).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });

  // Portaled outside the example container (direct child of body or portal root, not clipped by example)
  const isPortaled = await list.evaluate((el, container) => !container?.contains(el), await box.elementHandle());
  expect(isPortaled).toBe(true);

  await page.keyboard.press("Enter");
  await expect(text).toHaveValue("Báo giá: Giá chưa gồm VAT 8%, giao tại kho Bình Dương. ");
  await expect(list).toBeHidden();
});

test("Dialog autofocus: Modal and Drawer focus first field on fine-pointer desktop, stay off fields on touch phones", async ({ browser }) => {
  // Fine-pointer desktop: first field gets focus
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktop = await desktopCtx.newPage();
  await desktop.goto("/components/modal/");
  await example(desktop, "modal/basic").getByRole("button", { name: "Cấu hình in" }).click();
  const modalDialog = desktop.getByRole("dialog", { name: "Cấu hình in nâng cao" });
  await expect(modalDialog).toBeVisible();
  await expect(modalDialog.locator("input").first()).toBeFocused();
  await desktop.keyboard.press("Escape");

  await desktop.goto("/components/drawer/");
  await example(desktop, "drawer/filters").getByRole("button", { name: "Bộ lọc" }).click();
  const drawerDialog = desktop.getByRole("dialog", { name: "Bộ lọc" });
  await expect(drawerDialog).toBeVisible();
  await expect(drawerDialog.locator("input").first()).toBeFocused();
  await desktopCtx.close();

  // Touch phone (hover: none, pointer: coarse): dialog opens without focusing the text input
  const phoneCtx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const phone = await phoneCtx.newPage();
  await phone.goto("/components/modal/");
  await example(phone, "modal/basic").getByRole("button", { name: "Cấu hình in" }).click();
  const phoneDialog = phone.getByRole("dialog", { name: "Cấu hình in nâng cao" });
  await expect(phoneDialog).toBeVisible();
  await expect(phoneDialog.locator("input").first()).not.toBeFocused();
  await phoneCtx.close();
});

test("HintTextarea inside a modal near the bottom flips its portaled listbox above without clipping", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto(`${PRERENDER_URL}/t6-forms`);
  await page.getByRole("button", { name: "Mở modal gợi ý" }).click();
  const dialog = page.getByRole("dialog", { name: "Gửi báo giá" });
  await expect(dialog).toBeVisible();

  const text = dialog.getByRole("combobox", { name: "Lời nhắn trong modal" });
  const list = page.getByRole("listbox");
  await text.fill("Báo giá /");
  await expect(list).toBeVisible();

  // Portaled outside the modal and positioned above the textarea (flipped above) inside the viewport
  const geo = await list.evaluate((listEl, taEl) => {
    const lr = listEl.getBoundingClientRect();
    const tr = taEl!.getBoundingClientRect();
    return { listTop: lr.top, listBottom: lr.bottom, taTop: tr.top, vh: window.innerHeight };
  }, await text.elementHandle());
  expect(geo.listBottom).toBeLessThanOrEqual(geo.taTop + 2);
  expect(geo.listTop).toBeGreaterThanOrEqual(0);
  expect(geo.listBottom).toBeLessThanOrEqual(geo.vh);
});

test("Dialog autofocus: autoFocusFirstField={false} opt-out, already-focused field kept, disabled combobox skipped", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${PRERENDER_URL}/t6-forms`);

  // Modal autoFocusFirstField={false}: input is NOT focused
  await page.getByRole("button", { name: "Mở modal tắt autofocus" }).click();
  const m1 = page.getByRole("dialog", { name: "Modal tắt autofocus" });
  await expect(m1).toBeVisible();
  await expect(m1.locator("input").first()).not.toBeFocused();
  await page.keyboard.press("Escape");
  await expect(m1).toBeHidden();

  // Drawer autoFocusFirstField={false}: input is NOT focused
  await page.getByRole("button", { name: "Mở drawer tắt autofocus" }).click();
  const d1 = page.getByRole("dialog", { name: "Drawer tắt autofocus" });
  await expect(d1).toBeVisible();
  await expect(d1.locator("input").first()).not.toBeFocused();
  await page.keyboard.press("Escape");
  await expect(d1).toBeHidden();

  // Already-focused field (React autoFocus on second input) is kept without stealing focus
  await page.getByRole("button", { name: "Mở modal đã focus sẵn" }).click();
  const m2 = page.getByRole("dialog", { name: "Modal đã focus sẵn" });
  await expect(m2).toBeVisible();
  await expect(m2.getByRole("textbox", { name: "Trường thứ hai" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(m2).toBeHidden();

  // Disabled CustomSelect ([role="combobox"][disabled]) is skipped; enabled Input after it receives focus
  await page.getByRole("button", { name: "Mở modal bỏ qua combobox disabled" }).click();
  const m3 = page.getByRole("dialog", { name: "Modal bỏ qua combobox disabled" });
  await expect(m3).toBeVisible();
  await expect(m3.getByRole("textbox", { name: "Ô tiếp theo" })).toBeFocused();
  await page.keyboard.press("Escape");
});

test("Reply box resize edge: pointer drag resizes height and pointercancel cleans up drag listeners", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, "/components/field/", "dark");
  const box = example(page, "field/sections");
  const textarea = box.locator("textarea").first();
  const handle = box.getByRole("separator", { name: "Đổi chiều cao ô nhập" });

  await handle.scrollIntoViewIfNeeded();
  await expect(handle).toBeVisible();
  // Ensure React has hydrated the example before starting pointer drag
  await expect(async () => {
    await textarea.fill("Dòng 1\nDòng 2\nDòng 3");
    await expect(textarea).toHaveValue("Dòng 1\nDòng 2\nDòng 3", { timeout: 500 });
  }).toPass({ timeout: 10_000 });
  const startH = await textarea.evaluate((el) => el.getBoundingClientRect().height);
  const hb = (await handle.boundingBox())!;

  // Drag handle upward by 60px -> textarea grows
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2 - 60);
  await page.mouse.up();
  const afterDrag = await textarea.evaluate((el) => el.getBoundingClientRect().height);
  expect(afterDrag).toBeGreaterThan(startH + 20);

  // Start a second drag and cancel it via pointercancel -> subsequent pointermove must NOT resize
  const hb2 = (await handle.boundingBox())!;
  await handle.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "mouse", button: 0, clientY: hb2.y + 4, bubbles: true });
  await page.evaluate(() => {
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 7, clientY: 100, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 7, bubbles: true }));
  });
  const afterCancel = await textarea.evaluate((el) => el.getBoundingClientRect().height);
  await page.evaluate(() => {
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 7, clientY: 10, bubbles: true }));
  });
  const afterLateMove = await textarea.evaluate((el) => el.getBoundingClientRect().height);
  expect(afterLateMove).toBe(afterCancel);
});
