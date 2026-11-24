// The a11y audit (lint/a11y.mjs) on hand-made pages: each rule catches its bad case and stays quiet on the good one
// next to it.
import { expect, test, type Page } from "@playwright/test";
import { a11yAudit } from "../lint/a11y.mjs";

const HEAD = `<meta name="viewport" content="width=device-width, initial-scale=1">`;
const RING = "<style>.ring:focus-visible{outline:2px solid #0a6}</style>";

async function audit(page: Page, body: string, head = HEAD, lang = "vi") {
  await page.setContent(`<html lang="${lang}"><head>${head}${RING}</head><body style="font:14px/1.5 sans-serif;margin:0;padding:24px;background:#fff;color:#222">${body}</body></html>`);
  return (await page.evaluate(a11yAudit, {})).map((h) => h.rule);
}

const BTN = "class='ring' style='height:34px;padding:0 12px;border:0;background:#eee;color:#222'";
const CASES: [string, string, string][] = [
  // [rule, bad, good]
  ["contrast", `<p style="color:#aaa">Còn 42 phút</p>`, `<p style="color:#595959">Còn 42 phút</p>`],
  ["contrast", `<div style="background:rgba(0,174,66,.15)"><p style="color:#5c5">Đang in</p></div>`, `<div style="background:rgba(0,174,66,.15)"><p style="color:#13612f">Đang in</p></div>`],
  [
    "edge",
    `<label>Tên máy <input class="ring" style="border:1px solid #eee;background:#fff;height:34px"></label>`,
    `<label>Tên máy <input class="ring" style="border:1px solid #8a8a8a;background:#fff;height:34px"></label>`,
  ],
  [
    "edge",
    `<div style="background:#f6f6f6;padding:16px"><label>Ghi chú <input class="ring" style="border:0;background:#fff;height:34px"></label></div>`,
    `<div style="background:#f6f6f6;padding:16px"><label>Ghi chú <input class="ring" style="border:1px solid #767676;background:#fff;height:34px"></label></div>`,
  ],
  ["name", `<button ${BTN}><svg width="16" height="16" aria-hidden="true"></svg></button>`, `<button ${BTN} aria-label="Cài đặt"><svg width="16" height="16" aria-hidden="true"></svg></button>`],
  [
    "name",
    `<input class="ring" placeholder="Tìm đơn hàng" style="border:1px solid #767676;height:34px">`,
    `<label for="q">Tìm đơn hàng</label><input id="q" class="ring" placeholder="SO-1042" style="border:1px solid #767676;height:34px">`,
  ],
  ["focus-ring", `<button style="height:34px;outline:none;border:0;background:#eee;color:#222">Lưu</button>`, `<button ${BTN}>Lưu</button>`],
  [
    "target-size",
    `<div>${"<button class='ring' aria-label='Trang' style='width:8px;height:8px;margin:2px;padding:0;border:0;background:#888'></button>".repeat(3)}</div>`,
    `<div>${"<button class='ring' aria-label='Trang' style='width:8px;height:8px;margin:10px;padding:0;border:0;background:#888'></button>".repeat(3)}</div>`,
  ],
  ["img-alt", `<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="40" height="40">`, `<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="40" height="40" alt="">`],
];

for (const [rule, bad, good] of CASES) {
  test(`a11y · ${rule} · catches ${bad.slice(0, 50)}`, async ({ page }) => {
    expect(await audit(page, bad)).toContain(rule);
  });
  test(`a11y · ${rule} · passes ${good.slice(0, 50)}`, async ({ page }) => {
    expect(await audit(page, good)).toEqual([]);
  });
}

test("a11y · field-size: under 16px is a hit at phone width only", async ({ page }) => {
  const field = (px: number) => `<input aria-label="Tên" style="font-size:${px}px;border:1px solid #767676;height:34px">`;
  await page.setViewportSize({ width: 375, height: 800 });
  expect(await audit(page, field(14))).toEqual(["field-size"]);
  expect(await audit(page, field(16))).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await audit(page, field(14))).toEqual([]);
});

test("a11y · lang and zoom-lock come from the document", async ({ page }) => {
  const body = `<p>Xin chào</p>`;
  expect(await audit(page, body, HEAD, "")).toEqual(["lang"]);
  expect(await audit(page, body, `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`)).toEqual(["zoom-lock"]);
  expect(await audit(page, body, `<meta name="viewport" content="width=device-width, user-scalable=no">`)).toEqual(["zoom-lock"]);
});

test("a11y · what it leaves alone: a hit area from a pseudo-element, inline links, disabled text, skipped specimens, a ring on the wrapper", async ({ page }) => {
  const hits = await audit(
    page,
    `<style>.dot{position:relative}.dot::before{content:"";position:absolute;top:50%;left:50%;width:24px;height:24px;transform:translate(-50%,-50%)}
            .field:focus-within{box-shadow:0 0 0 2px #0a6}</style>
     <div>${"<button class='ring dot' aria-label='Trang' style='width:6px;height:6px;margin:3px;padding:0;border:0;background:#888'></button>".repeat(3)}</div>
     <p>Đọc <a class="ring" href="#">điều khoản</a> trước khi in.</p>
     <button disabled style="color:#ccc;height:34px">Đang lưu</button>
     <div data-a11y-skip="contrast specimen"><span style="color:#eee">Aa</span></div>
     <label>Tin nhắn <span class="field" style="display:inline-flex;border:1px solid #767676"><input style="border:0;outline:none;height:32px"></span></label>`,
  );
  expect(hits).toEqual([]);
});

test("a11y · a hit area centred with the translate property (Tailwind 4's -translate-1/2, HIT_AREA) sits on its button, not beside it", async ({ page }) => {
  // The ::before is the button's own size, centred with `translate: -50% -50%`: read without the translate it would
  // start halfway across the button and cover the small link 8px to its right.
  const hits = await audit(
    page,
    `<style>.hit{position:relative}.hit::before{content:"";position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;translate:-50% -50%}</style>
     <div style="display:flex;align-items:center;gap:8px"><button class="ring hit" style="width:100px;height:28px">Copy page</button><a class="ring" href="#" style="display:inline-flex;height:22px">x.md</a></div>`,
  );
  expect(hits).toEqual([]);
  // A calc() translate (`calc(-50% + 1px) calc(-50% - 1px)`) is two values, each worked out: the 24px hit areas of
  // three 6px dots then reach 24px, so none is too small.
  const calc = await audit(
    page,
    `<style>.dot{position:relative}.dot::before{content:"";position:absolute;top:50%;left:50%;width:24px;height:24px;translate:calc(-50% + 1px) calc(-50% - 1px)}</style>
     <div>${"<button class='ring dot' aria-label='Trang' style='width:6px;height:6px;margin:3px;padding:0;border:0;background:#888'></button>".repeat(3)}</div>`,
  );
  expect(calc).toEqual([]);
});
