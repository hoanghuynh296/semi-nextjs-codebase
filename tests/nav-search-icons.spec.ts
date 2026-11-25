// #172: AppShell collapsible nav groups, mainAction external primary link, Storybook nav quick search,
// and the /foundations/ + /icons/ split.
import { expect, test, type Page } from "@playwright/test";
import { a11yHits } from "./contrast";

async function open(page: Page, path: string, theme: "dark" | "light" = "light") {
  await page.addInitScript(([t]) => {
    localStorage.setItem("semi-theme", t);
  }, [theme] as const);
  await page.goto(path);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
}

test("collapsible nav groups: default collapsed on /, click and keyboard toggle, active group auto-opens (#172)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/", "light");

  const aside = page.locator("aside[data-semi-nav-panel]");
  // Bắt đầu stays open
  await expect(aside.getByRole("link", { name: "Foundations", exact: true })).toBeVisible();
  await expect(aside.getByRole("link", { name: "Icons", exact: true })).toBeVisible();

  // Component groups start collapsed
  const actionsBtn = aside.getByRole("button", { name: "Actions", exact: true });
  const formsBtn = aside.getByRole("button", { name: "Forms", exact: true });
  await expect(actionsBtn).toHaveAttribute("aria-expanded", "false");
  await expect(formsBtn).toHaveAttribute("aria-expanded", "false");
  await expect(aside.getByRole("link", { name: "Button", exact: true })).toBeHidden();

  // Click toggles Actions open and closed
  await actionsBtn.click();
  await expect(actionsBtn).toHaveAttribute("aria-expanded", "true");
  await expect(aside.getByRole("link", { name: "Button", exact: true })).toBeVisible();
  await actionsBtn.click();
  await expect(actionsBtn).toHaveAttribute("aria-expanded", "false");
  await expect(aside.getByRole("link", { name: "Button", exact: true })).toBeHidden();

  // Keyboard toggle on Forms
  await formsBtn.focus();
  await page.keyboard.press("Enter");
  await expect(formsBtn).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Space");
  await expect(formsBtn).toHaveAttribute("aria-expanded", "false");

  // Active group auto-opens when visiting a component doc
  await open(page, "/components/button/", "light");
  const activeActions = aside.getByRole("button", { name: "Actions", exact: true });
  const inactiveForms = aside.getByRole("button", { name: "Forms", exact: true });
  await expect(activeActions).toHaveAttribute("aria-expanded", "true");
  await expect(inactiveForms).toHaveAttribute("aria-expanded", "false");
  const buttonLink = aside.getByRole("link", { name: "Button", exact: true });
  await expect(buttonLink).toBeVisible();
  await expect(buttonLink).toHaveAttribute("aria-current", "page");
});

test("mainAction renders GitHub Repository as a brand primary external link (#172)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/", "light");

  const aside = page.locator("aside[data-semi-nav-panel]");
  const ghLink = aside.getByRole("link", { name: "GitHub Repository" });
  await expect(ghLink).toBeVisible();
  await expect(ghLink).toHaveAttribute("href", "https://github.com/hoanghuynh296/semi-nextjs-codebase");
  await expect(ghLink).toHaveAttribute("target", "_blank");
  await expect(ghLink).toHaveAttribute("rel", /noopener/);
  await expect(ghLink).toHaveClass(/bg-primary/);
});

test("phone drawer supports collapsible nav groups and external mainAction (#172)", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await open(page, "/", "light");

  await page.getByRole("button", { name: /Mở menu/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const ghLink = dialog.getByRole("link", { name: "GitHub Repository" });
  await expect(ghLink).toHaveAttribute("target", "_blank");
  await expect(ghLink).toHaveAttribute("rel", /noopener/);

  const actionsBtn = dialog.getByRole("button", { name: "Actions", exact: true });
  await expect(actionsBtn).toHaveAttribute("aria-expanded", "false");
  await expect(actionsBtn).not.toHaveAttribute("aria-controls");
  await actionsBtn.click();
  await expect(actionsBtn).toHaveAttribute("aria-expanded", "true");
  await expect(actionsBtn).toHaveAttribute("aria-controls", /.+-sec-\d+$/);
  await expect(dialog.getByRole("link", { name: "Button", exact: true })).toBeVisible();
});

test("header quick search is centered in RouteHeader at 1440px and hidden without overflow at phone widths (#179)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/", "light");

  const header = page.locator("header").first();
  const aside = page.locator("aside[data-semi-nav-panel]");
  const combobox = header.getByRole("combobox", { name: "Tìm nhanh tài liệu" });
  await expect(combobox).toBeVisible();
  await expect(aside.getByRole("combobox", { name: "Tìm nhanh tài liệu" })).toHaveCount(0);

  // Centered horizontally inside RouteHeader (within 40px of header midpoint)
  const [headerBox, comboBox] = await Promise.all([header.boundingBox(), combobox.boundingBox()]);
  expect(headerBox).toBeTruthy();
  expect(comboBox).toBeTruthy();
  const headerCenter = headerBox!.x + headerBox!.width / 2;
  const comboCenter = comboBox!.x + comboBox!.width / 2;
  expect(Math.abs(headerCenter - comboCenter)).toBeLessThan(40);

  // No horizontal overflow at 1440px, 430px, and 375px on / and /icons/
  for (const width of [1440, 430, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/icons/"]) {
      await open(page, path, "light");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow on ${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
    if (width < 768) {
      await expect(header.getByRole("combobox", { name: "Tìm nhanh tài liệu" })).toBeHidden();
    }
  }

  // At md (768px): middle combobox and right actions do not overlap
  await page.setViewportSize({ width: 768, height: 900 });
  await open(page, "/", "light");
  const mdCombo = await header.getByRole("combobox", { name: "Tìm nhanh tài liệu" }).boundingBox();
  const mdThemeBtn = await header.getByRole("button", { name: "Giao diện", exact: true }).boundingBox();
  expect(mdCombo).toBeTruthy();
  expect(mdThemeBtn).toBeTruthy();
  expect(mdCombo!.x + mdCombo!.width).toBeLessThanOrEqual(mdThemeBtn!.x + 1);

  // Outside click closes the portaled listbox, and resizing below md dismisses it cleanly
  const listbox = page.getByRole("listbox", { name: "Kết quả tìm kiếm" });
  const mdCombobox = header.getByRole("combobox", { name: "Tìm nhanh tài liệu" });
  await mdCombobox.fill("button");
  await expect(listbox).toBeVisible();
  await page.locator("main").click({ position: { x: 24, y: 24 } });
  await expect(listbox).toBeHidden();

  await mdCombobox.focus();
  await expect(listbox).toBeVisible();
  await page.setViewportSize({ width: 430, height: 900 });
  await expect(listbox).toBeHidden();
});

test("nav quick search guards IME composition and supports ArrowDown/ArrowUp selection (#172, #179)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/", "light");

  const header = page.locator("header").first();
  const combobox = header.getByRole("combobox", { name: "Tìm nhanh tài liệu" });
  const listbox = page.getByRole("listbox", { name: "Kết quả tìm kiếm" });

  await combobox.fill("button");
  await expect(listbox).toBeVisible();

  // Vietnamese IME composition: Enter / Escape with isComposing or keyCode 229 must not navigate or close
  await combobox.evaluate((el) => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true, cancelable: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Process", keyCode: 229, bubbles: true, cancelable: true }));
  });
  await expect(listbox).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  // ArrowDown / ArrowUp moves aria-selected across options and Enter navigates to the active option
  const options = listbox.getByRole("option");
  expect(await options.count()).toBeGreaterThan(1);
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
  await combobox.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  const secondHref = await options.nth(1).getAttribute("href");
  expect(secondHref).toBeTruthy();
  await combobox.press("ArrowUp");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
  await combobox.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await combobox.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${secondHref!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
});

test("nav quick search finds components, pages, and icons with keyboard navigation (#172, #179)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/", "light");

  const header = page.locator("header").first();
  const combobox = header.getByRole("combobox", { name: "Tìm nhanh tài liệu" });
  await expect(combobox).toBeVisible();

  // Search a component and navigate with Enter
  await combobox.fill("modal");
  const listbox = page.getByRole("listbox", { name: "Kết quả tìm kiếm" });
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole("option", { name: /Modal/ }).first()).toBeVisible();
  await combobox.press("Enter");
  await expect(page).toHaveURL(/\/components\/modal\/$/);

  // Escape closes dropdown
  await combobox.fill("button");
  await expect(listbox).toBeVisible();
  await combobox.press("Escape");
  await expect(listbox).toBeHidden();

  // Search a top-level page and click
  await combobox.fill("foundations");
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: /Foundations/ }).first().click();
  await expect(page).toHaveURL(/\/foundations\/$/);

  // Search an icon and jump to /icons/?q=<name>
  await combobox.fill("trash");
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: /trash/i }).first().click();
  await expect(page).toHaveURL(/\/icons\/\?q=trash/);
  await expect(page.getByRole("searchbox", { name: "Tìm icon" })).toHaveValue("trash");
});

test("/icons/ uses StickyContextBar + SearchPill with / shortcut, clear button, and ?q= prefill (#179)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/icons/?q=sparkles", "light");

  const bar = page.locator("[data-sticky-bar]");
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute("role", "search");
  await expect(bar).toHaveAttribute("aria-label", "Tìm và lọc icon");

  const searchbox = bar.getByRole("searchbox", { name: "Tìm icon" });
  await expect(searchbox).toHaveValue("sparkles");

  // Clear button clears the search pill
  await bar.getByRole("button", { name: /Xoá tìm kiếm|Clear search/i }).click();
  await expect(searchbox).toHaveValue("");

  // Blur and press "/" shortcut to focus SearchPill
  await searchbox.blur();
  await page.keyboard.press("/");
  await expect(searchbox).toBeFocused();
});

test("/foundations/ and /icons/ split cleanly and pass a11y in both themes (#172, #179)", async ({ page }) => {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });

    for (const theme of ["light", "dark"] as const) {
      if (width === 1440) {
        await open(page, "/foundations/", theme);
        await expect(page.getByRole("heading", { name: "Foundations", level: 1 })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Bề mặt và chữ" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Thang chữ" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Tra cứu icon" })).toHaveCount(0);
        expect(await a11yHits(page)).toEqual([]);
      }

      await open(page, "/icons/?q=sparkles", theme);
      await expect(page.getByRole("heading", { name: "Icons", level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Tra cứu icon" })).toBeVisible();
      await expect(page.getByRole("searchbox", { name: "Tìm icon" })).toHaveValue("sparkles");
      expect(await a11yHits(page)).toEqual([]);
    }
  }
});
