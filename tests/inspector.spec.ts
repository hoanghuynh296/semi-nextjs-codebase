// The docs site's component inspector (#194): hover a piece of an example → its name, description and chain; a name
// opens that component's page; the example's own clicks still work; keyboard walk; the header toggle and the I key.
import { expect, test, type Page } from "@playwright/test";

/** Waits until React has adopted the page (the inspector's listeners and the example's handlers are attached). */
async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector("main");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  });
}

const card = (page: Page) => page.locator("[data-inspector-card]");

test("hover a Button in an example shows its name; clicking it opens /components/button/", async ({ page }) => {
  await page.goto("/components/button-group/");
  await hydrated(page);
  const button = page.locator('[data-example="button-group/basic"] [data-example-preview] button', { hasText: "Hôm nay" });
  await expect(button).toHaveAttribute("data-semi", "Button");
  await button.hover();
  await expect(card(page)).toBeVisible();
  // the name, its one-line description and the chain of marked ancestors
  await expect(card(page).locator("a").first()).toHaveText("Button");
  await expect(card(page).locator("p").first()).not.toBeEmpty();
  await expect(card(page)).toContainText("ButtonGroup");
  await expect(card(page).locator('[data-inspector-crumb="ButtonGroup"]')).toHaveAttribute("href", /\/components\/button-group\/$/);
  // the outline and the card never take the example's pointer events, except the card itself
  expect(await card(page).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("auto");
  await card(page).locator("a").first().click();
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await expect(card(page)).toHaveCount(0);
});

test("the example's own click still works with the inspector on", async ({ page }) => {
  await page.goto("/components/checkbox/");
  await hydrated(page);
  const box = page.locator('[data-example="checkbox/basic"] [data-example-preview] [role="checkbox"], [data-example="checkbox/basic"] [data-example-preview] input[type="checkbox"]').first();
  const before = await box.isChecked();
  await box.hover();
  await expect(card(page)).toBeVisible();
  await box.click();
  // pressing hides the card; the checkbox toggled
  await expect(card(page)).toHaveCount(0);
  await expect(box).toBeChecked({ checked: !before });
});

test("keyboard: Alt+↓ shows the focused piece, Alt+↑ walks up the chain, Enter opens its page", async ({ page }) => {
  await page.goto("/components/button-group/");
  await hydrated(page);
  const button = page.locator('[data-example="button-group/basic"] [data-example-preview] button', { hasText: "Hôm nay" });
  await button.focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(card(page)).toBeVisible();
  await expect(card(page).locator("a").first()).toHaveText("Button");
  // the card is decorative; screen readers get the same through the live region
  await expect(card(page)).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("[data-semi-inspector] [role=status]")).toContainText("Button");
  await page.keyboard.press("Alt+ArrowUp");
  await expect(card(page).locator("a").first()).toHaveText("ButtonGroup");
  // Enter belongs to the inspector while its card shows: it opens the page instead of pressing the button
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/components\/button-group\/$/);
  await expect(card(page)).toHaveCount(0);
  // Escape closes it and focus stays
  await button.focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(card(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(card(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test("typing and scrolling hide the card", async ({ page }) => {
  await page.goto("/components/button-group/");
  await hydrated(page);
  const button = page.locator('[data-example="button-group/basic"] [data-example-preview] button', { hasText: "Hôm nay" });
  await button.hover();
  await expect(card(page)).toBeVisible();
  await page.keyboard.press("a");
  await expect(card(page)).toHaveCount(0);
  await page.mouse.move(0, 0);
  await button.hover();
  await expect(card(page)).toBeVisible();
  await page.mouse.wheel(0, 200);
  await expect(card(page)).toHaveCount(0);
});

test("the header toggle and the I key turn it off, and the choice is remembered", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/components/button-group/");
  await hydrated(page);
  const toggle = page.getByRole("switch", { name: "Soi component" });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.locator("body").press("i");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  const button = page.locator('[data-example="button-group/basic"] [data-example-preview] button', { hasText: "Hôm nay" });
  await button.hover();
  await page.waitForTimeout(600);
  await expect(card(page)).toHaveCount(0);
  await page.reload();
  await hydrated(page);
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  // the switch turns it back on (pointer and keyboard)
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.mouse.move(0, 0);
  await button.hover();
  await expect(card(page)).toBeVisible();
});

test("a /demo/* page is inspected everywhere", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/demo/app-shell/");
  await hydrated(page);
  const header = page.locator('[data-semi="RouteHeader"]').first();
  await header.hover({ position: { x: 4, y: 4 } });
  await expect(card(page)).toBeVisible();
  await expect(card(page)).toContainText("AppShell");
});
