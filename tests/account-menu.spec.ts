// AccountMenu without Semi's ThemeProvider (ds#215), in the server-rendered app (tests/prerender-app/app/account-menu):
// an app that owns its theme passes theme: false and its own radios in items; theme left on without a provider shows
// no choices instead of throwing. Both by keyboard.
import { expect, test, type Page } from "@playwright/test";
import { PRERENDER_PORT } from "../playwright.config";

const BASE = `http://127.0.0.1:${PRERENDER_PORT}`;

async function open(page: Page, id: string) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // a React error (the old useTheme throw) shows as a page error or a console error; a 404 (favicon) is not one
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  await page.goto(`${BASE}/account-menu/${id}`);
  return errors;
}

test("AccountMenu theme: false (ds#215): no ThemeProvider needed, server HTML has the avatar, the app's own radios work by keyboard", async ({ page, request }) => {
  const html = await (await request.get(`${BASE}/account-menu/own`)).text();
  expect(html).toContain("Tài khoản: An Nguyễn");
  expect(html).not.toContain("useTheme must be used");

  const errors = await open(page, "own");
  const avatar = page.getByRole("button", { name: "Tài khoản: An Nguyễn" });
  await expect(avatar).toBeVisible();
  await avatar.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const radios = menu.getByRole("menuitemradio");
  await expect(radios).toHaveText(["Sáng (app)", "Tối (app)", "Hệ thống (app)"]);
  // the menu opens on the checked choice; ArrowUp + Enter picks "Tối (app)" through the app's own state
  await expect(menu.getByRole("menuitemradio", { name: "Hệ thống (app)" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(menu.getByRole("menuitemradio", { name: "Tối (app)" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-app-mode]")).toHaveAttribute("data-app-mode", "dark");
  await expect(avatar).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu.getByRole("menuitemradio", { name: "Tối (app)" })).toHaveAttribute("aria-checked", "true");
  await expect(menu.getByRole("menuitem", { name: "Đăng xuất" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  expect(errors).toEqual([]);
});

test("AccountMenu theme on without a ThemeProvider (ds#215): no crash, no theme choices, the rest of the menu by keyboard", async ({ page }) => {
  const errors = await open(page, "missing");
  await expect(page.getByText("Chế độ của app: system")).toBeVisible();
  const avatar = page.getByRole("button", { name: "Tài khoản: Bình Lê" });
  await avatar.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitemradio")).toHaveCount(0);
  await expect(menu.getByRole("menuitem", { name: "Đăng xuất" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  expect(errors).toEqual([]);
});
