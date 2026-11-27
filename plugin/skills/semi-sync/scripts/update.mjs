#!/usr/bin/env node
// /semi-sync helper: moves every app that uses @semi/ui to the latest release tag, refreshes the Semi rules block,
// prints the CHANGELOG of the skipped releases, runs their release migrations (node_modules/@semi/ui/migrations),
// then tsc. No audit, no refactor (that is /semi-check).
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { discoverFrontendApps } from "../../semi-check/scripts/audit.mjs";
import {
  addPackageCommand,
  appFonts,
  cmpSemver,
  GITHUB_SPEC_BASE,
  gitTags,
  installPackage,
  installSemiUi,
  installedSemiVersion,
  fontHint,
  missingFonts,
  parseGithubSpec,
  readBrand,
  readLookState,
  resolveTargetSpec,
  runLocal,
  satisfies,
  wireAgentsMd,
  wireBrand,
} from "../../semi-new-app/scripts/setup.mjs";
import { changelogBetween, cmpVersion, runMigrations } from "./migrate.mjs";

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
  console.error(`Không có app nào dùng @semi/ui dưới ${cwd}. App có sẵn: /semi-check. App mới: /semi-new-app.`);
  process.exit(1);
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
      const inst = installPackage(appDir, next);
      if (!inst.ok) {
        exitCode = 1;
        console.log(`${name}: không cài được brand ${brand.pkg}. Tự chạy trong ${appDir}: ${inst.cmd ?? addPackageCommand(appDir, next).cmd}`);
      }
    }
  }
  const kit = readBrand(appDir)?.kit ?? null;
  const target = resolveTargetSpec({ range: kit?.semi });
  const from = installedSemiVersion(appDir);
  // Never move @semi/ui backwards: a brand range, or a plugin, older than the installed version keeps the installed one.
  const downgrade = Boolean(from && cmpSemver(target.version, from) < 0);
  const spec = downgrade ? `${GITHUB_SPEC_BASE}#v${from}` : target.spec;
  if (downgrade && !(kit && !satisfies(from, kit.semi)))
    console.log(`${name}: @semi/ui ${from} mới hơn bản plugin semi-design này hỗ trợ (${target.version}): KHÔNG hạ cấp, giữ ${from}. Cập nhật plugin: /plugin marketplace update semi-marketplace, rồi /semi-sync lại.`);
  else if (downgrade)
    console.log(`${name}: brand ${kit.name} khai báo @semi/ui ${kit.semi}, thấp hơn bản đang cài ${from}: KHÔNG hạ cấp, giữ ${from} (mới nhất là ${target.newest}). Sửa: chạy /semi-brand update trong repo brand (ghi dải ">=X.Y.0 <1.0.0"), phát hành, rồi /semi-sync lại.`);
  else if (target.limited) console.log(`${name}: brand ${kit.name} chỉ hỗ trợ @semi/ui ${kit.semi}: giữ ${target.version} (mới nhất là ${target.newest}). Chạy /semi-brand update trong repo brand, phát hành, rồi /semi-sync lại.`);
  else if (target.pluginBehind) console.log(`${name}: đã có @semi/ui ${target.newest}, nhưng plugin semi-design này viết cho ${target.version}: giữ ${target.version}. Cập nhật plugin (/plugin marketplace update semi-marketplace), rồi /semi-sync lại.`);

  console.log(`\n=== ${name}: @semi/ui ${from || "?"} → ${downgrade ? from : spec} ===`);
  // On a downgrade guard the installed copy is kept as it is (reinstalled only when it is missing from node_modules).
  let installed = downgrade && existsSync(join(appDir, "node_modules", "@semi", "ui", "package.json")) ? true : installSemiUi(appDir, spec);
  if (!installed) {
    exitCode = 1;
    const appPkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
    const manual = addPackageCommand(appDir, `@semi/ui@${spec}`, { dev: Boolean(appPkg.devDependencies?.["@semi/ui"]) }).cmd;
    console.log(
      `${name}: cài @semi/ui lỗi nên package.json giữ nguyên. Tự chạy trong ${appDir}: ${manual}\n` +
        `Rồi chạy lại /semi-sync để có CHANGELOG, migration và tsc. Các bước không cần bản cài vẫn chạy bên dưới.`,
    );
  }
  const to = installed ? installedSemiVersion(appDir) : target.version;

  // Rules block in the app's AGENTS.md (and the workspace's, when the block lives there).
  const targets = [appDir, cwd].filter((d, i, a) => a.indexOf(d) === i && existsSync(join(d, "AGENTS.md")));
  for (const d of targets.length ? targets : [cwd]) wireAgentsMd(d, to);

  // Everything below needs the new @semi/ui on disk.
  if (!installed) continue;

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
    for (const m of done) {
      console.log(`${name}: migration ${m.version} ${m.id} (${m.description}): ${m.changed.length ? m.changed.join(", ") : "không có gì để đổi"}`);
      for (const f of m.flags ?? []) console.log(`  cần sửa tay: ${f.file}: ${f.message}`);
    }
  }

  // Since 1.0 Semi has one look: a style left in semi-lint.json (the 1.0.0 migration removes data-style) is ignored.
  const look = readLookState(appDir);
  if (look.legacyStyle) console.log(`${name}: semi-lint.json / <html> còn style "${look.legacyStyle}" (Semi 1.0 bỏ qua; /semi-check foundation xoá).`);

  // Re-wire the brand (brand.css import, rules block) and say which fonts the layout still needs (the brand kit's, or
  // the one look's: Geist, font-display falls back to it).
  if (kit) {
    const w = wireBrand(appDir, cwd, readBrand(appDir).pkg);
    if (!w.ok) exitCode = 1;
  }
  if (look.layout && missingFonts(appDir).length) console.log(`${name}: ${fontHint(look.layout, appFonts(appDir))}`);

  // Only checks the upgrade itself (an API the app uses changed and no migration covers it).
  // A newer Semi may bring new lint rules: what they find in code written before is recorded as debt (the baseline
  // shrinks from here as it is fixed); any other growth of the baseline is refused by semi-lint and by semi-lint --ci.
  if (from && to && cmpVersion(to, from) > 0) {
    const b = runLocal(appDir, "semi-lint", ["--update-baseline", "--accept-new"]);
    if (b.failed) {
      // runTool printed "could not run semi-lint: <error>": nothing was written.
      exitCode = 1;
      console.log(`${name}: semi-lint-baseline.json KHÔNG được ghi (semi-lint không chạy được). Tự chạy trong ${appDir}: npx semi-lint --update-baseline --accept-new`);
    } else if (!b.skipped) {
      console.log(`${name}: luật lint mới của ${to}: lỗi cũ được ghi vào semi-lint-baseline.json (sửa dần, baseline chỉ giảm)`);
      if (b.status !== 0) console.log(`${name}: semi-lint còn báo lỗi ngoài baseline (ở trên): sửa bằng /semi-check.`);
    }
  }
  if (runLocal(appDir, "tsc", ["--noEmit"]).status !== 0) exitCode = 1;
}

process.exit(exitCode);
