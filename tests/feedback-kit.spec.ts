// Feedback kit (#75): one toast API (toast.undo, toast.promise, shown once), confirmDelete (names the object, red
// button, Huỷ), on desktop and on a phone. The static HTML shows before React hydrates (slow on CI), so every test
// waits for hydration before it clicks (React puts its fiber key on a node it has adopted).
import { expect, test, type Page } from "@playwright/test";

const STACK = (page: Page) => page.getByRole("region", { name: "Thông báo nổi" }); // the docs layout names it (ToastHost label)
const ex = (page: Page, id: string) => page.locator(`[data-example="${id}"]`);

async function open(page: Page, doc: string, id: string) {
  await page.goto(`/components/${doc}/`);
  const root = ex(page, id);
  await expect(root).toBeVisible();
  await page.waitForFunction((sel) => {
    const el = document.querySelector(`${sel} button`);
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  }, `[data-example="${id}"]`);
  return root;
}

test("toast.undo: the row goes at once, the toast offers Hoàn tác, undo puts it back where it was and closes the toast", async ({ page }) => {
  const root = await open(page, "toast", "toast/undo");
  const rows = root.locator("[data-undo-list] li");
  await expect(rows).toHaveCount(3);
  await rows.nth(1).getByRole("button", { name: "Lưu trữ" }).click();
  await expect(rows).toHaveCount(2);
  const undo = STACK(page).getByRole("button", { name: "Hoàn tác" });
  await expect(STACK(page).getByText('Đã lưu trữ "Bản in mẫu B"')).toBeVisible();
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("Bản in mẫu B");
  await expect(STACK(page).getByText('Đã lưu trữ "Bản in mẫu B"')).toHaveCount(0);
});

test("toast.undo waits longer than a plain toast (8 s) and stays while focused", async ({ page }) => {
  const root = await open(page, "toast", "toast/undo");
  await root.locator("[data-undo-list] li").first().getByRole("button", { name: "Lưu trữ" }).click();
  const undo = STACK(page).getByRole("button", { name: "Hoàn tác" });
  await expect(undo).toBeVisible();
  await page.waitForTimeout(4600); // a plain success toast (4 s) would be gone
  await expect(undo).toBeVisible();
  await undo.focus();
  await page.waitForTimeout(4000); // past 8 s in total, but focus pauses the timer
  await expect(undo).toBeVisible();
});

test("success is shown once: the same toast again replaces the first, never a stack", async ({ page }) => {
  const root = await open(page, "toast", "toast/tones");
  const b = root.getByRole("button", { name: "Thành công + hoàn tác" });
  await b.click();
  await b.click();
  await b.click();
  await expect(STACK(page).getByText("Đã lưu thay đổi")).toHaveCount(1);
});

test("toast.promise: a spinner toast turns into the result in place; a failure is assertive and keeps the reason", async ({ page }) => {
  const root = await open(page, "toast", "toast/promise");
  await root.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(STACK(page).getByText("Đang lưu…")).toBeVisible();
  await expect(STACK(page).locator("svg.animate-spin")).toHaveCount(1);
  await expect(STACK(page).getByText("Đã lưu 12 dòng")).toBeVisible({ timeout: 6000 });
  await expect(STACK(page).getByText("Đang lưu…")).toHaveCount(0);
  await expect(STACK(page).locator("svg.animate-spin")).toHaveCount(0);
  await expect(STACK(page).locator('[aria-live="polite"]')).toContainText("Đã lưu 12 dòng");

  await root.getByRole("button", { name: "Lưu (lỗi)" }).click();
  await expect(STACK(page).locator('[aria-live="assertive"]')).toContainText("Không lưu được: offline", { timeout: 6000 });
  await expect(STACK(page).getByText("Đang lưu…")).toHaveCount(0);
  expect(await STACK(page).locator("[aria-live] [aria-live], [aria-live] [role=alert], [aria-live] [role=status]").count()).toBe(0);
});

test("confirmDelete: the title names the object, the button is red and says Xoá, Huỷ backs out; success is one toast, not a dialog", async ({ page }) => {
  const root = await open(page, "confirm-dialog", "confirm-dialog/delete");
  await root.getByRole("button", { name: "Xoá máy in" }).click();
  const dialog = page.getByRole("alertdialog", { name: 'Xoá "Máy in xưởng 3"?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Lịch sử in của máy cũng bị xoá.");
  const del = dialog.getByRole("button", { name: "Xoá", exact: true });
  const cancel = dialog.getByRole("button", { name: "Huỷ", exact: true });
  const bg = (l: typeof del) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg(del)).not.toBe(await bg(cancel)); // the destructive button is filled red, Huỷ is not
  expect(await del.evaluate((el) => el.className)).toMatch(/danger/);
  await cancel.click();
  await expect(dialog).toHaveCount(0);
  await expect(STACK(page).getByText("Đã xoá máy in")).toHaveCount(0); // backing out says nothing

  await root.getByRole("button", { name: "Xoá máy in" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xoá", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(STACK(page).getByText("Đã xoá máy in")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveCount(0); // success is never a modal
});

test("on a phone: the undo toast and the delete dialog fit the width", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const root = await open(page, "toast", "toast/undo");
  await root.locator("[data-undo-list] li").first().getByRole("button", { name: "Lưu trữ" }).click();
  const undo = STACK(page).getByRole("button", { name: "Hoàn tác" });
  await expect(undo).toBeVisible();
  const card = (await STACK(page).locator("[aria-live='polite'] > div").first().boundingBox())!;
  expect(card.x).toBeGreaterThanOrEqual(0);
  expect(card.x + card.width).toBeLessThanOrEqual(375);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.close();
});
