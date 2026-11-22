// node --test lint/test — the form kit (#67): the pure parts behind Field kind, FormActions and useUnsavedGuard
// (src/fieldKinds.ts, src/formGuard.ts, imported as TypeScript: Node 24 strips the types) and its four lint warnings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FIELD_KINDS, kindAttrs } from "../../src/fieldKinds.ts";
import { keyboardInset, leavesPage } from "../../src/formGuard.ts";
import { scan, warnHits, WARN } from "../semi-lint.mjs";

test("Field kind: every kind sets type, inputMode, autoComplete and enterKeyHint", () => {
  assert.deepEqual(Object.keys(FIELD_KINDS), ["email", "tel", "number", "money", "url", "search", "password"]);
  assert.deepEqual(FIELD_KINDS.email, { type: "email", inputMode: "email", autoComplete: "email", enterKeyHint: "next" });
  assert.deepEqual(FIELD_KINDS.tel, { type: "tel", inputMode: "tel", autoComplete: "tel", enterKeyHint: "next" });
  assert.deepEqual(FIELD_KINDS.url, { type: "url", inputMode: "url", autoComplete: "url", enterKeyHint: "next" });
  assert.deepEqual(FIELD_KINDS.search, { type: "search", inputMode: "search", autoComplete: "off", enterKeyHint: "search" });
  assert.deepEqual(FIELD_KINDS.password, { type: "password", inputMode: "text", autoComplete: "current-password", enterKeyHint: "go" });
  // numbers are text inputs with a numeric keypad (never type="number"): decimals for number, whole units for money
  assert.deepEqual(FIELD_KINDS.number, { type: "text", inputMode: "decimal", autoComplete: "off", enterKeyHint: "next" });
  assert.deepEqual(FIELD_KINDS.money, { type: "text", inputMode: "numeric", autoComplete: "off", enterKeyHint: "next" });
  for (const [kind, a] of Object.entries(FIELD_KINDS)) {
    assert.ok(a.type && a.inputMode && a.autoComplete && a.enterKeyHint, `${kind} sets all four`);
    assert.notEqual(a.type, "number", `${kind} is never a native number input`);
  }
});

test("Field kind: no kind sets nothing, so a control outside a kind is left alone", () => {
  assert.deepEqual(kindAttrs(undefined), {});
  assert.equal(kindAttrs("email").inputMode, "email");
});

const HOME = "https://app.example.com/printers/new?step=1";
const click = (over = {}) => ({ defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...over });
const link = (href, over = {}) => ({ href, target: "", download: false, ...over });

test("useUnsavedGuard: a link click to another page of the app is intercepted", () => {
  assert.equal(leavesPage(click(), link("https://app.example.com/printers"), HOME), true);
  assert.equal(leavesPage(click(), link("/printers"), HOME), true, "relative href");
  assert.equal(leavesPage(click(), link("https://app.example.com/printers/new?step=2"), HOME), true, "another query is another page");
  assert.equal(leavesPage(click(), link("https://app.example.com/docs", { target: "_self" }), HOME), true);
});

test("useUnsavedGuard: clicks that do not leave the page are not intercepted", () => {
  assert.equal(leavesPage(click(), link("https://app.example.com/printers/new?step=1#notes"), HOME), false, "same page, a hash");
  assert.equal(leavesPage(click(), link("https://other.example.com/"), HOME), false, "another site (beforeunload covers it)");
  assert.equal(leavesPage(click(), link("/printers", { target: "_blank" }), HOME), false, "new tab");
  assert.equal(leavesPage(click(), link("/export.csv", { download: true }), HOME), false, "download");
  assert.equal(leavesPage(click({ metaKey: true }), link("/printers"), HOME), false, "cmd-click opens a tab");
  assert.equal(leavesPage(click({ ctrlKey: true }), link("/printers"), HOME), false);
  assert.equal(leavesPage(click({ shiftKey: true }), link("/printers"), HOME), false);
  assert.equal(leavesPage(click({ button: 1 }), link("/printers"), HOME), false, "middle click");
  assert.equal(leavesPage(click({ defaultPrevented: true }), link("/printers"), HOME), false, "the page handled it");
  assert.equal(leavesPage(click(), link("mailto:a@b.vn"), HOME), false);
  assert.equal(leavesPage(click(), link("tel:+84900000000"), HOME), false);
});

test("FormActions: the keyboard inset lifts the sticky bar by what the keyboard covers, ignores a zoomed page", () => {
  const iphone = 812; // innerHeight of a 375×812 phone
  assert.equal(keyboardInset({ height: 812, offsetTop: 0, scale: 1 }, iphone), 0, "closed");
  assert.equal(keyboardInset({ height: 470, offsetTop: 0, scale: 1 }, iphone), 342, "keyboard open: bar sits 342px up");
  assert.equal(keyboardInset({ height: 470, offsetTop: 100, scale: 1 }, iphone), 242, "the visual viewport scrolled inside the layout viewport");
  assert.equal(keyboardInset({ height: 780, offsetTop: 0, scale: 1 }, iphone), 0, "a 32px browser bar is not a keyboard");
  assert.equal(keyboardInset({ height: 400, offsetTop: 0, scale: 2 }, iphone), 0, "pinch-zoom shrinks the visual viewport too");
  assert.equal(keyboardInset({ height: 900, offsetTop: 0, scale: 1 }, iphone), 0, "never negative");
});

const warn = (code) => warnHits(code).map(([rule]) => rule);

test("form-no-guard: a page form without useUnsavedGuard warns; a guarded form, a modal form and a comment do not", () => {
  const form = `export default function P() {\n  return (<form><Field label="Tên"><Input /></Field><FormActions /></form>);\n}`;
  assert.deepEqual(warn(form), ["form-no-guard"]);
  assert.deepEqual(warnHits(form), [["form-no-guard", 2]]);
  assert.deepEqual(warn(`const g = useUnsavedGuard(dirty);\n${form}`), []);
  assert.deepEqual(warn(`<Modal open footer={<FormActions placement="modal" />}><Field label="Tên"><Input /></Field></Modal>`), []);
  assert.deepEqual(warn(`<Popover><form><Field label="Tên"><Input /></Field></form></Popover>`), []);
  assert.deepEqual(warn(`// <FormActions> goes last\nconst a = 1;`), []);
  assert.deepEqual(warn(`<form><button>x</button></form>`), [], "no fields, nothing to lose");
});

test("action-order: the primary before Huỷ warns; Huỷ first does not", () => {
  assert.deepEqual(warn(`<div><Button variant="primary">Lưu</Button><Button>Huỷ</Button></div>`), ["action-order"]);
  assert.deepEqual(warn(`<div>\n  <Button variant="primary">\n    Tạo\n  </Button>\n  <Button variant="ghost">\n    Hủy\n  </Button>\n</div>`), ["action-order"]);
  assert.deepEqual(warn(`<div><Button variant="primary">Save</Button><Button>Cancel</Button></div>`), ["action-order"]);
  assert.deepEqual(warn(`<div><Button variant="ghost">Huỷ</Button><Button variant="primary">Lưu</Button></div>`), []);
  assert.deepEqual(warn(`<div><Button variant="primary">Lưu</Button><Button>Xem thêm</Button></div>`), []);
});

test("toast-for-validation: a toast about a missing or invalid field warns; a result toast does not", () => {
  assert.deepEqual(warn(`if (!name) toast({ title: "Tên là bắt buộc", tone: "danger" });`), ["toast-for-validation"]);
  assert.deepEqual(warn(`toast({\n  title: "Email không hợp lệ",\n  tone: "danger",\n});`), ["toast-for-validation"]);
  assert.deepEqual(warn(`toast({ title: "Vui lòng nhập số điện thoại" });`), ["toast-for-validation"]);
  assert.deepEqual(warn(`toast({ title: "Đã lưu", tone: "success" });`), []);
  assert.deepEqual(warn(`toast({ title: "Đã xác thực", tone: "success" });\n<Foo invalid={error} />`), [], "only the toast's own text counts");
});

test("field-input-mode: an email / phone / url / password / money field without kind warns", () => {
  assert.deepEqual(warn(`<Field label="Email"><Input /></Field>`), ["field-input-mode"]);
  assert.deepEqual(warn(`<Field label="Số điện thoại" required><Input /></Field>`), ["field-input-mode"]);
  assert.deepEqual(warn(`<Field label="Mật khẩu"><Input /></Field>`), ["field-input-mode"]);
  assert.deepEqual(warn(`<Field label="Giá bán"><Input /></Field>`), ["field-input-mode"]);
  assert.deepEqual(warn(`<Input type="email" />`), ["field-input-mode"]);
  assert.deepEqual(warn(`<Field label="Email" kind="email"><Input /></Field>`), []);
  assert.deepEqual(warn(`<Input type="tel" inputMode="tel" />`), []);
  assert.deepEqual(warn(`<Field label="Tên máy in"><Input /></Field>`), []);
  assert.deepEqual(warn(`<Field label="Giáo viên"><Input /></Field>`), [], "giáo is not giá");
});

test("the form-kit rules are warnings: scan() reports them apart from hard and ratchet hits, and skip / disable work", () => {
  assert.deepEqual(WARN.map(([id]) => id), ["form-no-guard", "action-order", "toast-for-validation", "field-input-mode"]);
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  const file = join(dir, "page.tsx");
  writeFileSync(file, `export default function P() {\n  return <form><Field label="Email"><Input /></Field><FormActions /></form>;\n}\n`);
  const r = scan([file], {}, dir);
  assert.deepEqual(r.hard, []);
  assert.deepEqual(r.warnings.map((w) => [w.rule, w.line]).sort(), [["field-input-mode", 2], ["form-no-guard", 2]]);
  assert.ok(r.warnings.every((w) => w.message && w.file === "page.tsx"));
  assert.equal(Object.values(r.counts).flatMap((c) => Object.values(c)).length, 0, "nothing lands in the ratchet baseline");
  assert.deepEqual(scan([file], { disable: ["form-no-guard"] }, dir).warnings.map((w) => w.rule), ["field-input-mode"]);
  assert.deepEqual(scan([file], { skip: { "field-input-mode": ["page.tsx"] } }, dir).warnings.map((w) => w.rule), ["form-no-guard"]);
  rmSync(dir, { recursive: true });
});
