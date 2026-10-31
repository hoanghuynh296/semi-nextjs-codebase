// node --test lint/test — the /semi-init token codemod.
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectMode, migrateClassString, migrateSource } from "../codemod.mjs";
import { analyse } from "../classes.mjs";

const m = (v, mode) => migrateClassString(v, mode).value;

test("issues #1–#4 map to semantic tokens", () => {
  assert.equal(m("border-b border-slate-50 hover:bg-field"), "border-b border-divider hover:bg-field");
  assert.equal(m("divide-y divide-slate-100"), "divide-y divide-divider");
  assert.equal(m("bg-purple-50 text-purple-700 border-purple-200"), "bg-purple-500/10 text-tone-purple border-purple-500/20");
  assert.equal(m("bg-gradient-to-l from-white to-transparent"), "bg-gradient-to-l from-panel to-transparent");
});

test("legacy light/dark pairs collapse into one token", () => {
  assert.equal(m("bg-white dark:bg-slate-900 text-slate-900 dark:text-white"), "bg-panel text-contrast");
  assert.equal(m("text-amber-700 dark:text-amber-300"), "text-tone-amber");
  assert.equal(m("border-gray-200 dark:border-gray-800 md:hover:bg-gray-50 md:dark:hover:bg-gray-800"), "border-line md:hover:bg-field");
});

test("variants and important flags are kept", () => {
  assert.equal(m("hover:bg-amber-100 active:bg-amber-200 group-hover:text-primary-300 !text-gray-500"), "hover:bg-amber-500/15 active:bg-amber-500/20 group-hover:text-accent-fg !text-muted");
});

test("dark-first apps map dark shades", () => {
  assert.equal(m("bg-slate-900 text-slate-300 border-slate-800", "dark"), "bg-app text-body border-line");
  assert.equal(m("bg-slate-950 text-slate-100", "dark"), "bg-canvas text-contrast");
});

test("sizes and shadows", () => {
  assert.equal(m("text-[13px] sm:text-[22px] shadow-sm rounded-xl"), "text-ui sm:text-heading rounded-xl");
  assert.equal(m("shadow-2xl"), "shadow-overlay");
});

test("ambiguous or unsafe tokens are reported, not guessed", () => {
  const r = migrateClassString("text-slate-200 bg-[#123456] dark:bg-slate-800 text-[17px] bg-slate-900/80");
  assert.equal(r.value, "text-slate-200 bg-[#123456] dark:bg-slate-800 text-[17px] bg-slate-900/80");
  assert.deepEqual(r.unresolved, ["text-slate-200", "bg-[#123456]", "dark:bg-slate-800", "text-[17px]", "bg-slate-900/80"]);
});

test("allowed classes are untouched", () => {
  const v = "bg-panel border border-line bg-white/10 bg-emerald-400 bg-rose-500/10 bg-primary-500 p-4";
  assert.equal(m(v), v);
});

test("migrateSource only rewrites string literals and leaves a lint-clean file", () => {
  const src = [
    "// bg-white stays in comments",
    'const TONE = { ok: "bg-emerald-50 text-emerald-700" };',
    "export const Row = ({ on }) => (",
    '  <tr className={`border-b border-slate-100 ${on ? "bg-white dark:bg-slate-900" : "bg-slate-50"}`}>',
    "    <td>bg-white is prose</td>",
    "  </tr>",
    ");",
  ].join("\n");
  const { code, changes, unresolved } = migrateSource(src);
  assert.match(code, /\/\/ bg-white stays in comments/);
  assert.match(code, /<td>bg-white is prose<\/td>/);
  assert.match(code, /"bg-emerald-500\/10 text-tone-emerald"/);
  assert.match(code, /`border-b border-divider \$\{on \? "bg-panel" : "bg-field"\}`/);
  assert.equal(changes.length, 6);
  assert.deepEqual(unresolved, []);
  assert.deepEqual(analyse(code), []);
});

test("detectMode", () => {
  assert.equal(detectMode([{ src: '"bg-slate-900 bg-slate-800 bg-white"' }]), "dark");
  assert.equal(detectMode([{ src: '"bg-white bg-slate-50 dark:bg-slate-900"' }]), "light");
});
