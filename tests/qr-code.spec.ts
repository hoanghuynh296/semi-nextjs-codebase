// QRCode (examples/qr-code): the rendered SVG is decoded back to the VietQR EMVCo payload at every error-correction
// level, in both themes and in print; a too long value shows a message instead of throwing; the copy button copies.
import { expect, test, type Locator, type Page } from "@playwright/test";
import jsQR from "jsqr";

const VIETQR = "00020101021238540010A00000072701240006970422011001234567890208QRIBFTTA530370454061850005802VN62100806DH1042630444F9";
const RECEIPT = "00020101021238540010A00000072701240006970422011001234567890208QRIBFTTA53037045407125000005802VN62200816HD0007 Cafe Semi6304DEE9";
test.describe.configure({ timeout: 90_000 });
test.use({ deviceScaleFactor: 4 });
const ex = (page: Page, id: string) => page.locator(`[data-example="qr-code/${id}"]`);

async function open(page: Page, theme: "dark" | "light") {
  await page.addInitScript((t) => localStorage.setItem("semi-theme", t), theme);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/qr-code/");
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
}

/** Decode the real rendered pixels (a screenshot of the element: theme CSS, frame, clamping all included). */
async function decode(page: Page, svg: Locator) {
  const png = (await svg.screenshot()).toString("base64");
  const raw = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return { w: c.width, h: c.height, data: Array.from(ctx.getImageData(0, 0, c.width, c.height).data) };
  }, png);
  return jsQR(Uint8ClampedArray.from(raw.data), raw.w, raw.h)?.data;
}

for (const theme of ["dark", "light"] as const) {
  test(`decodes to the VietQR payload at every level · ${theme}`, async ({ page }) => {
    await open(page, theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const svgs = ex(page, "levels").locator("svg[data-qr-code]");
    await expect(svgs).toHaveCount(4);
    for (const [i, level] of ["L", "M", "Q", "H"].entries()) {
      await expect(svgs.nth(i)).toHaveAttribute("data-ecc", level);
      expect(await decode(page, svgs.nth(i)), `level ${level}`).toBe(VIETQR);
    }
    expect(await decode(page, ex(page, "payment").locator("svg[data-qr-code]"))).toBe(VIETQR);
  });
}

test("modules stay black on white with a 4-module quiet zone, whatever the theme", async ({ page }) => {
  await open(page, "dark");
  const svg = ex(page, "payment").locator("svg[data-qr-code]");
  const [bg, fg, vb] = await Promise.all([svg.locator("rect").getAttribute("fill"), svg.locator("path").getAttribute("fill"), svg.getAttribute("viewBox")]);
  expect([bg, fg]).toEqual(["white", "black"]);
  const modules = Number(vb!.split(" ")[2]);
  // First dark module of the path sits at x >= 4 and y >= 4; version 1 is 21 modules, so the viewBox is a multiple of 4 + 8 apart.
  const d = await svg.locator("path").getAttribute("d");
  const coords = [...d!.matchAll(/M(\d+) (\d+)h(\d+)/g)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
  expect(Math.min(...coords.map((c) => c[0]), ...coords.map((c) => c[1]))).toBeGreaterThanOrEqual(4);
  expect(Math.max(...coords.map((c) => c[0] + c[2]), ...coords.map((c) => c[1] + 1))).toBeLessThanOrEqual(modules - 4);
});

test("print variant: no frame, no copy button, crisp edges, still decodes", async ({ page }) => {
  await open(page, "dark");
  const svg = ex(page, "receipt").locator("svg[data-qr-code]");
  await expect(svg).toHaveAttribute("shape-rendering", "crispEdges");
  expect(await svg.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
  await expect(ex(page, "receipt").locator("figure button")).toHaveCount(0);
  expect(await decode(page, svg)).toBe(RECEIPT);
});

test("a value too long for the level does not throw: message and onError", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "light");
  const box = ex(page, "too-long");
  await expect(box.getByRole("alert")).toContainText("Mã QR");
  await expect(box.getByRole("alert")).toContainText("Không tạo được mã QR");
  await expect(box.locator("svg[data-qr-code]")).toHaveCount(0);
  await expect(box.getByText(/^onError: .+/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("the copy button copies copyValue and says so", async ({ page }) => {
  await open(page, "light");
  const box = ex(page, "payment");
  await box.getByRole("button", { name: "Sao chép" }).click();
  await expect(box.getByRole("button", { name: "Đã sao chép" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("0123456789");
});

test("copy without a clipboard API (plain http) or with a denied one never says copied", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }));
  await open(page, "light");
  const box = ex(page, "payment");
  await box.getByRole("button", { name: "Sao chép" }).click();
  await page.waitForTimeout(300);
  await expect(box.getByRole("button", { name: "Sao chép" })).toBeVisible();
  await expect(box.getByRole("button", { name: "Đã sao chép" })).toHaveCount(0);
});

test("a denied clipboard write stays 'Sao chép' without an unhandled rejection", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) }, configurable: true }));
  await open(page, "light");
  const box = ex(page, "payment");
  await box.getByRole("button", { name: "Sao chép" }).click();
  await page.waitForTimeout(300);
  await expect(box.getByRole("button", { name: "Đã sao chép" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a UTF-8 (Vietnamese) value decodes back, and a size under 120 is clamped to 120", async ({ page }) => {
  await open(page, "light");
  const svg = ex(page, "text").locator("svg[data-qr-code]");
  await expect(svg).toHaveAttribute("width", "120");
  await expect(svg).toHaveAttribute("height", "120");
  expect((await svg.boundingBox())!.width).toBeCloseTo(120, 0);
  expect(await decode(page, svg)).toBe("https://semi.vn/hoa-don/HD0007?khach=Nguyễn Văn Á");
});

test("the caption is not the image's name: no figure, the image keeps its label", async ({ page }) => {
  await open(page, "light");
  const box = ex(page, "payment");
  await expect(box.locator("figure")).toHaveCount(0);
  await expect(box.getByRole("img", { name: "Mã VietQR thanh toán đơn DH1042" })).toBeVisible();
});
