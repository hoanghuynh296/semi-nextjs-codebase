#!/usr/bin/env node
// /semi-update helper: upgrades @semi/ui to the latest tag across single-app or monorepo projects, prints CHANGELOG, runs tsc, then audits (semi-audit.md) so /semi-fix can fix what the new release flags.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { auditProject, discoverFrontendApps, formatSummary, writeAuditFile } from "../../semi-audit/scripts/audit.mjs";

const REPO_URL = "https://github.com/hoanghuynh296/semi-nextjs-codebase.git";
const GITHUB_SPEC_BASE = "github:hoanghuynh296/semi-nextjs-codebase";

function parseArgs(argv) {
  let cwd = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cwd" && argv[i + 1]) cwd = resolve(argv[++i]);
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
  return { spec: `${GITHUB_SPEC_BASE}#${latest}`, version: latest.replace(/^v/, "") };
}

const { cwd } = parseArgs(process.argv.slice(2));
const allApps = discoverFrontendApps(cwd);
if (allApps.length === 0) {
  console.error(`No frontend package.json found under ${cwd}. Run /semi-init first.`);
  process.exit(1);
}

// Prefer apps that already have @semi/ui installed; if none do, update all discovered frontend apps
const semiApps = allApps.filter((dir) => {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return Boolean(pkg.dependencies?.["@semi/ui"] || pkg.devDependencies?.["@semi/ui"]);
});
const targetApps = semiApps.length > 0 ? semiApps : allApps;

const { spec, version } = resolveTargetSpec();
let exitCode = 0;
let printedChangelog = false;

for (const appDir of targetApps) {
  const pkgPath = join(appDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const oldSpec = pkg.dependencies?.["@semi/ui"] || pkg.devDependencies?.["@semi/ui"] || "none";

  console.log(`\n=== Updating @semi/ui in ${appDir}: ${oldSpec} -> ${spec} ===`);
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies["@semi/ui"] = spec;
  pkg.scripts = pkg.scripts || {};
  pkg.scripts["semi:lint"] = "semi-lint";
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const pm = detectPkgManager(appDir);
  const installArgs = pm === "npm" ? ["install", "--install-links"] : ["add", `@semi/ui@${spec}`];
  const inst = spawnSync(pm, installArgs, { cwd: appDir, stdio: "inherit" });
  if (inst.status !== 0) {
    exitCode = inst.status || 1;
    continue;
  }

  const installedPkgPath = join(appDir, "node_modules", "@semi", "ui", "package.json");
  const installedVersion = existsSync(installedPkgPath)
    ? JSON.parse(readFileSync(installedPkgPath, "utf8")).version
    : version;

  // Refresh the managed rules block from this plugin's template (the npm package does not ship plugin/).
  const rulesTemplatePath = fileURLToPath(new URL("../../../rules/AGENTS.md", import.meta.url));
  const stamp = (s) =>
    s.replace(
      /Semi Design System \(`@semi\/ui`[^)]*\)/g,
      `Semi Design System (\`@semi/ui\` v${installedVersion}, repo \`https://github.com/hoanghuynh296/semi-nextjs-codebase\`)`,
    );
  const freshBlock = existsSync(rulesTemplatePath) ? stamp(readFileSync(rulesTemplatePath, "utf8")).trim() : null;
  const BLOCK_RE = /<!-- semi-design-system:start -->[\s\S]*?<!-- semi-design-system:end -->/;
  for (const candidate of new Set([join(appDir, "AGENTS.md"), join(cwd, "AGENTS.md")])) {
    if (!existsSync(candidate)) continue;
    const content = readFileSync(candidate, "utf8");
    const updated = freshBlock && BLOCK_RE.test(content) ? content.replace(BLOCK_RE, () => freshBlock) : stamp(content);
    if (updated !== content) {
      writeFileSync(candidate, updated);
      console.log(`Refreshed Semi rules block in ${candidate}`);
    }
  }

  if (!printedChangelog) {
    const changelogPath = join(appDir, "node_modules", "@semi", "ui", "CHANGELOG.md");
    if (existsSync(changelogPath)) {
      console.log("\n--- CHANGELOG.md ---");
      console.log(readFileSync(changelogPath, "utf8").slice(0, 2500));
      printedChangelog = true;
    }
  }

  // tsc catches breaking API changes; new lint rules are reported by the audit below and fixed with /semi-fix.
  const tscRes = spawnSync("npx", ["tsc", "--noEmit"], { cwd: appDir, stdio: "inherit" });
  if (tscRes.status !== 0) exitCode = tscRes.status || 1;
}

const report = auditProject(cwd);
const written = writeAuditFile(report, resolve(cwd));
console.log("\n" + formatSummary(report, written || "semi-audit.md"));

process.exit(exitCode);
