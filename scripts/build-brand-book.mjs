#!/usr/bin/env node
// Builds the brand book of a sample kit (tests/fixtures/brand.json) from this checkout, the way /semi-brand does in a
// real kit repo, and exports it to out-brand/ for the browser checks (npm run test:ui, tests/brand-book.spec.ts).
// The kit lives in .brand-book/ (gitignored) and installs this checkout as @semi/ui.
import { cpSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const kit = join(root, ".brand-book");
const out = join(root, "out-brand");
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

rmSync(kit, { recursive: true, force: true });
run("node", [join(root, "plugin/skills/semi-brand/scripts/brand.mjs"), "create", "--cwd", kit, "--from", join(root, "tests/fixtures/brand.json")], {
  env: { ...process.env, SEMI_UI_SOURCE: `file:${root}` },
});
run(join(kit, "node_modules/.bin/semi-brand"), ["site"], { cwd: kit, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
rmSync(out, { recursive: true, force: true });
if (!existsSync(join(kit, ".preview/out"))) process.exit(1);
cpSync(join(kit, ".preview/out"), out, { recursive: true });
console.log(`brand book: ${out}`);
