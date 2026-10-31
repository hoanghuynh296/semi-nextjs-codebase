// node --test lint/test — class-token analysis behind semi-lint, /semi-audit and the /semi-init codemod.
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse, colourRule, extractStrings, splitToken } from "../classes.mjs";

const rules = (src, opts) => analyse(src, opts).map((f) => `${f.rule}:${f.token}`);

test("splitToken strips variants, arbitrary variants and important", () => {
  assert.deepEqual(splitToken("md:hover:!bg-white"), { variants: ["md", "hover"], utility: "bg-white", important: true });
  assert.equal(splitToken("[&>*:hover]:border-slate-200").utility, "border-slate-200");
  assert.equal(splitToken("group-hover:text-primary-300").utility, "text-primary-300");
});

test("issues #1–#4: every prefix that takes a colour is covered", () => {
  for (const u of ["border-slate-50", "border-b-gray-100", "divide-slate-100", "from-white", "via-gray-50", "to-slate-900", "ring-zinc-200", "outline-gray-300", "fill-white", "stroke-slate-400", "placeholder-gray-400", "shadow-black", "ring-offset-white", "decoration-slate-300", "caret-black", "accent-gray-500"]) {
    assert.equal(colourRule(u), "no-literal-palette", u);
  }
  for (const u of ["bg-purple-50", "border-amber-200", "divide-sky-100", "ring-emerald-100", "border-t-rose-100"]) {
    assert.equal(colourRule(u), "no-solid-pastel-surfaces", u);
  }
});

test("allowed colours stay allowed", () => {
  for (const u of ["bg-panel", "text-muted", "border-line", "bg-white/10", "bg-black/40", "bg-purple-500/10", "border-amber-500/20", "bg-emerald-400", "bg-primary-500", "text-accent-fg", "text-tone-sky", "bg-danger-bg", "text-on-accent", "ring-primary-500/50"]) {
    assert.equal(colourRule(u), null, u);
  }
});

test("chromatic text shades are flagged in any variant", () => {
  assert.deepEqual(rules('<p className="text-emerald-400 dark:text-sky-300 hover:fill-amber-500" />'), [
    "no-fixed-tone-text:text-emerald-400",
    "no-fixed-tone-text:dark:text-sky-300",
    "no-fixed-tone-text:hover:fill-amber-500",
  ]);
});

test("arbitrary colours, text sizes and literal colours", () => {
  assert.deepEqual(rules('const a = "bg-[#fff] text-[rgb(0,0,0)] text-[13px] text-[0.8rem]";'), [
    "hex-colour-class:bg-[#fff]",
    "hex-colour-class:text-[rgb(0,0,0)]",
    "arbitrary-text-size:text-[13px]",
    "arbitrary-text-size:text-[0.8rem]",
  ]);
  assert.deepEqual(rules('<div style={{ color: "#ffffff", background: "rgb(0 0 0 / .5)" }} />'), [
    "literal-colour-value:#ffffff",
    "literal-colour-value:rgb(0 0 0 / .5)",
  ]);
});

test("classes outside className are found: constants, cn() args, objects, templates", () => {
  const src = [
    'const TONE = { a: "bg-white", b: `border ${on ? "border-slate-200" : "border-line"}` };',
    'cn("p-4", active && "text-gray-900")',
    "const t = `rounded-xl ${x} divide-gray-100`;",
  ].join("\n");
  assert.deepEqual(
    analyse(src).map((f) => `${f.line}:${f.token}`),
    ["1:bg-white", "1:border-slate-200", "2:text-gray-900", "3:divide-gray-100"],
  );
});

test("comments, JSX text, closing tags and regex literals do not hide or invent classes", () => {
  const src = [
    "// bg-white in a comment",
    "/* text-slate-900 */",
    '<span>bg-white is prose</span><span className="bg-slate-50" />',
    'const re = /"bg-white"/; const ok = "bg-panel";',
    '{items.map((i) => <Icon key={i} />)}<b className="text-white" />',
    "const half = a / 2; const s = 'border-gray-200';",
  ].join("\n");
  assert.deepEqual(
    analyse(src).map((f) => `${f.line}:${f.token}`),
    ["3:bg-slate-50", "5:text-white", "6:border-gray-200"],
  );
});

test("CSS: only @apply is read", () => {
  assert.deepEqual(rules(".a { color: #fff; @apply bg-white text-muted; }", { css: true }), ["no-literal-palette:bg-white"]);
});

test("extractStrings keeps line numbers across template literals", () => {
  const s = extractStrings('a\n`x\n${"y"}\nz`');
  assert.deepEqual(s.map((x) => [x.value.trim(), x.line]), [["x", 2], ["y", 3], ["z", 3]]);
});
