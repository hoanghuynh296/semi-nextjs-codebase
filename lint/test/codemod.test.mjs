// node --test lint/test — the /semi-new-app token codemod.
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectMode, detectTheme, migrateClassString, migrateSource } from "../codemod.mjs";
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
  assert.equal(m("text-[13px] sm:text-[22px] shadow-sm rounded-xl"), "text-ui sm:text-heading shadow-card rounded-card");
  assert.equal(m("rounded md:rounded-lg rounded-t-2xl hover:rounded-sm rounded-full"), "rounded-chip md:rounded-control rounded-t-panel hover:rounded-chip rounded-full");
  assert.deepEqual(migrateClassString("rounded-[10px]").unresolved, ["rounded-[10px]"]);
  assert.equal(m("h-[34px] sm:w-[34px] h-[36px]"), "h-control sm:w-control h-[36px]");
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

test("strings that are not class lists are never rewritten, and nothing is deduplicated (issue #11)", () => {
  const src = [
    'export const Icon = () => <svg viewBox="0 0 24 24"><path d="M 8 4 C 20 4, 34 4, 44 4" /></svg>;',
    'const style = { boxShadow: "inset 0 0 0 1px", transition: "opacity 0.2s ease, filter 0.2s ease" };',
    'const label = "Máy in và Job in";',
    'const shader = /* glsl */ `uniform vec3 white; // bg-white rounded`;',
    'const odd = "bg-white text-slate-900 = const x = bg-white";',
    'const dup = "p-2 bg-white p-2";',
  ].join("\n");
  const { code, skipped } = migrateSource(src);
  const lines = code.split("\n");
  assert.equal(lines.length, 6);
  for (const i of [0, 1, 2, 3, 4]) assert.equal(lines[i], src.split("\n")[i]);
  assert.equal(lines[5], 'const dup = "p-2 bg-panel p-2";');
  assert.deepEqual(skipped.map((s) => s.line), [5]);
});

test("token for token: whitespace and line breaks of a class string stay (issue #11)", () => {
  assert.equal(m("flex\n    bg-white\n    dark:bg-slate-900\n    p-4"), "flex\n    bg-panel\n    p-4");
  assert.equal(m("  bg-white  dark:bg-slate-900  text-slate-900  "), "  bg-panel  text-contrast  ");
  assert.equal(m("dark:bg-slate-900 bg-white"), "bg-panel");
});

test("dark apps: solid white / black are left for a person (issue #12)", () => {
  const r = migrateClassString("bg-white bg-black text-black text-white", "dark");
  assert.equal(r.value, "bg-white bg-black text-black text-contrast");
  assert.deepEqual(r.unresolved, ["bg-white", "bg-black", "text-black"]);
  assert.equal(m("bg-white text-black"), "bg-panel text-contrast");
});

test("detectTheme reads what the page paints (issue #12)", () => {
  const layout = { src: 'export default function L({ children }) { return <html lang="vi"><body className="min-h-full flex">{children}</body></html>; }' };
  const knobs = { src: '"bg-white bg-white bg-white bg-white bg-white"' };
  const darkCss = { p: "app/globals.css", css: true, src: "@theme { --color-app: #181818; --color-panel: #262626; }\nbody { background: var(--color-app); }" };
  assert.deepEqual(detectTheme([layout, darkCss, knobs]), { theme: "dark", evidence: "nền body #181818 (app/globals.css), --color-app: #181818" });
  const lightWithDarkMode = { css: true, src: ":root { --background: #ffffff; }\n@media (prefers-color-scheme: dark) { :root { --background: #0a0a0a; } }\nbody { background: var(--background); }" };
  assert.equal(detectTheme([layout, lightWithDarkMode]).theme, "light");
  assert.equal(detectTheme([{ src: '<html className="dark"><body>' }, { css: true, src: "body { background: #fff; }" }]).theme, "dark");
  assert.equal(detectTheme([{ src: '<ThemeProvider defaultTheme="dark">' + "<html>" }]).theme, "dark");
  assert.equal(detectTheme([{ css: true, src: "html { background: #111; }\nbody { background: #fff; }" }]).theme, "unknown");
  assert.equal(detectTheme([{ src: '"bg-white bg-slate-900"' }]).theme, "unknown");
  assert.equal(detectTheme([]).theme, "unknown");
});
