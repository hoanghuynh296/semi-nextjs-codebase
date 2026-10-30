#!/usr/bin/env node
// /semi-update helper: upgrades @semi/ui to the latest tag (or SEMI_UI_SOURCE), updates AGENTS.md, runs semi-lint + tsc.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_URL = "https://github.com/hoanghuynh296/semi-nextjs-codebase.git";
const GITHUB_SPEC_BASE = "github:hoanghuynh296/semi-nextjs-codebase";

function parseArgs(argv) {
  let cwd = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cwd" && argv[i + 1]) cwd = resolve(argv[++i]);
  }
  if (!existsSync(join(cwd, "package.json")) && existsSync(join(cwd, "web", "package.json"))) {
    cwd = join(cwd, "web");
  }
  return { cwd };
}

function detectPkgManager(cwd) {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

function resolveTargetSpec() {
  if (process.env.SEMI_UI_SOURCE) {
    return { spec: process.env.SEMI_UI_SOURCE, version: "local" };
  }
  const ls = spawnSync("git", ["ls-remote", "--tags", "--refs", REPO_URL], { encoding: "utf8", timeout: 15000 });
  if (ls.status !== 0) {
    console.error(
      "ERROR: Cannot access private repository https://github.com/hoanghuynh296/semi-nextjs-codebase.\n" +
        "Action required: Run `gh auth login && gh auth setup-git` (or add your SSH key to GitHub), then re-run `/semi-update`.",
    );
    process.exit(2);
  }
  const tags = (ls.stdout || "")
    .split(/\r?\n/)
    .map((l) => l.split("refs/tags/")[1])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const latest = tags[tags.length - 1] || "main";
  return { spec: `${GITHUB_SPEC_BASE}#${latest}`, version: latest };
}

const { cwd } = parseArgs(process.argv.slice(2));
const pkgPath = join(cwd, "package.json");
if (!existsSync(pkgPath)) {
  console.error(`No package.json found in ${cwd}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const oldSpec = pkg.dependencies?.["@semi/ui"] || pkg.devDependencies?.["@semi/ui"] || "none";
const { spec, version } = resolveTargetSpec();

console.log(`Updating @semi/ui in ${cwd}: ${oldSpec} -> ${spec}`);
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies["@semi/ui"] = spec;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const pm = detectPkgManager(cwd);
const installArgs = pm === "npm" ? ["install", "--install-links"] : ["add", `@semi/ui@${spec}`];
const inst = spawnSync(pm, installArgs, { cwd, stdio: "inherit" });
if (inst.status !== 0) process.exit(inst.status || 1);

const installedPkgPath = join(cwd, "node_modules", "@semi", "ui", "package.json");
const installedVersion = existsSync(installedPkgPath)
  ? JSON.parse(readFileSync(installedPkgPath, "utf8")).version
  : version;

for (const candidate of [join(cwd, "AGENTS.md"), join(cwd, "..", "AGENTS.md")]) {
  if (existsSync(candidate)) {
    const content = readFileSync(candidate, "utf8");
    const updated = content.replace(/Semi Design System \(`@semi\/ui`[^)]*\)/g, `Semi Design System (\`@semi/ui\` v${installedVersion})`);
    if (updated !== content) writeFileSync(candidate, updated);
  }
}

const changelogPath = join(cwd, "node_modules", "@semi", "ui", "CHANGELOG.md");
if (existsSync(changelogPath)) {
  console.log("\n--- CHANGELOG.md ---");
  console.log(readFileSync(changelogPath, "utf8").slice(0, 2000));
}

const lintRes = spawnSync("npx", ["semi-lint"], { cwd, stdio: "inherit" });
const tscRes = spawnSync("npx", ["tsc", "--noEmit"], { cwd, stdio: "inherit" });
process.exit(lintRes.status || tscRes.status || 0);
