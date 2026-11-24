#!/usr/bin/env node
// One version for the package and the plugin (AGENTS.md rule 5).
//   node scripts/bump-version.mjs 0.4.0   write it to every manifest, move the marketplace pin to v0.4.0, then rebuild
//                                         tokens.css (it stamps the version)
//   node scripts/bump-version.mjs --check exit 1 when the manifests or the pin disagree (npm run check)
// The marketplace installs the plugin from the release tag ("ref" of its git-subdir source, docs/PLUGIN.md), never from
// main, so apps on an older @semi/ui never get rules written for an unreleased one. Push the tag right after the bump.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const write = (p, data) => writeFileSync(join(root, p), JSON.stringify(data, null, 2) + "\n");

// [file, get, set]
const semiDesign = (d) => d.plugins.find((p) => p.name === "semi-design");
const pinnedVersion = (d) => {
  const src = semiDesign(d).source;
  return src?.ref ? src.ref.replace(/^v/, "") : `${JSON.stringify(src)}, not pinned to a release tag (docs/PLUGIN.md)`;
};
const MANIFESTS = [
  ["package.json", (d) => d.version, (d, v) => (d.version = v)],
  ["package-lock.json", (d) => d.version, (d, v) => ((d.version = v), (d.packages[""].version = v))],
  ["plugin/plugin.json", (d) => d.version, (d, v) => (d.version = v)],
  ["plugin/.claude-plugin/plugin.json", (d) => d.version, (d, v) => (d.version = v)],
  [".claude-plugin/marketplace.json", (d) => semiDesign(d).version, (d, v) => (semiDesign(d).version = v)],
  // the pin: the plugin comes from the tag of this version
  [".claude-plugin/marketplace.json (source.ref)", pinnedVersion, (d, v) => (semiDesign(d).source.ref = `v${v}`)],
];
const fileOf = (p) => p.replace(/ \(.*\)$/, "");

const arg = process.argv[2];
if (!arg || arg === "--check") {
  const versions = MANIFESTS.map(([p, get]) => [p, get(read(fileOf(p)))]);
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
  const data = read(fileOf(p));
  set(data, arg);
  write(fileOf(p), data);
  console.log(`${p} → ${arg}`);
}
console.log(`marketplace now installs the plugin from tag v${arg}: merge, then push the tag right away (installs fail until it exists).`);
const res = spawnSync(process.execPath, [join(root, "scripts/build-tokens.mjs")], { stdio: "inherit" });
process.exit(res.status ?? 1);
