#!/usr/bin/env node
// Product look helper (used by /semi-ui when the user asks for a denser or roomier app): shows or sets the density and
// type scale of every app that uses @semi/ui. Since 1.0 Semi has one look (no styles); a leftover data-style is ignored.
// Zero external deps.
//   node look.mjs --cwd <root>                                                       list each app's density / type scale
//   node look.mjs --cwd <root> --density compact|regular|airy --type-scale even|contrast [--only dir]
//                                                       set them (data-density, data-type-scale on <html>; not the brand's)
import { readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { discoverFrontendApps } from "../../semi-check/scripts/audit.mjs";
import { readLookState, wireProductLook } from "./setup.mjs";

const argv = process.argv.slice(2);
let root = process.cwd();
let only = null;
let density = null;
let typeScale = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cwd" && argv[i + 1]) root = argv[++i];
  else if (argv[i] === "--only" && argv[i + 1]) only = argv[++i];
  else if (argv[i] === "--density" && argv[i + 1]) density = argv[++i];
  else if (argv[i] === "--type-scale" && argv[i + 1]) typeScale = argv[++i];
  else if (argv[i] === "--to" && argv[i + 1]) (++i, console.warn("--to: bỏ qua (từ 1.0 Semi chỉ có một diện mạo, không còn style)"));
}
root = resolve(root);
const onlyAbs = only ? resolve(root, only) : null;

const apps = discoverFrontendApps(root).filter((dir) => {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const uses = Boolean(pkg.dependencies?.["@semi/ui"] || pkg.devDependencies?.["@semi/ui"]);
  return uses && (!onlyAbs || dir === onlyAbs || dir.startsWith(onlyAbs + sep) || onlyAbs.startsWith(dir + sep));
});
if (!apps.length) {
  console.error(`Không có app nào dùng @semi/ui dưới ${only || root}. App có sẵn: /semi-check. App mới: /semi-new-app.`);
  process.exit(1);
}

let exitCode = 0;
for (const dir of apps) {
  const name = relative(root, dir) || ".";
  if (density || typeScale) {
    const r = wireProductLook(dir, { density, typeScale });
    console.log(`${name}: ${r.message}`);
    if (!r.ok) exitCode = 1;
    continue;
  }
  let cfg = {};
  try {
    cfg = JSON.parse(readFileSync(join(dir, "semi-lint.json"), "utf8"));
  } catch {}
  const st = readLookState(dir);
  console.log(`${name}: density ${cfg.density ?? "regular"}, type scale ${cfg.typeScale ?? "even"}`);
  if (st.legacyStyle) console.log(`  còn style "${st.legacyStyle}" từ trước 1.0 (Semi bỏ qua; /semi-sync hoặc /semi-check xoá)`);
}
if ((density || typeScale) && !exitCode) console.log(`\nChụp lại các trang đã chụp trước đó (cả hai theme) để so.`);
process.exit(exitCode);
