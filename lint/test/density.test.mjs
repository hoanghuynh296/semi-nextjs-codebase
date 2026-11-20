// The density audit's contract outside the browser (its behaviour on pages is tests/density.spec.ts, in test:ui):
// every budget it reports is documented, the source a browser tool evaluates parses on its own, and the CLI explains
// itself without Playwright.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { DENSITY_RULES, densityAudit, densitySnippet } from "../density.mjs";

const root = join(import.meta.dirname, "../..");
const source = readFileSync(join(root, "lint/density.mjs"), "utf8");
const design = readFileSync(join(root, "docs/DESIGN_SYSTEM.md"), "utf8");

test("density: every rule it reports has a budget text and a row in DESIGN_SYSTEM.md §4c", () => {
  const section = design.slice(design.indexOf("## 4c."), design.indexOf("## 5. Card"));
  const reported = new Set([...source.matchAll(/hit\("([a-z-]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...reported].sort(), DENSITY_RULES.map(([id]) => id).sort());
  for (const [id] of DENSITY_RULES) assert.match(section, new RegExp(`\\| \`${id}\` \\|`), `${id} missing from §4c`);
});

test("density: the audit is self-contained, so a browser tool can evaluate its source", () => {
  assert.doesNotThrow(() => new Function(`return ${densitySnippet({ scope: "main" })}`));
  // Only browser globals: no import, require or reference to this module's other names.
  const body = densityAudit.toString();
  assert.doesNotMatch(body, /\b(?:import|require)\s*\(|DENSITY_RULES|runDensity|densitySnippet/);
});

test("density: the CLI prints its usage, and --snippet the expression", () => {
  const cli = (args) => spawnSync(process.execPath, [join(root, "cli/semi.mjs"), "density", ...args], { encoding: "utf8" });
  const help = cli([]);
  assert.equal(help.status, 2);
  assert.match(help.stdout, /semi density <url…>/);
  assert.match(cli(["--snippet", "--scope", "#app"]).stdout, /^\(function densityAudit\(opts\)[\s\S]*\(\{"scope":"#app"\}\)\s*$/);
});
