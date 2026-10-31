#!/usr/bin/env node
// /semi-update helper: moves every app that uses @semi/ui to the latest release tag, refreshes the Semi rules block,
// prints the CHANGELOG of the skipped releases, runs their release migrations (node_modules/@semi/ui/migrations),
// then tsc. No audit, no refactor (that is /semi-audit + /semi-fix).
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { discoverFrontendApps } from "../../semi-audit/scripts/audit.mjs";
import { installSemiUi, installedSemiVersion, resolveTargetSpec, runLocal, wireAgentsMd } from "../../semi-init/scripts/setup.mjs";
import { cmpVersion, runMigrations } from "./migrate.mjs";

let cwd = process.cwd();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i] === "--cwd" && argv[i + 1]) cwd = resolve(argv[++i]);

const apps = discoverFrontendApps(cwd).filter((dir) => {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return Boolean(pkg.dependencies?.["@semi/ui"] || pkg.devDependencies?.["@semi/ui"]);
});
if (!apps.length) {
  console.error(`Không có app nào dùng @semi/ui dưới ${cwd}. App có sẵn: /semi-audit rồi /semi-fix. App mới: /semi-init.`);
  process.exit(1);
}

/** CHANGELOG sections of the releases after `from` up to `to`. */
function changelogBetween(text, from, to) {
  const parts = text.split(/^(?=## \[)/m);
  return parts
    .filter((p) => {
      const v = p.match(/^## \[(\d+\.\d+\.\d+)\]/)?.[1];
      return v && (!from || cmpVersion(v, from) > 0) && cmpVersion(v, to) <= 0;
    })
    .join("")
    .trim();
}

const { spec } = resolveTargetSpec();
let exitCode = 0;
let printedChangelog = false;

for (const appDir of apps) {
  const name = relative(cwd, appDir) || ".";
  const from = installedSemiVersion(appDir);
  console.log(`\n=== ${name}: @semi/ui ${from || "?"} → ${spec} ===`);
  if (!installSemiUi(appDir, spec)) {
    exitCode = 1;
    continue;
  }
  const to = installedSemiVersion(appDir);

  // Rules block in the app's AGENTS.md (and the workspace's, when the block lives there).
  const targets = [appDir, cwd].filter((d, i, a) => a.indexOf(d) === i && existsSync(join(d, "AGENTS.md")));
  for (const d of targets.length ? targets : [cwd]) wireAgentsMd(d, to);

  const changelogPath = join(appDir, "node_modules", "@semi", "ui", "CHANGELOG.md");
  if (!printedChangelog && existsSync(changelogPath)) {
    const notes = changelogBetween(readFileSync(changelogPath, "utf8"), from, to);
    if (notes) console.log(`\n--- CHANGELOG ${from || "?"} → ${to} ---\n${notes}\n`);
    printedChangelog = true;
  }

  if (!from) console.log(`${name}: không biết phiên bản cũ, bỏ qua migration (xem CHANGELOG).`);
  else if (cmpVersion(to, from) <= 0) console.log(`${name}: đã ở bản mới nhất (${to}).`);
  else {
    const done = await runMigrations({ appDir, dir: join(appDir, "node_modules", "@semi", "ui", "migrations"), from, to });
    if (!done.length) console.log(`${name}: các bản ${from} → ${to} không có migration.`);
    for (const m of done)
      console.log(`${name}: migration ${m.version} ${m.id} (${m.description}): ${m.changed.length ? m.changed.join(", ") : "không có gì để đổi"}`);
  }

  // Only checks the upgrade itself (an API the app uses changed and no migration covers it).
  if (runLocal(appDir, "tsc", ["--noEmit"]).status !== 0) exitCode = 1;
}

process.exit(exitCode);
