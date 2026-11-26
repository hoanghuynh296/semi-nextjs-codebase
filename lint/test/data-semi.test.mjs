// Every exported component marks its root element with data-semi="<Name>" (docs/DESIGN_SYSTEM.md "data-semi"), the
// debugging / test hook the docs inspector reads (#194). A new component without it fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const { components } = JSON.parse(readFileSync(join(root, "components.json"), "utf8"));

/** Render no element of their own: context providers and the inline theme script. */
const NO_DOM = new Set(["ThemeProvider", "ThemeScript", "SemiLocaleProvider", "PageActionsProvider"]);

test("every exported component carries data-semi with its name", () => {
  const missing = [];
  for (const c of components) {
    if (NO_DOM.has(c.name)) continue;
    const src = readFileSync(join(root, c.module), "utf8");
    // on its root element, or as the default of the SemiName prop a wrapping Semi component overrides
    if (!src.includes(`data-semi="${c.name}"`) && !src.includes(`"data-semi": semi = "${c.name}"`)) missing.push(`${c.module}: ${c.name}`);
  }
  assert.deepEqual(missing, []);
});

test("data-semi is never a styling hook", () => {
  const hits = [];
  for (const dir of ["src", "styles"]) {
    for (const f of readdirSync(join(root, dir))) {
      if (!/\.(tsx?|css)$/.test(f)) continue;
      const src = readFileSync(join(root, dir, f), "utf8");
      if (/\[data-semi[=\]]|data-\[semi/.test(src)) hits.push(`${dir}/${f}`);
    }
  }
  assert.deepEqual(hits, []);
});
