// ds#214: @semi/ui ships source, so an app's tsc checks src/ with the app's globals. Cloudflare Workers apps load a global
// `interface Element` (HTMLRewriter) that merges with the DOM one; tests/types/workers-element.d.ts stands in for it and
// tsconfig.workers.json checks src/ + styles/ under that merge (no dependency on the real types). Catches e.g. an
// expression-bodied effect cleanup `() => el.removeAttribute(x)`, which then returns Element instead of void.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = join(import.meta.dirname, "../..");

test("src/ and styles/ type-check with the Cloudflare Workers global Element merged in", () => {
  const tsc = join(root, "node_modules/typescript/bin/tsc");
  const r = spawnSync(process.execPath, [tsc, "--noEmit", "-p", "tsconfig.workers.json"], { cwd: root, encoding: "utf8" });
  assert.ifError(r.error);
  assert.equal(r.status, 0, `tsc -p tsconfig.workers.json failed:\n${r.stdout}${r.stderr}`);
});
