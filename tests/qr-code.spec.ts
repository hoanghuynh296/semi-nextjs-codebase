// QRCode (examples/qr-code): the rendered SVG is decoded back to the VietQR EMVCo payload at every error-correction
// level, in both themes and in print; a too long value shows a message instead of throwing; the copy button copies.
import { expect, test, type Locator, type Page } from "@playwright/test";
import jsQR from "jsqr";

const VIETQR = "00020101021238540010A00000072701240006970422011001234567890208QRIBFTTA530370454061850005802VN62100806DH1042630444F9";
const RECEIPT = "00020101021238540010A00000072701240006970422011001234567890208QRIBFTTA53037045407125000005802VN62200816HD0007 Cafe Semi6304DEE9";
test.describe.configure({ timeout: 90_000 });
const ex = (page: Page, id: string) => page.locator(`[data-example="qr-code/${id}"]`);

async function open(page: Page, theme: "dark" | "light") {
  await page.addInitScript((t) => localStorage.setItem("semi-theme", t), theme);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/qr-code/");
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
}

/** Rasterise the SVG on a canvas (as a scanner camera would see it: whatever the page paints) and decode it. */
async function decode(svg: Locator) {
  const raw = await svg.evaluate(async (el) => {
    const xml = new XMLSerializer().serializeToString(el);
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    await img.decode();
    const n = 410; // 10 px per module for the 41-module (version 4) VietQR payload
    const c = document.createElement("canvas");
    c.width = c.height = n;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgb(128,128,128)"; // transparent areas must not read as white
    ctx.fillRect(0, 0, n, n);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, n, n);
    return { n, data: Array.from(ctx.getImageData(0, 0, n, n).data) };
  });
  return jsQR(Uint8ClampedArray.from(raw.data), raw.n, raw.n)?.data;
}

for (const theme of ["dark", "light"] as const) {
  test(`decodes to the VietQR payload at every level · ${theme}`, async ({ page }) => {
    await open(page, theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const svgs = ex(page, "levels").locator("svg[data-qr-code]");
    await expect(svgs).toHaveCount(4);
    for (const [i, level] of ["L", "M", "Q", "H"].entries()) {
      await expect(svgs.nth(i)).toHaveAttribute("data-ecc", level);
      expect(await decode(svgs.nth(i)), `level ${level}`).toBe(VIETQR);
    }
    expect(await decode(ex(page, "payment").locator("svg[data-qr-code]"))).toBe(VIETQR);
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
  expect(await decode(svg)).toBe(RECEIPT);
});

test("a value too long for the level does not throw: message and onError", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "light");
  const box = ex(page, "too-long");
  await expect(box.getByRole("alert")).toHaveText("Không tạo được mã QR");
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
