#!/usr/bin/env node
// One version for the package and the plugin (AGENTS.md rule 5).
//   node scripts/bump-version.mjs 0.4.0   write it to every manifest, then rebuild tokens.css (it stamps the version)
//   node scripts/bump-version.mjs --check exit 1 when the manifests disagree (npm run check)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const write = (p, data) => writeFileSync(join(root, p), JSON.stringify(data, null, 2) + "\n");

// [file, get, set]
const MANIFESTS = [
  ["package.json", (d) => d.version, (d, v) => (d.version = v)],
  ["package-lock.json", (d) => d.version, (d, v) => ((d.version = v), (d.packages[""].version = v))],
  ["plugin/plugin.json", (d) => d.version, (d, v) => (d.version = v)],
  ["plugin/.claude-plugin/plugin.json", (d) => d.version, (d, v) => (d.version = v)],
  [".claude-plugin/marketplace.json", (d) => d.plugins.find((p) => p.name === "semi-design").version, (d, v) => (d.plugins.find((p) => p.name === "semi-design").version = v)],
];

const arg = process.argv[2];
if (!arg || arg === "--check") {
  const versions = MANIFESTS.map(([p, get]) => [p, get(read(p))]);
  const expected = versions[0][1];
  const off = versions.filter(([, v]) => v !== expected);
  if (off.length) {
    console.error(`version mismatch (package.json is ${expected}):\n${off.map(([p, v]) => `  ${p}: ${v}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`versions in sync (${expected})`);
  process.exit(0);
}

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(arg)) {
  console.error(`not a semver version: ${arg}`);
  process.exit(1);
}
for (const [p, , set] of MANIFESTS) {
  const data = read(p);
  set(data, arg);
  write(p, data);
  console.log(`${p} → ${arg}`);
}
const res = spawnSync(process.execPath, [join(root, "scripts/build-tokens.mjs")], { stdio: "inherit" });
process.exit(res.status ?? 1);
