// The a11y audit's contract outside the browser (its behaviour on pages is tests/a11y.spec.ts, in test:ui): every rule
// it reports is documented, the source a browser tool evaluates parses on its own, and the CLI explains itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { A11Y_RULES, a11yAudit, a11ySnippet } from "../a11y.mjs";

const root = join(import.meta.dirname, "../..");
const source = readFileSync(join(root, "lint/a11y.mjs"), "utf8");
const design = readFileSync(join(root, "docs/DESIGN_SYSTEM.md"), "utf8");

test("a11y: every rule it reports has a text and a row in DESIGN_SYSTEM.md §18", () => {
  const section = design.slice(design.indexOf("## 18."), design.indexOf("## 19."));
  const reported = new Set([...source.matchAll(/hit\("([a-z-]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...reported].sort(), A11Y_RULES.map(([id]) => id).sort());
  for (const [id] of A11Y_RULES) assert.match(section, new RegExp(`\\| \`${id}\` \\|`), `${id} missing from §18`);
});

test("a11y: the audit is self-contained, so a browser tool can evaluate its source", () => {
  assert.doesNotThrow(() => new Function(`return ${a11ySnippet({ scope: "main" })}`));
  const body = a11yAudit.toString();
  assert.doesNotMatch(body, /\b(?:import|require)\s*\(|A11Y_RULES|runA11y|a11ySnippet|chromium/);
});

test("a11y: the CLI prints its usage, and --snippet the expression", () => {
  const cli = (args) => spawnSync(process.execPath, [join(root, "cli/semi.mjs"), "a11y", ...args], { encoding: "utf8" });
  const help = cli([]);
  assert.equal(help.status, 2);
  assert.match(help.stdout, /semi a11y <url…>/);
  assert.match(cli(["--snippet", "--scope", "#app"]).stdout, /^\(function a11yAudit\(opts\)[\s\S]*\(\{"scope":"#app"\}\)\s*$/);
});

test("a11y: focus-ring compares a control with itself unfocused, so a dialog's first control that already has focus passes, and a control with no ring still fails (#126)", async (t) => {
  const { chromium } = await import("../density.mjs");
  const pw = await chromium();
  const browser = pw && (await pw.launch({ channel: "chrome" }).catch(() => pw.launch().catch(() => null)));
  if (!browser) return t.skip("no Chrome / Playwright browser here");
  await browser.close();
  const page = (hash) => `file://${join(root, "lint/test/fixtures/a11y-focus-ring.html")}#${hash}`;
  const run = (url) => {
    const r = spawnSync(process.execPath, [join(root, "cli/semi.mjs"), "a11y", url, "--json", "--no-axe", "--theme", "light", "--width", "1280"], { encoding: "utf8" });
    return JSON.parse(r.stdout)[0].hits.map((h) => `${h.rule} ${h.where}: ${h.value}`);
  };
  for (const focused of ["close", "no-ring"])
    assert.deepEqual(run(page(focused)), ["focus-ring button#no-ring: nothing changes when it takes keyboard focus"], `focus on #${focused} when the audit starts`);
  // a control that takes focus back on blur has no unfocused baseline: it is reported, never left out
  assert.ok(run(page("trap")).some((h) => /^focus-ring button#close: focus could not be moved off it/.test(h)), "the refocusing button is reported");
});
