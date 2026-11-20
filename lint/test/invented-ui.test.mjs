// node --test lint/test — the "invented UI" corpus (0.30.0): what an agent writes when it re-creates Semi instead of
// composing it must be caught, and the correct way to write the same thing must not be.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scan } from "../semi-lint.mjs";

/** Every rule a snippet breaks (hard and ratchet), as a sorted, de-duplicated list. */
function rules(code, { css = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "semi-invented-"));
  const file = join(dir, css ? "globals.css" : "page.tsx");
  writeFileSync(file, css || code.startsWith("import") || code.startsWith("export") ? code + "\n" : `export default function P() {\n  return (\n    <>\n${code}\n    </>\n  );\n}\n`);
  const r = scan([file], {}, dir);
  rmSync(dir, { recursive: true });
  return [...new Set([...r.hard.map((h) => h.rule), ...r.hits.map((h) => h.rule)])].sort();
}

const CAUGHT = {
  "raw button": ['<button className="px-4 py-2 rounded-control bg-accent text-on-accent">Lưu</button>', "raw-control"],
  "raw input": ['<input className="w-full border border-line rounded-control px-3 h-9" />', "raw-control"],
  "raw textarea": ['<textarea className="w-full" />', "raw-control"],
  "raw table": ["<table><tbody><tr><td>a</td></tr></tbody></table>", "raw-control"],
  "div card too tight": ['<div className="rounded-card border border-line bg-panel p-2">x</div>', "card-padding"],
  "style hex": ['<div style={{ color: "#ff0000" }}>x</div>', "literal-colour-value"],
  "style named colour": ['<div style={{ background: "red", color: "white" }}>x</div>', "inline-style-value"],
  "style font size": ["<p style={{ fontSize: 13 }}>x</p>", "inline-style-value"],
  "fixed tone text": ['<span className="bg-emerald-500/20 text-emerald-600">ok</span>', "no-fixed-tone-text"],
  "arbitrary alpha on a token": ['<div className="bg-panel/[0.05]">x</div>', "arbitrary-value"],
  "arbitrary spacing": ['<div className="p-[13px] gap-[7px]">x</div>', "arbitrary-value"],
  "arbitrary z-index": ['<div className="z-[9999]">x</div>', "arbitrary-value"],
  "token through var()": ['<div className="bg-[var(--semi-panel)]">x</div>', "arbitrary-value"],
  "tailwind shadow": ['<div className="shadow-lg">x</div>', "tw-shadow"],
  "lucide icons": ['import { Trash } from "lucide-react";', "foreign-ui"],
  "radix": ['import * as Dialog from "@radix-ui/react-dialog";', "foreign-ui"],
  "mui": ['import Button from "@mui/material/Button";', "foreign-ui"],
  "react-icons": ['import { FaTrash } from "react-icons/fa";', "foreign-ui"],
  "shadcn copy": ['import { Button } from "@/components/ui/button";', "foreign-ui"],
  "div onClick": ['<div onClick={() => go()} className="cursor-pointer">x</div>', "click-target"],
  "div onClick mid-line": ['<><div onClick={() => go()} className="cursor-pointer">x</div></>', "click-target"],
  "chromatic focus ring": ['<div className="ring-2 ring-blue-500">x</div>', "accent-state-token"],
  "leading override": ['<p className="text-ui leading-relaxed">x</p>', "leading-override"],
  "uppercase label": ['<span className="uppercase text-caption">nhãn</span>', "text-case"],
  "physical white": ['<span className="text-white">x</span>', "no-literal-palette"],
  "hand-made overlay": ['<div className="fixed inset-0 bg-overlay" />', "custom-overlay"],
  "emoji icon": ["<span>🗑️</span>", "emoji-icon"],
  "hand-made spinner": ['<div className="w-4 h-4 border-2 border-line rounded-full animate-spin" />', "custom-spinner"],
  "outline-none without focus": ['<span tabIndex={0} className="outline-none">x</span>', "focus-hidden"],
  "local Card": ['export function Card({ children }) { return <div className="rounded-card border border-line bg-panel p-card">{children}</div>; }', "local-primitive"],
  "chromatic text": ['<a className="text-blue-600">x</a>', "no-fixed-tone-text"],
  "rounded-md": ['<div className="rounded-md">x</div>', "radius-token"],
  "arbitrary hsl": ['<div className="bg-[hsl(0,0%,10%)]">x</div>', "hex-colour-class"],
  "native select": ['<select><option>a</option></select>', "native-select"],
};

for (const [name, [code, rule]] of Object.entries(CAUGHT))
  test(`caught: ${name} → ${rule}`, () => {
    assert.ok(rules(code).includes(rule), `${rule} not in ${JSON.stringify(rules(code))}`);
  });

test("caught: colours, radii and font sizes written into a stylesheet", () => {
  assert.deepEqual(rules(".card { background: #fff; }", { css: true }), ["css-raw-value"]);
  assert.deepEqual(rules(".x { border-radius: 10px; }", { css: true }), ["css-raw-value"]);
  assert.deepEqual(rules(":root { --my-blue: rgb(37 99 235); }", { css: true }), ["css-raw-value"]);
});

// The right way to write the same things: nothing may be flagged.
const CLEAN = {
  "Semi Button and Input": '<Button variant="primary">Lưu</Button>\n<Input aria-label="Tên" />',
  "Card pads itself; clickable Card": '<Card onClick={() => open()} active={on}>x</Card>',
  "hidden file input of a drop zone": '<input type="file" className="sr-only" />',
  "colour input (no Semi control for it)": '<input\n  type="color"\n  aria-label="Màu"\n/>',
  "native button styled by a Semi constant": '<button type="button" className={`${HEADER_ICON_BTN} ${HEADER_ICON_OFF}`} aria-label="AI">x</button>',
  "backdrop marked presentation": '<div role="presentation" className="absolute inset-0" onClick={close} />',
  "backdrop hidden from AT": '<div className="absolute inset-0" onClick={close} aria-hidden />',
  "component onClick": "<Row onClick={() => go()}>x</Row>",
  "focus ring next to outline-none": '<a href="/x" className="outline-none focus-visible:ring-2 focus-visible:ring-focus">x</a>',
  "FOCUS_RING constant": '<a className={cn("rounded-control", FOCUS_RING)} href="/x">x</a>',
  "text field shows its caret": '<CommandInput className="bg-transparent outline-none placeholder:text-muted" aria-label="Tìm" />',
  "safe-area padding": '<div className="pb-[env(safe-area-inset-bottom)] pt-[max(1rem,env(safe-area-inset-top))]">x</div>',
  "layout widths and grids": '<div className="w-[312px] grid-cols-[180px_1fr] max-h-[75dvh] top-[12vh]">x</div>',
  "style tokens": '<div className="shadow-card rounded-card bg-panel border border-line p-card">x</div>',
  "popover list p-1": '<div role="listbox" className="rounded-card border border-line shadow-overlay p-1">x</div>',
  "leading-tight title": '<h2 className="text-heading leading-tight">x</h2>',
  "acronyms in caps": "<span>JSON · HTTPS</span>",
  "spinning refresh icon": '<Icon name="refresh" className="w-4 h-4 animate-spin" />',
  "data width from a value": "<div style={{ width: `${pct}%` }} />",
  "Semi imports": 'import { Button, Icon } from "@semi/ui";\nimport { BTN_PRIMARY } from "@semi/ui/styles";',
  "a product component with its own name": 'export function OrderCard() { return <Card>x</Card>; }',
  "status tokens": '<div className="bg-danger-bg border border-danger-border text-danger-fg">x</div>',
};

for (const [name, code] of Object.entries(CLEAN))
  test(`not flagged: ${name}`, () => {
    assert.deepEqual(rules(code), []);
  });

test("not flagged: a stylesheet that only wires tokens", () => {
  assert.deepEqual(rules('@import "tailwindcss";\n@import "@semi/ui/tokens.css";\n.x { color: var(--color-muted); border-radius: var(--radius-card); }', { css: true }), []);
});
