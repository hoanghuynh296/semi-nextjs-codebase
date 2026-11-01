#!/usr/bin/env node
// /semi-update helper: moves every app that uses @semi/ui to the latest release tag, refreshes the Semi rules block,
// prints the CHANGELOG of the skipped releases, runs their release migrations (node_modules/@semi/ui/migrations),
// then tsc. No audit, no refactor (that is /semi-audit + /semi-fix).
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { discoverFrontendApps } from "../../semi-audit/scripts/audit.mjs";
import {
  appFonts,
  cmpSemver,
  gitTags,
  installPackage,
  installSemiUi,
  installedSemiVersion,
  missingStyleFonts,
  parseGithubSpec,
  readBrand,
  readStyleState,
  resolveTargetSpec,
  runLocal,
  semiStyles,
  styleFontHint,
  wireAgentsMd,
  wireBrand,
} from "../../semi-init/scripts/setup.mjs";
import { cmpVersion, runMigrations } from "./migrate.mjs";

let cwd = process.cwd();
const argv = process.argv.slice(2);
let acceptMajor = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cwd" && argv[i + 1]) cwd = resolve(argv[++i]);
  else if (argv[i] === "--accept-major") acceptMajor = true;
}

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

let exitCode = 0;
let printedChangelog = false;

for (const appDir of apps) {
  const name = relative(cwd, appDir) || ".";
  // Brand kit first (docs/BRANDS.md): its newest tag, unless that is a major change the user has not accepted; its
  // "semi" range then caps which @semi/ui this app may get.
  const brand = readBrand(appDir);
  if (brand) {
    const pkgJson = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
    const depSpec = pkgJson.dependencies?.[brand.pkg] ?? pkgJson.devDependencies?.[brand.pkg];
    const gh = depSpec ? parseGithubSpec(depSpec) : null;
    const current = brand.kit ? JSON.parse(readFileSync(join(brand.dir, "package.json"), "utf8")).version : null;
    const tags = gh ? gitTags(gh.url) : null;
    const latest = tags?.length ? tags[tags.length - 1].replace(/^v/, "") : null;
    if (gh && latest && current && cmpSemver(latest, current) <= 0) console.log(`${name}: brand ${brand.pkg} đã mới nhất (${current}).`);
    else if (gh && latest && current && +latest.split(".")[0] > +current.split(".")[0] && !acceptMajor) {
      console.log(`${name}: brand ${brand.pkg} ${current} → ${latest} là bản major (màu / font thương hiệu đổi, giao diện đổi). Hỏi người dùng; đồng ý thì chạy lại với --accept-major. Lần này giữ ${current}.`);
    } else if (depSpec) {
      const next = gh && latest ? `${gh.base}#v${latest}` : depSpec; // file: kits are simply reinstalled
      console.log(`${name}: brand ${brand.pkg} ${current || "?"} → ${latest || "bản mới nhất ở " + depSpec}`);
      if (!installPackage(appDir, next).ok) exitCode = 1;
    }
  }
  const kit = readBrand(appDir)?.kit ?? null;
  const target = resolveTargetSpec({ range: kit?.semi });
  const spec = target.spec;
  if (target.limited) console.log(`${name}: brand ${kit.name} chỉ hỗ trợ @semi/ui ${kit.semi}: giữ ${target.version} (mới nhất là ${target.newest}). Chạy /semi-brand update trong repo brand, phát hành, rồi /semi-update lại.`);

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

  // The app keeps its style; a release that renames or drops one ships a migration for it, so this only warns.
  const style = readStyleState(appDir).declared;
  const styles = semiStyles(appDir);
  if (style && styles && !styles.styles.some((s) => s.id === style))
    console.log(`${name}: style "${style}" không còn trong ${to} (${styles.styles.map((s) => s.id).join(", ")}): chọn style khác (nhờ agent đổi style).`);

  // Re-wire the brand (brand.css import, rules block) and say which fonts the layout still needs.
  if (kit) {
    const w = wireBrand(appDir, cwd, readBrand(appDir).pkg);
    if (!w.ok) exitCode = 1;
    const st = readStyleState(appDir);
    const chosen = semiStyles(appDir)?.styles.find((s) => s.id === st.declared);
    if (chosen && st.layout && missingStyleFonts(appDir, chosen).length) console.log(`${name}: ${styleFontHint(st.layout, chosen, appFonts(appDir, chosen))}`);
  }

  // Only checks the upgrade itself (an API the app uses changed and no migration covers it).
  if (runLocal(appDir, "tsc", ["--noEmit"]).status !== 0) exitCode = 1;
}

process.exit(exitCode);
