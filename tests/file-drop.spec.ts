// FileDrop behaviour in the docs build (examples/file-drop): accept, maxSize, multiple, folders, duplicates, retry,
// the live region, and a drop on a disabled drop area.
import { expect, test, type Locator, type Page } from "@playwright/test";

const basic = (page: Page) => page.locator('[data-example="file-drop/basic"]');
const states = (page: Page) => page.locator('[data-example="file-drop/states"]');

async function open(page: Page) {
  await page.goto("/components/file-drop/");
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
}

const csv = (name: string, size = 10) => ({ name, mimeType: "text/csv", buffer: Buffer.alloc(size, "a") });

/** Dispatch a drop of `files` (name, size) on `target`; names in `folders` report as directories. */
async function drop(target: Locator, files: Array<{ name: string; size: number }>, folders: string[] = [], stringFirst = false) {
  return target.evaluate(
    (el, { files, folders, stringFirst }) => {
      const dt = new DataTransfer();
      if (stringFirst) dt.items.add("a dragged link", "text/plain");
      for (const f of files) dt.items.add(new File([new Uint8Array(f.size)], f.name, { type: f.name.endsWith(".pdf") ? "application/pdf" : "" }));
      DataTransferItem.prototype.webkitGetAsEntry = function (this: DataTransferItem) {
        const name = this.kind === "file" ? (this.getAsFile()?.name ?? "") : "";
        return { isDirectory: folders.includes(name) } as FileSystemEntry;
      };
      const ev = new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true });
      el.dispatchEvent(ev);
      return ev.defaultPrevented;
    },
    { files, folders, stringFirst },
  );
}

test("accept and maxSize: rejects go to onReject, accepted files get a row", async ({ page }) => {
  await open(page);
  const ex = basic(page);
  const input = ex.locator('input[type="file"]');
  await input.setInputFiles(csv("ok.csv"));
  await expect(ex.getByText("ok.csv", { exact: true })).toBeVisible();
  await expect(ex.locator('[role="status"]')).toHaveText("Đã thêm 1 tệp");
  await input.setInputFiles({ name: "note.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
  await expect(ex.getByRole("alert")).toContainText("note.txt: sai định dạng");
  await expect(ex.locator('[role="status"]')).toHaveText("1 tệp bị từ chối");
  await input.setInputFiles(csv("huge.csv", 10_000_001));
  await expect(ex.getByRole("alert")).toContainText("huge.csv: quá 10 MB");
  await expect(ex.getByRole("list").getByText("huge.csv")).toHaveCount(0);
});

test("duplicates (against items and inside one batch) are rejected", async ({ page }) => {
  await open(page);
  const ex = basic(page);
  const input = ex.locator('input[type="file"]');
  await input.setInputFiles({ name: "bang-gia-2026.xlsx", mimeType: "application/octet-stream", buffer: Buffer.alloc(48_200) });
  await expect(ex.getByRole("alert")).toContainText("bang-gia-2026.xlsx: đã có");
  await input.setInputFiles([csv("d.csv"), csv("d.csv")]);
  await expect(ex.getByRole("list").getByText("d.csv", { exact: true })).toHaveCount(1);
  await expect(ex.getByRole("alert")).toContainText("d.csv: đã có");
});

test("a dropped folder is rejected, a dropped file is added, and the drop is cancelled", async ({ page }) => {
  await open(page);
  const ex = basic(page);
  expect(await drop(ex.getByRole("button", { name: "Tệp nhập" }), [{ name: "dir", size: 0 }, { name: "x.csv", size: 5 }], ["dir"])).toBe(true);
  await expect(ex.getByRole("alert")).toContainText("dir: là thư mục");
  await expect(ex.getByRole("list").getByText("x.csv", { exact: true })).toHaveCount(1);
});

test("multiple off: the first valid file is added, the rest are rejected and announced", async ({ page }) => {
  await open(page);
  const ex = page.locator('[data-example="file-drop/single"]');
  await expect(ex.locator('input[type="file"]')).not.toHaveAttribute("multiple");
  await drop(ex.getByRole("button", { name: "Hợp đồng (PDF)" }), [{ name: "a.pdf", size: 1 }, { name: "b.pdf", size: 2 }]);
  await expect(ex.getByRole("list").getByText("a.pdf", { exact: true })).toHaveCount(1);
  await expect(ex.getByRole("list").getByText("b.pdf")).toHaveCount(0);
  await expect(ex.getByRole("alert")).toContainText("b.pdf");
  await expect(ex.locator('[role="status"]')).toHaveText(/Đã thêm 1 tệp\. 1 tệp bị từ chối/);
});

test("a disabled drop area still cancels the browser's open-file default", async ({ page }) => {
  await open(page);
  const disabled = states(page).getByRole("button", { name: /Kéo thả/ }).nth(1);
  await expect(disabled).toBeDisabled();
  expect(await drop(disabled, [{ name: "a.pdf", size: 3 }])).toBe(true);
  await expect(states(page).getByText("a.pdf")).toHaveCount(0);
});

test("retry runs the app's handler and the row goes back to uploading", async ({ page }) => {
  await open(page);
  const ex = states(page);
  await expect(ex.getByText("Mất kết nối, thử lại.")).toBeVisible();
  await ex.getByRole("button", { name: "Thử lại" }).click();
  await expect(ex.getByText("Mất kết nối, thử lại.")).toHaveCount(0);
  await expect(ex.getByRole("progressbar", { name: /anh-san-pham-03\.jpg/ })).toBeVisible();
});

test("live region re-announces an identical message", async ({ page }) => {
  await open(page);
  const ex = basic(page);
  const input = ex.locator('input[type="file"]');
  const region = ex.locator('[role="status"]');
  await input.setInputFiles({ name: "n.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
  const first = await region.textContent();
  await input.setInputFiles({ name: "m.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
  const second = await region.textContent();
  expect(first?.trim()).toBe("1 tệp bị từ chối");
  expect(second?.trim()).toBe("1 tệp bị từ chối");
  expect(second).not.toBe(first);
});

test("a drop mixing a string item and files flags the right folder", async ({ page }) => {
  await open(page);
  const ex = basic(page);
  await drop(ex.getByRole("button", { name: "Tệp nhập" }), [{ name: "dir", size: 0 }, { name: "y.csv", size: 5 }], ["dir"], true);
  await expect(ex.getByRole("alert")).toContainText("dir: là thư mục");
  await expect(ex.getByRole("list").getByText("y.csv", { exact: true })).toHaveCount(1);
});

test("a non-file drag leaves the highlight off, a file drag turns it on", async ({ page }) => {
  await open(page);
  const ex = basic(page);
  const area = ex.getByRole("button", { name: "Tệp nhập" });
  const fire = (files: boolean) =>
    area.evaluate((el, files) => {
      const dt = new DataTransfer();
      if (files) dt.items.add(new File(["x"], "z.csv"));
      else dt.setData("text/plain", "hello");
      el.dispatchEvent(new DragEvent("dragenter", { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, files);
  await fire(false);
  await expect(area).not.toHaveClass(/(^|\s)bg-item-selected(\s|$)/);
  await fire(true);
  await expect(area).toHaveClass(/(^|\s)bg-item-selected(\s|$)/);
});

test("items already failed on mount are not announced", async ({ page }) => {
  await open(page);
  await expect(states(page).getByText("Mất kết nối, thử lại.")).toBeVisible();
  await expect(states(page).locator('[role="status"]').first()).toHaveText("");
});

test("the hidden input carries the button's name: getByLabel(field label) reaches it, and it stays out of the tab order", async ({ page }) => {
  await open(page);
  const ex = basic(page);
  const input = ex.getByLabel("Tệp nhập").and(ex.locator('input[type="file"]'));
  await input.setInputFiles(csv("by-label.csv"));
  await expect(ex.getByRole("list").getByText("by-label.csv", { exact: true })).toHaveCount(1);
  // The button is still the only control: the input is hidden, so it is neither focusable nor in the accessibility tree.
  await expect(ex.getByRole("button", { name: "Tệp nhập" })).toHaveCount(1);
  expect(await ex.locator('input[type="file"]').evaluate((el) => getComputedStyle(el).display)).toBe("none");
});
