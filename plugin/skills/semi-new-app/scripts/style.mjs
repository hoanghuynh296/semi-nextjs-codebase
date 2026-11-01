#!/usr/bin/env node
// Style helper (used by /semi-ui when the user asks for another style, and by /semi-sync): shows or switches the
// Semi style of every app that uses @semi/ui. Zero external deps.
//   node style.mjs --cwd <root>                         list: each app's style and the styles its @semi/ui has
//   node style.mjs --cwd <root> --to <id> [--only dir]  switch: semi-lint.json "style" + <html data-style> in the root
//                                                       layout (all apps, or the one under dir)
// A style changes the look (neutral colours, fonts, radii, card border / shadow, control sizes); components, the accent
// and status colours and the layout stay as they are. The style's fonts are added to the layout by hand (printed).
import { readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { discoverFrontendApps } from "../../semi-check/scripts/audit.mjs";
import { appFonts, missingStyleFonts, readBrand, readStyleState, semiStyles, styleFontHint, wireStyle } from "./setup.mjs";

const argv = process.argv.slice(2);
let root = process.cwd();
let to = null;
let only = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cwd" && argv[i + 1]) root = argv[++i];
  else if (argv[i] === "--to" && argv[i + 1]) to = argv[++i];
  else if (argv[i] === "--only" && argv[i + 1]) only = argv[++i];
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
  const list = semiStyles(dir);
  if (!list) {
    console.log(`${name}: @semi/ui đã cài chưa có style. Chạy /semi-sync trước.`);
    exitCode = 1;
    continue;
  }
  const st = readStyleState(dir);
  const brandKit = readBrand(dir)?.kit;
  const target = to;
  if (!target) {
    const current = st.declared ? `${st.declared}${st.applied === st.declared ? "" : ` (chưa áp dụng: <html data-style="${st.applied ?? ""}">)`}` : `chưa chọn (đang hiện ${list.default})`;
    console.log(`${name}: style ${current}`);
    if (brandKit) console.log(`  brand ${brandKit.name}: style được phép ${brandKit.styles.allowed.join(", ")}; màu do brand đặt`);
    for (const s of list.styles) {
      if (brandKit && !brandKit.styles.allowed.includes(s.id)) continue;
      const on = s.id === (st.declared || list.default);
      console.log(`  ${on ? "●" : "○"} ${s.id} (${s.name}): ${s.description}`);
    }
    continue;
  }
  const r = wireStyle(dir, target);
  console.log(`${name}: ${st.declared || list.default} → ${target}. ${r.message}`);
  if (!r.ok) exitCode = 1;
  const next = list.styles.find((s) => s.id === target);
  if (r.ok && next && missingStyleFonts(dir, next).length) console.log(`${name}: ${styleFontHint(r.layout, next, appFonts(dir, next))}`);
}
if (to && !exitCode) console.log(`\nChụp lại các trang đã chụp trước đó (cả hai theme) để so.`);
process.exit(exitCode);
