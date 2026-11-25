// The density audit (lint/density.mjs) on hand-made pages: each rule catches its bad case and stays quiet on the
// good one next to it. Plain inline styles, so the defaults apply: 4px density unit, 34px control height.
import { expect, test, type Page } from "@playwright/test";
import { densityAudit } from "../lint/density.mjs";

const ACCENT = "rgb(0, 174, 66)";
const BOX = "border:1px solid #ccc;border-radius:8px;width:320px;";

async function audit(page: Page, body: string) {
  await page.setContent(
    `<html style="--color-primary:${ACCENT}"><body style="font:14px/1.5 sans-serif;margin:0;padding:24px;background:#fff;color:#222"><main>${body}</main></body></html>`,
  );
  return (await page.evaluate(densityAudit, { scope: "main" })).map((h) => h.rule);
}

const CASES: [string, string, string][] = [
  // [rule, bad, good]
  [
    "tight-box",
    `<div style="${BOX}padding:4px 6px"><p style="margin:0">Máy in X1 · đang in</p><p style="margin:0">Còn 42 phút</p></div>`,
    `<div style="${BOX}padding:16px"><p style="margin:0">Máy in X1 · đang in</p><p style="margin:0">Còn 42 phút</p></div>`,
  ],
  [
    "tight-row",
    `<ul style="margin:0;padding:0;list-style:none;width:320px">${"<li style='border-bottom:1px solid #ddd;padding:1px 12px'>Đơn SO-1042</li>".repeat(4)}</ul>`,
    `<ul style="margin:0;padding:0;list-style:none;width:320px">${"<li style='border-bottom:1px solid #ddd;padding:10px 12px'>Đơn SO-1042</li>".repeat(4)}</ul>`,
  ],
  [
    "tight-row",
    `<nav style="width:320px">${"<a href='#' style='display:block;height:24px;padding:0 12px'>Cài đặt</a>".repeat(4)}</nav>`,
    `<nav style="width:320px">${"<a href='#' style='display:flex;align-items:center;height:36px;padding:0 12px'>Cài đặt</a>".repeat(4)}</nav>`,
  ],
  [
    "box-nesting",
    `<div style="${BOX}width:520px;padding:16px"><div style="${BOX}width:460px;padding:16px"><div style="${BOX}width:400px;padding:16px"><div style="${BOX}padding:16px;height:60px">Chi tiết</div></div></div></div>`,
    `<div style="${BOX}width:520px;padding:16px"><div style="${BOX}width:460px;padding:16px"><div style="${BOX}padding:16px;height:60px">Chi tiết</div></div></div>`,
  ],
  [
    "type-mix",
    `<div style="${BOX}padding:16px">${[26, 18, 15, 14, 11].map((s) => `<div style="font-size:${s}px">Doanh thu ${s}</div>`).join("")}</div>`,
    `<div style="${BOX}padding:16px">${[26, 14, 12, 11].map((s) => `<div style="font-size:${s}px">Doanh thu ${s}</div>`).join("")}</div>`,
  ],
  [
    "colour-noise",
    `<div style="${BOX}padding:16px">${["#d11", "#1a4", "#15c", "#a2c"].map((c) => `<div style="color:${c}">Trạng thái</div>`).join("")}</div>`,
    `<div style="${BOX}padding:16px">${["#d11", "#1a4", "#15c", "#555"].map((c) => `<div style="color:${c}">Trạng thái</div>`).join("")}</div>`,
  ],
  [
    "primary-actions",
    `<form><button style="background:${ACCENT};color:#fff">Lưu</button><button style="background:${ACCENT};color:#fff">Gửi</button></form>`,
    `<form><button style="background:${ACCENT};color:#fff">Lưu</button><button style="background:#eee">Huỷ</button><button role="switch" aria-checked="true" style="background:${ACCENT}">on</button><button data-split-menu aria-haspopup="menu" style="background:${ACCENT}">▾</button></form>`,
  ],
  [
    // The same screen shown in light and in dark (nested data-theme scopes): one main button in each, not two in one view.
    "primary-actions",
    `<div data-theme="light"><button style="background:${ACCENT};color:#fff">Lưu</button><button style="background:${ACCENT};color:#fff">Gửi</button></div>`,
    `<div data-theme="light"><button style="background:${ACCENT};color:#fff">Lưu</button></div><div data-theme="dark"><button style="background:${ACCENT};color:#fff">Lưu</button></div>`,
  ],
  [
    // 1.0: nav's mainAction (<nav>) is its own scope, separate from the page's one filled brand button.
    "primary-actions",
    `<nav><button style="background:${ACCENT};color:#fff">Tạo mới</button><button style="background:${ACCENT};color:#fff">Khác</button></nav>`,
    `<nav><button style="background:${ACCENT};color:#fff">Tạo mới</button></nav><div><button style="background:${ACCENT};color:#fff">Lưu</button></div>`,
  ],
  [
    "cramped-boxes",
    `<div style="display:flex;gap:4px"><div style="${BOX}width:200px;padding:16px">Một</div><div style="${BOX}width:200px;padding:16px">Hai</div></div>`,
    `<div style="display:flex;gap:16px"><div style="${BOX}width:200px;padding:16px">Một</div><div style="${BOX}width:200px;padding:16px">Hai</div></div>`,
  ],
  [
    "double-line",
    `<div style="${BOX}overflow:hidden">${"<div style='border-bottom:1px solid #ddd;padding:10px 16px'>Hàng</div>".repeat(3)}</div>`,
    `<div style="${BOX}overflow:hidden">${"<div style='border-bottom:1px solid #ddd;padding:10px 16px'>Hàng</div>".repeat(2)}<div style="padding:10px 16px">Hàng</div></div>`,
  ],
];

for (const [rule, bad, good] of CASES) {
  test(`density · ${rule} · catches ${bad.slice(0, 40)}`, async ({ page }) => {
    expect(await audit(page, bad)).toContain(rule);
  });
  test(`density · ${rule} · passes ${good.slice(0, 40)}`, async ({ page }) => {
    expect(await audit(page, good)).toEqual([]);
  });
}

test("density · what it leaves alone: trees, field frames, specimens, clamped text, chips, scrolled tables", async ({ page }) => {
  const hits = await audit(
    page,
    `<ul role="tree" style="margin:0;padding:0;width:320px">${"<li role='treeitem' style='height:28px;cursor:pointer'>src</li>".repeat(4)}</ul>
     <div style="${BOX}border-radius:12px;padding:6px;height:90px"><textarea style="width:100%;border:0"></textarea><button>Gửi</button></div>
     <div data-density-skip="type scale" style="${BOX}padding:16px">${[26, 22, 18, 15, 14, 12, 11].map((s) => `<div style="font-size:${s}px">Aa ${s}</div>`).join("")}</div>
     <div style="${BOX}box-sizing:border-box;padding:16px;height:56px"><p style="margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">Một dòng rất dài bị cắt bớt cho vừa khung thẻ này và không được tính là sát mép</p></div>
     <div style="${BOX}padding:16px"><span style="border:1px solid #ccc;border-radius:999px;padding:1px 6px">Online</span></div>
     <div style="${BOX}padding:0;overflow:hidden"><div style="overflow-x:auto;padding:12px 0"><div style="width:900px;padding:0 16px">Mã đơn · Khách hàng · Trạng thái · Tổng · Ngày tạo · Ghi chú</div></div></div>`,
  );
  expect(hits).toEqual([]);
});

test("density · lengths follow the density unit: compact allows less, airy asks for more", async ({ page }) => {
  const card = `<div style="${BOX}padding:12px;height:40px">Máy in X1</div>`;
  expect(await audit(page, card)).toEqual([]);
  await page.evaluate(() => document.documentElement.style.setProperty("--spacing", "0.2875rem"));
  expect(await page.evaluate(densityAudit, { scope: "main" })).toEqual([expect.objectContaining({ rule: "tight-box" })]);
});
