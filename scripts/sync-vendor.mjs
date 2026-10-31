#!/usr/bin/env node
// The plugin ships on its own (marketplace source ./plugin), so /semi-audit carries copies of the lint and tokens.
// This keeps those copies byte-identical to the sources.
//   node scripts/sync-vendor.mjs           copy lint/semi-lint.mjs + tokens/tokens.json into the plugin
//   node scripts/sync-vendor.mjs --check   exit 1 when a copy is stale (npm run check)
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const VENDOR = "plugin/skills/semi-audit/scripts/vendor";
const COPIES = [
  ["lint/semi-lint.mjs", `${VENDOR}/semi-lint.mjs`],
  ["tokens/tokens.json", `${VENDOR}/tokens.json`],
];

const check = process.argv.includes("--check");
const stale = [];
for (const [src, dst] of COPIES) {
  const same = existsSync(join(root, dst)) && readFileSync(join(root, src), "utf8") === readFileSync(join(root, dst), "utf8");
  if (same) continue;
  if (check) stale.push(dst);
  else {
    copyFileSync(join(root, src), join(root, dst));
    console.log(`synced ${dst}`);
  }
}
if (stale.length) {
  console.error(`stale plugin copies (run node scripts/sync-vendor.mjs):\n  ${stale.join("\n  ")}`);
  process.exit(1);
}
if (check) console.log("plugin vendor copies up to date");
