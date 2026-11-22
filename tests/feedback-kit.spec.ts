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
  const rows = root.locator("[data-undo-list] li").filter({ hasText: "Bản in mẫu" });
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

test("success is shown once: the same plain toast again replaces the first; toasts with undo or an action are never merged", async ({ page }) => {
  const root = await open(page, "toast", "toast/tones");
  const warn = root.getByRole("button", { name: "Cảnh báo" });
  await warn.click();
  await warn.click();
  await warn.click();
  await expect(STACK(page).getByText("Mất kết nối máy in")).toHaveCount(1);
  const withAction = root.getByRole("button", { name: "Thành công + hoàn tác" });
  await withAction.click();
  await withAction.click();
  await expect(STACK(page).getByText("Đã lưu thay đổi")).toHaveCount(2); // each carries its own callback
});

test("two undo toasts stay separate and each restores its own row", async ({ page }) => {
  const root = await open(page, "toast", "toast/undo");
  const rows = root.locator("[data-undo-list] li").filter({ hasText: "Bản in mẫu" });
  await rows.nth(0).getByRole("button", { name: "Lưu trữ" }).click(); // A
  await rows.nth(0).getByRole("button", { name: "Lưu trữ" }).click(); // B (A is gone, B is first now)
  await expect(STACK(page).getByRole("button", { name: "Hoàn tác" })).toHaveCount(2);
  await expect(rows).toHaveCount(1);
  await STACK(page).locator("div", { hasText: 'Đã lưu trữ "Bản in mẫu B"' }).getByRole("button", { name: "Hoàn tác" }).last().click();
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("Bản in mẫu B");
  await expect(STACK(page).getByRole("button", { name: "Hoàn tác" })).toHaveCount(1);
  await expect(STACK(page).getByText('Đã lưu trữ "Bản in mẫu A"')).toBeVisible();
  await STACK(page).getByRole("button", { name: "Hoàn tác" }).click();
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText("Bản in mẫu A");
});

test("onCommit runs when the undo window closes without an undo, not after an undo", async ({ page }) => {
  const root = await open(page, "toast", "toast/undo");
  const committed = root.locator("[data-committed]");
  await expect(committed).toContainText("Đã chốt: 0");
  const rows = root.locator("[data-undo-list] li").filter({ hasText: "Bản in mẫu" });
  await rows.nth(0).getByRole("button", { name: "Lưu trữ" }).click();
  await STACK(page).getByRole("button", { name: "Hoàn tác" }).click(); // undone: nothing to commit
  await expect(committed).toContainText("Đã chốt: 0");
  await rows.nth(0).getByRole("button", { name: "Lưu trữ" }).click();
  await STACK(page).getByRole("button", { name: "Bỏ qua" }).click(); // dismissed: committed
  await expect(committed).toContainText("Đã chốt: 1");
});

test("a route change closes the undo window", async ({ page }) => {
  const root = await open(page, "toast", "toast/undo");
  await root.locator("[data-undo-list] li").first().getByRole("button", { name: "Lưu trữ" }).click();
  await expect(STACK(page).getByRole("button", { name: "Hoàn tác" })).toBeVisible();
  await page.getByRole("link", { name: "Confirm dialog" }).first().click();
  await expect(page).toHaveURL(/confirm-dialog/);
  await expect(STACK(page).getByRole("button", { name: "Hoàn tác" })).toHaveCount(0);
});

test("Alt+T moves keyboard focus to the newest toast's action", async ({ page }) => {
  const root = await open(page, "toast", "toast/undo");
  await root.locator("[data-undo-list] li").first().getByRole("button", { name: "Lưu trữ" }).click();
  const undo = STACK(page).getByRole("button", { name: "Hoàn tác" });
  await expect(undo).toBeVisible();
  await page.keyboard.press("Alt+T");
  await expect(undo).toBeFocused();
});

test("updateToast keeps the id: a second update lands in the same toast and the close button still dismisses it", async ({ page }) => {
  const root = await open(page, "toast", "toast/promise");
  await root.getByRole("button", { name: "Tiến độ" }).click();
  await expect(STACK(page).getByText("Đã gửi 3/3")).toBeVisible({ timeout: 4000 });
  await expect(STACK(page).getByText(/Đang gửi/)).toHaveCount(0); // updated in place, no leftovers
  await STACK(page).getByRole("button", { name: "Bỏ qua" }).click();
  await expect(STACK(page).getByText("Đã gửi 3/3")).toHaveCount(0);
});

test("toast.promise timeout: a promise that never settles ends with the error text and closes", async ({ page }) => {
  const root = await open(page, "toast", "toast/promise");
  await root.getByRole("button", { name: "Kết nối (treo)" }).click();
  await expect(STACK(page).getByText("Đang kết nối…")).toBeVisible();
  await expect(STACK(page).locator('[aria-live="assertive"]')).toContainText("Quá thời gian chờ", { timeout: 4000 });
  await expect(STACK(page).locator("svg.animate-spin")).toHaveCount(0);
});

test("confirmDelete and the undo button take their texts from the provider's locale (en); durationScale shortens the timers", async ({ page }) => {
  await page.goto("/feedback-locale/");
  await page.waitForFunction(() => {
    const el = document.querySelector("main button, button");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  });
  await page.getByRole("button", { name: "Delete server" }).click();
  const dialog = page.getByRole("alertdialog", { name: 'Delete "Server 1"?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("This cannot be undone.");
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused(); // danger: the safe button has focus
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Quick note" }).click();
  const note = page.locator("[aria-live]").getByText("Quick note");
  await expect(note.first()).toBeVisible();
  await expect(note).toHaveCount(0, { timeout: 2000 }); // 4 s x 0.1 (the default would take 4 s)
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
  await expect(dialog.getByRole("button", { name: "Huỷ", exact: true })).toBeFocused(); // danger: focus starts on the safe button
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
