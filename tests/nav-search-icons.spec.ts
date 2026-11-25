// #172, #179, #181: AppShell collapsible nav groups, mainAction external primary link,
// pinned bottom nav CommandDialog search (desktop, rail, phone drawer), and /foundations/ + /icons/.
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

test("phone drawer supports collapsible nav groups, external mainAction, and bottom CommandDialog trigger (#172, #181)", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await open(page, "/", "light");

  await page.getByRole("button", { name: /Mở menu/i }).click();
  const drawer = page.getByRole("dialog", { name: "Semi Design" });
  await expect(drawer).toBeVisible();

  const ghLink = drawer.getByRole("link", { name: "GitHub Repository" });
  await expect(ghLink).toHaveAttribute("target", "_blank");
  await expect(ghLink).toHaveAttribute("rel", /noopener/);

  const actionsBtn = drawer.getByRole("button", { name: "Actions", exact: true });
  await expect(actionsBtn).toHaveAttribute("aria-expanded", "false");
  await expect(actionsBtn).not.toHaveAttribute("aria-controls");
  await actionsBtn.click();
  await expect(actionsBtn).toHaveAttribute("aria-expanded", "true");
  await expect(actionsBtn).toHaveAttribute("aria-controls", /.+-sec-\d+$/);
  await expect(drawer.getByRole("link", { name: "Button", exact: true })).toBeVisible();

  // Pinned bottom search trigger in PhoneDrawer closes the drawer and opens CommandDialog
  const trigger = drawer.locator("[data-semi-nav-footer]").getByRole("button", { name: "Tìm nhanh" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(drawer).toBeHidden();

  const cmdDialog = page.getByRole("dialog", { name: "Bảng lệnh" });
  await expect(cmdDialog).toBeVisible();
  const input = cmdDialog.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("modal");
  await cmdDialog.getByRole("option", { name: /Modal/ }).first().click();
  await expect(cmdDialog).toBeHidden();
  await expect(page).toHaveURL(/\/components\/modal\/$/);
});

test("RouteHeader has no global search; pinned bottom nav trigger stays sticky and adapts to rail (#181)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await open(page, "/", "light");

  const header = page.locator("header").first();
  const aside = page.locator("aside[data-semi-nav-panel]");

  // No global search input in RouteHeader
  await expect(header.getByRole("combobox")).toHaveCount(0);
  await expect(header.getByRole("searchbox")).toHaveCount(0);

  // Sticky bottom nav trigger is visible inside navFooter at the bottom of aside
  const footer = aside.locator("[data-semi-nav-footer]");
  const trigger = footer.getByRole("button", { name: "Tìm nhanh" });
  await expect(trigger).toBeVisible();
  const beforeBox = await trigger.boundingBox();
  const asideBox = await aside.boundingBox();
  expect(beforeBox).toBeTruthy();
  expect(asideBox).toBeTruthy();
  expect(beforeBox!.y + beforeBox!.height).toBeLessThanOrEqual(asideBox!.y + asideBox!.height + 1);
  expect(beforeBox!.y).toBeGreaterThan(asideBox!.y + asideBox!.height - 80);

  // Expand multiple component groups so the nav scrolls, then scroll to bottom and confirm trigger stays pinned
  for (const group of ["Actions", "Forms", "Overlays", "Data display"]) {
    await aside.getByRole("button", { name: group, exact: true }).click();
  }
  const scrollArea = aside.locator(".overflow-y-auto").first();
  const scrolled = await scrollArea.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    return el.scrollTop;
  });
  expect(scrolled).toBeGreaterThan(0);
  const afterBox = await trigger.boundingBox();
  expect(afterBox).toBeTruthy();
  expect(Math.abs(afterBox!.y - beforeBox!.y)).toBeLessThanOrEqual(1);

  // Collapse to 72px rail: trigger collapses to a 32x32 icon button and still opens CommandDialog
  await aside.getByRole("button", { name: /Thu gọn menu/i }).click();
  const railBox = await trigger.boundingBox();
  expect(railBox).toBeTruthy();
  expect(railBox!.width).toBeLessThanOrEqual(36);
  await trigger.click();
  const cmdDialog = page.getByRole("dialog", { name: "Bảng lệnh" });
  await expect(cmdDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cmdDialog).toBeHidden();

  // No horizontal overflow at 1440px, 768px, 430px, and 375px on / and /icons/
  for (const width of [1440, 768, 430, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/icons/"]) {
      await open(page, path, "light");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow on ${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("CommandDialog opens via click or ⌘K/Ctrl+K, guards IME, supports keyboard navigation, and navigates to pages, components, and icons (#181)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/", "light");

  const aside = page.locator("aside[data-semi-nav-panel]");
  const trigger = aside.locator("[data-semi-nav-footer]").getByRole("button", { name: "Tìm nhanh" });
  const cmdDialog = page.getByRole("dialog", { name: "Bảng lệnh" });

  // Open via ⌘K / Ctrl+K shortcut
  await expect(trigger).toBeVisible();
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdDialog).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });

  const input = cmdDialog.getByRole("combobox");
  await expect(input).toBeFocused();

  // Groups are present: Trang, Component, Icons
  await expect(cmdDialog.getByRole("group", { name: "Trang" })).toBeVisible();
  await expect(cmdDialog.getByRole("group", { name: "Component" })).toBeVisible();
  await expect(cmdDialog.getByRole("group", { name: "Icons" })).toBeVisible();

  // Search a component and guard Vietnamese IME composition
  await input.fill("button");
  const options = cmdDialog.getByRole("option");
  expect(await options.count()).toBeGreaterThan(1);
  await input.evaluate((el) => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true, cancelable: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Process", keyCode: 229, bubbles: true, cancelable: true }));
  });
  await expect(cmdDialog).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  // ArrowDown / ArrowUp moves aria-selected across options
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
  await input.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await input.press("ArrowUp");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");

  // Escape clears query first, second Escape closes dialog
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(cmdDialog).toBeVisible();
  await input.press("Escape");
  await expect(cmdDialog).toBeHidden();

  // Open via trigger click, search a component and press Enter
  await trigger.click();
  await expect(cmdDialog).toBeVisible();
  await input.fill("modal");
  await expect(cmdDialog.getByRole("option", { name: /Modal/ }).first()).toBeVisible();
  await input.press("Enter");
  await expect(cmdDialog).toBeHidden();
  await expect(page).toHaveURL(/\/components\/modal\/$/);

  // Open via ⌘K, search a page and click
  await page.keyboard.press("ControlOrMeta+k");
  await expect(cmdDialog).toBeVisible();
  await input.fill("foundations");
  await cmdDialog.getByRole("option", { name: /Foundations/ }).first().click();
  await expect(cmdDialog).toBeHidden();
  await expect(page).toHaveURL(/\/foundations\/$/);

  // Open via trigger click, search an icon and jump to /icons/?q=<name>
  await trigger.click();
  await expect(cmdDialog).toBeVisible();
  await input.fill("trash");
  await cmdDialog.getByRole("option", { name: /trash/i }).first().click();
  await expect(cmdDialog).toBeHidden();
  await expect(page).toHaveURL(/\/icons\/\?q=trash/);
  await expect(page.getByRole("searchbox", { name: "Tìm icon" })).toHaveValue("trash");

  // On /components/command/, ⌘K yields to the page's CommandPalette demo and the nav trigger hides ⌘K
  await open(page, "/components/command/", "light");
  const cmdPageTrigger = aside.locator("[data-semi-nav-footer]").getByRole("button", { name: "Tìm nhanh" });
  await expect(cmdPageTrigger).toBeVisible();
  await expect(cmdPageTrigger.locator("kbd")).toHaveCount(0);
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog", { name: "Tìm hoặc tạo" })).toBeVisible();
  await expect(cmdDialog).toBeHidden();
  await page.keyboard.press("Escape");
  await cmdPageTrigger.click();
  await expect(cmdDialog).toBeVisible();
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

test("/foundations/ and /icons/ split cleanly and pass a11y in both themes (#172, #179, #181)", async ({ page }) => {
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
