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
