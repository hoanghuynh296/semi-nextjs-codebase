// node --test lint/test — 1.0 lint rules (#145, T3): one-brand-button, brand-colour-use, removed-token, heading-weight,
// overline-place (1.0 form/detail section labels) and per-line / per-file opt-in allowances with a reason.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configErrors, scan, skipReasons, v1Hits, WARN } from "../semi-lint.mjs";

const warn = (code, rule, { file = "page.tsx", cfg = {} } = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "semi-v1-"));
  const p = join(dir, file);
  writeFileSync(p, code);
  const r = scan([p], cfg, dir);
  rmSync(dir, { recursive: true });
  return r.warnings.filter((w) => !rule || w.rule === rule);
};

test("1.0 rules ship as warnings (never hard errors, never in the ratchet baseline)", () => {
  const ids = WARN.map(([id]) => id);
  for (const id of ["one-brand-button", "brand-colour-use", "removed-token", "heading-weight", "overline-place"]) {
    assert.ok(ids.includes(id), `${id} in WARN`);
  }
  const dir = mkdtempSync(join(tmpdir(), "semi-v1-"));
  const p = join(dir, "page.tsx");
  writeFileSync(
    p,
    `export default function P() {\n  return <div><h2 className="font-semibold">T</h2><span className="bg-accent-subtle text-primary">x</span><Button variant="primary">A</Button><Button variant="primary">B</Button></div>;\n}\n`,
  );
  const r = scan([p], {}, dir);
  assert.equal(r.hard.length, 0);
  assert.equal(Object.values(r.counts).flatMap((c) => Object.values(c)).length, 0);
  assert.deepEqual(
    [...new Set(r.warnings.map((w) => w.rule))].sort(),
    ["brand-colour-use", "heading-weight", "one-brand-button", "removed-token"],
  );
  rmSync(dir, { recursive: true });
});

test("one-brand-button: warns on a 2nd filled brand button in a page or modal; excludes AppShell mainAction, separate modals, neutral variants and mutually exclusive branches", () => {
  // FAIL: 2 primary buttons on one page
  assert.deepEqual(
    warn(`<Page><Button variant="primary">Lưu</Button><Button variant="primary">Gửi</Button></Page>`, "one-brand-button").map((w) => w.line),
    [1],
  );
  // FAIL: primary + secondary (both filled brand buttons) on one page
  assert.deepEqual(
    warn(`<Page>\n  <Button variant="primary">Lưu</Button>\n  <Button variant="secondary">Xuất</Button>\n</Page>`, "one-brand-button").map((w) => w.line),
    [3],
  );
  // FAIL: 2 filled brand buttons inside the same Modal
  assert.deepEqual(
    warn(`<Modal open>\n  <Button variant="primary">A</Button>\n  <Button variant="primary">B</Button>\n</Modal>`, "one-brand-button").map((w) => w.line),
    [3],
  );
  // FAIL: 2 BTN_PRIMARY usages in JSX on one page
  assert.deepEqual(
    warn(`<Page>\n  <Link href="/a" className={BTN_PRIMARY}>A</Link>\n  <Link href="/b" className={BTN_PRIMARY}>B</Link>\n</Page>`, "one-brand-button").map((w) => w.line),
    [3],
  );

  // PASS: 1 primary on page + 1 in Modal (separate scopes)
  assert.deepEqual(
    warn(`<Page>\n  <Button variant="primary">Lưu</Button>\n  <Modal open><Button variant="primary">Xác nhận</Button></Modal>\n</Page>`, "one-brand-button"),
    [],
  );
  // PASS: AppShell mainAction is not counted against the page's primary button
  assert.deepEqual(
    warn(`<AppShell mainAction={<Button variant="primary">Tạo mới</Button>} sections={S}>\n  <Button variant="primary">Lưu</Button>\n</AppShell>`, "one-brand-button"),
    [],
  );
  // PASS: neutral variants (subtle, surface, inverse, outline, ghost, danger) do not count
  assert.deepEqual(
    warn(`<Page>\n  <Button variant="primary">Lưu</Button>\n  <Button variant="inverse">Thêm</Button>\n  <Button variant="subtle">Huỷ</Button>\n  <Button variant="outline">Chia sẻ</Button>\n  <Button variant="danger">Xoá</Button>\n</Page>`, "one-brand-button"),
    [],
  );
  // PASS: mutually exclusive tab panels and ternary branches
  assert.deepEqual(
    warn(`export default function Settings({ tab }) {\n  return (\n    <div>\n      {tab === "a" && (<Button variant="primary">Lưu A</Button>)}\n      {tab === "b" && (<Button variant="primary">Lưu B</Button>)}\n    </div>\n  );\n}`, "one-brand-button"),
    [],
  );
  assert.deepEqual(
    warn(`export default function Form({ edit }) {\n  return edit ? <Button variant="primary">Cập nhật</Button> : <Button variant="primary">Tạo</Button>;\n}`, "one-brand-button"),
    [],
  );
});

test("one-brand-button & brand-colour-use: per-line opt-in requires a reason; per-file skip with reason works and is reported", () => {
  // Per-line opt-in WITH reason suppresses warning
  assert.deepEqual(
    warn(
      `<Page>\n  <Button variant="primary">Đặt hàng</Button>\n  // semi-lint-allow one-brand-button: owner approved dual CTA on checkout\n  <Button variant="secondary">Yêu cầu báo giá</Button>\n</Page>`,
      "one-brand-button",
    ),
    [],
  );
  // Per-line opt-in WITHOUT reason (line comment or empty JSX block comment) does NOT suppress warning
  assert.equal(
    warn(
      `<Page>\n  <Button variant="primary">Đặt hàng</Button>\n  // semi-lint-allow one-brand-button\n  <Button variant="secondary">Yêu cầu báo giá</Button>\n</Page>`,
      "one-brand-button",
    ).length,
    1,
  );
  assert.equal(
    warn(
      `<Page>\n  <Button variant="primary">Đặt hàng</Button>\n  {/* semi-lint-allow one-brand-button: */}\n  <Button variant="secondary">Yêu cầu báo giá</Button>\n</Page>`,
      "one-brand-button",
    ).length,
    1,
  );
  // Two primary buttons with an unrelated neutral ternary or onClick early return between them still warn
  assert.equal(
    warn(
      `<Page>\n  <Button variant="primary" onClick={() => { if (!ok) return; save(); }}>A</Button>\n  {flag ? <Button variant="subtle">X</Button> : <Button variant="ghost">Y</Button>}\n  <Button variant="primary">B</Button>\n</Page>`,
      "one-brand-button",
    ).length,
    1,
  );
  // Per-file skip with reason in semi-lint.json
  const cfg = { skip: { "one-brand-button": { "page.tsx": "owner: checkout dual CTA" }, "brand-colour-use": { "page.tsx": "owner: hero badge" } } };
  assert.deepEqual(configErrors(cfg), []);
  assert.equal(skipReasons(cfg).length, 2);
  assert.deepEqual(
    warn(`<Page><Button variant="primary">A</Button><Button variant="primary">B</Button><div className="bg-primary text-on-primary">x</div></Page>`, null, { cfg }),
    [],
  );
});

test("brand-colour-use: allows main buttons, nav mainAction, big-tab underline, CountBadge and NewTag; warns on brand tints, text, borders and non-button fills", () => {
  // FAIL
  const FAIL = [
    `<span className="text-primary">Link</span>`,
    `<div className="border border-primary">Selected</div>`,
    `<div className="bg-primary/10 text-strong">Tinted card</div>`,
    `<div className="ring-2 ring-primary">Focused</div>`,
    `<div className="bg-primary text-on-primary p-4">Brand card</div>`,
    `<Badge className="bg-primary text-on-primary">Tag</Badge>`,
    `<span className="bg-secondary text-on-secondary">Chip</span>`,
  ];
  for (const code of FAIL) {
    assert.ok(v1Hits(code).some(([r]) => r === "brand-colour-use"), `should warn: ${code}`);
  }
  // PASS
  const PASS = [
    `<button className="bg-primary hover:bg-primary-hover text-on-primary">Lưu</button>`,
    `// leading comment line must not shift offsets\n<button className="bg-primary text-on-primary">Lưu</button>`,
    `<Link href="/new" className="bg-primary text-on-primary">Tạo mới</Link>`,
    `<Button variant="primary">Lưu</Button>`,
    `<CountBadge count={5} />`,
    `<NewTag />`,
    `<span className="underline decoration-primary">Tab</span>`,
    `<span className="bg-new-tag text-on-new-tag">Mới</span>`,
    `<div className="bg-item-selected border-outline-line text-strong">Selected</div>`,
  ];
  for (const code of PASS) {
    assert.deepEqual(v1Hits(code).filter(([r]) => r === "brand-colour-use"), [], `should pass: ${code}`);
  }
});

test("removed-token: flags removed 0.x tokens, classes, data-style, style files and CSS vars with their 1.0 replacement", () => {
  const cases = [
    [`<div className="bg-accent-subtle text-contrast" />`, /item-selected/, /strong/],
    [`<div className="border-accent-line hover:bg-accent-subtle-hover" />`, /outline-line/, /item-selected/],
    [`<span className="text-accent-fg text-caption" />`, /strong/, /text-chrome/],
    [`<p className="text-heading-sm text-kpi z-keypad" />`, /text-section/, /text-figure/],
    [`<html data-style="sharp" />`, /data-style/],
    [`import s from "@semi/ui/styles.json";`, /styles\.json/],
  ];
  for (const [code, ...patterns] of cases) {
    const hits = warn(code, "removed-token");
    assert.ok(hits.length > 0, `expected removed-token on: ${code}`);
    const joined = hits.map((h) => h.message).join("\n");
    for (const pat of patterns) assert.match(joined, pat, code);
  }
  // CSS file: @apply, [data-style], removed CSS vars (but NOT --semi-contrast, which is kept in 1.0!)
  const cssHits = warn(
    `[data-style="flat"] { color: var(--semi-accent); }\n.a { @apply bg-accent-subtle text-label; }\n.ok { color: color-mix(in oklab, var(--semi-contrast) 10%, transparent); }\n`,
    "removed-token",
    { file: "globals.css" },
  );
  assert.ok(cssHits.some((h) => h.line === 1 && /data-style/.test(h.message)));
  assert.ok(cssHits.some((h) => h.line === 1 && /--semi-accent/.test(h.message)));
  assert.ok(cssHits.some((h) => h.line === 2 && /bg-accent-subtle/.test(h.message)));
  assert.ok(cssHits.some((h) => h.line === 2 && /text-label/.test(h.message)));
  assert.ok(!cssHits.some((h) => h.line === 3), "--semi-contrast is a valid 1.0 private token");
});

test("heading-weight: flags font-semibold / font-bold on headings and title utilities, and font-medium+ on big TextTabs; allows 400/500 and text-overline", () => {
  const FAIL = [
    `<h1 className="text-figure font-semibold text-strong">Đơn hàng</h1>`,
    `<h2 className="text-section font-bold text-strong">Tổng quan</h2>`,
    `<h3 className="font-semibold">Chi tiết</h3>`,
    `<h2 className="font-[600]">Arbitrary 600</h2>`,
    `<PageTitle title="Đơn hàng" className="font-semibold" />`,
    `<div className="text-hero font-semibold">Hero</div>`,
    `<div className="text-tab-xl font-medium">Khám phá</div>`,
    `<TextTabs className="font-medium" tabs={T} value={v} onChange={setV} />`,
  ];
  for (const code of FAIL) {
    assert.ok(v1Hits(code).some(([r]) => r === "heading-weight"), `should warn: ${code}`);
  }
  const PASS = [
    `<h1 className="text-figure font-normal text-strong">Đơn hàng</h1>`,
    `<h2 className="text-section font-medium text-strong">Tổng quan</h2>`,
    `<h3 className="text-overline text-muted font-semibold">MODEL</h3>`,
    `<div className="text-tab-xl font-normal font-display">Khám phá</div>`,
    `<span className="text-chrome font-semibold">3 đã chọn</span>`,
    `<span className="text-badge font-bold">9</span>`,
  ];
  for (const code of PASS) {
    assert.deepEqual(v1Hits(code).filter(([r]) => r === "heading-weight"), [], `should pass: ${code}`);
  }
});

test("overline-place (1.0): allows form/detail section labels (including <legend>), flags single field labels (<label>, <Field labelClassName>)", () => {
  assert.deepEqual(warn(`<fieldset><legend className="text-overline text-muted">MODEL</legend></fieldset>`, "overline-place"), []);
  assert.deepEqual(warn(`<div className="text-overline text-muted">PROMPT</div>`, "overline-place"), []);
  assert.equal(warn(`<label className="text-overline">Email</label>`, "overline-place").length, 1);
  assert.equal(warn(`<Field label="Email" labelClassName="text-overline"><Input /></Field>`, "overline-place").length, 1);
});
