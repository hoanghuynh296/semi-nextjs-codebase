#!/usr/bin/env node
// /semi-check helper: works from semi-check.md (written by /semi-check), one phase at a time. Zero external deps.
//   node fix.mjs --cwd <root>                      plan: re-audits when semi-check.md is missing or older than the code,
//                                                  then prints the summary (the agent reads semi-check.md for details)
//   node fix.mjs --cwd <root> foundation [--brand <spec>] [--style <id>]
//                                                  phase 1: install @semi/ui (Next / Tailwind untouched),
//                                                  transpilePackages, Semi CSS, semi-lint.json + baseline, AGENTS.md,
//                                                  the style the user chose (<html data-style>); prints the layout
//                                                  providers to add by hand
//   node fix.mjs --cwd <root> tokens [--only dir] [--dry-run]
//                                                  phase 2: token codemod (colour / size classes), all apps or one dir;
//                                                  --dry-run prints what would change and writes nothing
//   --theme dark|light                             the app's current theme, when the audit could not tell (both phases)
//   --include <dir>                                also check a git-ignored folder or nested repository (repeatable)
//   node fix.mjs --cwd <root> --verify             re-audit: rewrites semi-check.md with what is left (deletes it when
//                                                  nothing is), runs semi-lint and tsc. Exit 1 while anything is left.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative, resolve, sep } from "node:path";
import { auditFileState, auditProject, formatSummary, scanTargets, totals, writeAuditFile } from "../../semi-check/scripts/audit.mjs";
import { migrateSource } from "../../semi-check/scripts/vendor/codemod.mjs";
import {
  installSemiUi,
  appFonts,
  installPackage,
  installedSemiVersion,
  missingStyleFonts,
  readBrand,
  readStyleState,
  resolveTargetSpec,
  runLocal,
  semiStyles,
  styleFontHint,
  wireAgentsMd,
  wireBrand,
  wireGlobalsCss,
  wireNextConfig,
  wireSemiLintConfig,
  wireStyle,
} from "../../semi-new-app/scripts/setup.mjs";

const argv = process.argv.slice(2);
let root = process.cwd();
let mode = "plan";
let only = null;
let styleArg = null;
let brandArg = null;
let themeArg = null;
let dryRun = false;
const include = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cwd" && argv[i + 1]) root = argv[++i];
  else if (argv[i] === "--only" && argv[i + 1]) only = argv[++i];
  else if (argv[i] === "--style" && argv[i + 1]) styleArg = argv[++i];
  else if (argv[i] === "--brand" && argv[i + 1]) brandArg = argv[++i];
  else if (argv[i] === "--theme" && argv[i + 1]) themeArg = argv[++i];
  else if (argv[i] === "--dry-run") dryRun = true;
  else if (argv[i] === "--include" && argv[i + 1]) include.push(argv[++i]);
  else if (argv[i] === "--verify") mode = "verify";
  else if (["foundation", "tokens"].includes(argv[i])) mode = argv[i];
  else if (argv[i] === "--codemod") mode = "tokens"; // old name
}
root = resolve(root);
if (themeArg && !["dark", "light"].includes(themeArg)) {
  console.log(`--theme ${themeArg}: chọn dark hoặc light`);
  process.exit(1);
}

/** The app's current theme: --theme, else what the audit read from the page; null (and a message) when unknown. */
function appTheme(app, name) {
  if (themeArg) return themeArg;
  const t = app.theme ?? { theme: app.legacyMode ?? "unknown", evidence: "" };
  if (t.theme !== "unknown") {
    console.log(`${name}: app ${t.theme === "dark" ? "tối" : "sáng"}: theo ${t.evidence}`);
    return t.theme;
  }
  console.log(`${name}: chưa rõ app đang sáng hay tối (${t.evidence}). Hỏi người dùng, rồi chạy lại với --theme dark|light.`);
  return null;
}

/**
 * Syntax errors of a file (the app's own TypeScript parser, so no dependency of ours), or null when the app has no
 * typescript package. Used to refuse a codemod result that does not parse while the original did.
 */
function syntaxErrors(appDir, file, code) {
  let ts;
  try {
    ts = createRequire(join(appDir, "package.json"))("typescript");
  } catch {
    return null;
  }
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : file.endsWith(".ts") ? ts.ScriptKind.TS : file.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.JS;
  return ts.createSourceFile(file, code, ts.ScriptTarget.Latest, false, kind).parseDiagnostics?.length ?? 0;
}

function audit() {
  const report = auditProject(root, { include });
  const path = writeAuditFile(report, root);
  return { report, path };
}
const shown = (p) => {
  const rel = p ? relative(process.cwd(), p) : "semi-check.md";
  return rel && !rel.startsWith("..") ? rel : p;
};
const appsOf = (report) => (report.apps?.length ? report.apps : []);

if (mode === "plan") {
  const state = auditFileState(root);
  if (state.fresh) console.log(`${shown(state.path)} còn khớp với code: dùng file này.\n`);
  else console.log(state.exists ? `${shown(state.path)} cũ hơn code: audit lại.\n` : `Chưa có semi-check.md: audit trước.\n`);
  const { report, path } = audit();
  process.stdout.write(formatSummary(report, shown(path)).replace("**Tiếp theo:** đồng ý để /semi-check sửa theo từng giai đoạn.", "**Tiếp theo:** làm theo giai đoạn trong file chi tiết, từ giai đoạn đầu tiên còn vấn đề."));
  process.exit(0);
}

if (mode === "foundation") {
  const report = auditProject(root, { include });
  let spec = null;
  const manual = []; // steps left to a person: listed once at the end, never also printed as done
  for (const app of appsOf(report)) {
    const todo = new Set(app.issues.filter((i) => i.phase === "foundation").map((i) => i.check));
    const name = relative(root, app.cwd) || ".";
    if (!todo.size && !brandArg) {
      console.log(`${name}: nền móng đã xong.`);
      continue;
    }
    if (todo.has("tailwind-v4")) {
      console.log(`${name}: Tailwind chưa phải v4. Chạy \`npx @tailwindcss/upgrade\` trong app (công cụ chính thức), kiểm tra giao diện, rồi chạy lại foundation.`);
      process.exitCode = 1;
      continue;
    }
    if (todo.has("semi-ui")) {
      spec ||= resolveTargetSpec().spec;
      console.log(`${name}: cài @semi/ui (${spec}), giữ nguyên Next / Tailwind…`);
      if (!installSemiUi(app.cwd, spec)) {
        process.exitCode = 1;
        continue;
      }
    }
    if (todo.has("transpile")) {
      const config = wireNextConfig(app.cwd, false);
      if (config) console.log(`${name}: ${relative(app.cwd, config)} ← transpilePackages`);
      else manual.push(`${name}: thêm transpilePackages: ["@semi/ui"] vào object cấu hình trong next.config (không nhận ra dạng file)`);
    }
    if (todo.has("semi-css")) console.log(`${name}: ${relative(app.cwd, wireGlobalsCss(app.cwd))} ← tokens.css + base.css`);
    if (todo.has("semi-lint-config")) {
      wireSemiLintConfig(app.cwd);
      console.log(`${name}: semi-lint.json`);
      // Today's debt becomes the baseline, so the edit hook blocks only new debt; the later phases shrink it.
      // --verify creates it later when semi-lint is not installed yet.
      const b = runLocal(app.cwd, "semi-lint", ["--update-baseline"]);
      if (b.skipped) manual.push(`${name}: chưa có semi-lint (chưa cài @semi/ui), baseline lint sẽ được tạo ở --verify`);
      else if (b.status !== 0) {
        console.log(`${name}: semi-lint --update-baseline lỗi`);
        process.exitCode = 1;
      } else console.log(`${name}: semi-lint-baseline.json`);
    }
    // Brand kit: install it (--brand, or the declared one missing from node_modules) and wire it before the style,
    // which must be one the brand allows.
    if (brandArg || todo.has("brand")) {
      let pkg = readBrand(app.cwd)?.pkg ?? null;
      if (brandArg) {
        const b = installPackage(app.cwd, brandArg);
        if (!b.ok) {
          console.log(`${name}: không cài được brand kit ${brandArg}`);
          process.exitCode = 1;
          continue;
        }
        pkg = b.name;
      } else if (!readBrand(app.cwd)?.kit) installPackage(app.cwd, JSON.parse(readFileSync(join(app.cwd, "package.json"), "utf8")).dependencies?.[pkg] ?? pkg);
      const r = wireBrand(app.cwd, root, pkg);
      console.log(`${name}: ${r.message}`);
      if (!r.ok) {
        process.exitCode = 1;
        continue;
      }
      const kit = readBrand(app.cwd).kit;
      const st = readStyleState(app.cwd);
      if (!styleArg && (!st.declared || !kit.styles.allowed.includes(st.declared))) styleArg = kit.styles.default;
      if (styleArg) todo.add("style");
    }
    if (todo.has("style")) {
      const brandKit = readBrand(app.cwd)?.kit;
      const list = semiStyles(app.cwd) || semiStyles();
      const state = readStyleState(app.cwd);
      const declared = state.declared;
      const valid = (sid) => list.styles.some((s) => s.id === sid) && (!brandKit || brandKit.styles.allowed.includes(sid));
      // With a brand, its default style is already a decision; without one, the user picks.
      const id = styleArg || (valid(declared) ? declared : null) || brandKit?.styles.default || null;
      if (!id) {
        console.log(`${name}: chưa chọn style. Hỏi người dùng, rồi chạy lại foundation --style <id>:`);
        for (const s of list.styles) {
          if (brandKit && !brandKit.styles.allowed.includes(s.id)) continue;
          console.log(`  ${s.id}${s.id === list.default ? " (mặc định, gần giao diện app cũ nhất)" : ""}: ${s.description}`);
        }
        process.exitCode = 1;
      } else {
        const r = wireStyle(app.cwd, id);
        console.log(`${name}: ${r.message}`);
        if (!r.ok) process.exitCode = 1;
      }
    }
    // The style's fonts go into the layout by hand, like the providers (the layout is the app's own code).
    const st = readStyleState(app.cwd);
    const chosen = (semiStyles(app.cwd) || semiStyles()).styles.find((s) => s.id === (styleArg || st.declared));
    if (chosen && st.layout && missingStyleFonts(app.cwd, chosen).length) console.log(`${name}: ${styleFontHint(st.layout, chosen, appFonts(app.cwd, chosen))}`);
    wireAgentsMd(root, installedSemiVersion(app.cwd) || "latest");
    if (todo.has("providers")) {
      const layout = app.issues.find((i) => i.check === "providers").file;
      const theme = appTheme(app, name);
      if (!theme) {
        process.exitCode = 1;
        continue;
      }
      manual.push(
        [
          `${name}: sửa ${layout} (giữ nguyên phần còn lại của layout):`,
          `  import { ThemeScript, ThemeProvider, ToastHost, ConfirmHost } from "@semi/ui";`,
          `  <html … suppressHydrationWarning>  <head><ThemeScript defaultTheme="${theme}" /></head>`,
          `  <body …><ThemeProvider defaultTheme="${theme}">{children}<ToastHost /><ConfirmHost /></ThemeProvider></body>`,
          `  defaultTheme="${theme}": app đang ${theme === "dark" ? "tối" : "sáng"}, giữ đúng như cũ.`,
        ].join("\n"),
      );
    }
  }
  if (manual.length) console.log(`\nLàm tay:\n${manual.map((m) => `- ${m}`).join("\n")}`);
  if (process.exitCode) console.log(`\nNền móng chưa xong: sửa các lỗi ở trên rồi chạy lại foundation.`);
  else console.log(`\nXong phần tự động của nền móng${manual.length ? " (còn phần làm tay ở trên)" : ""}. Chụp lại các trang đã chụp trước đó để so, rồi chạy --verify.`);
  process.exit(process.exitCode || 0);
}

if (mode === "tokens") {
  const report = auditProject(root, { include });
  const onlyAbs = only ? resolve(root, only) : null;
  let files = 0;
  let changes = 0;
  const skipped = []; // strings the mapping would change that are not class lists: a person looks
  const refused = []; // files whose result would not parse: left as they were
  for (const app of appsOf(report)) {
    const name = relative(root, app.cwd) || ".";
    if (!app.stack.hasSemiUi) {
      console.log(`${name}: chưa xong nền móng (chưa cài @semi/ui), bỏ qua.`);
      continue;
    }
    const m = appTheme(app, name); // judged on the whole app, so one module matches the rest
    if (!m) {
      process.exitCode = 1;
      continue;
    }
    for (const p of scanTargets(app.cwd).files) {
      if (onlyAbs && p !== onlyAbs && !p.startsWith(onlyAbs + sep)) continue;
      const src = readFileSync(p, "utf8");
      const css = p.endsWith(".css");
      const out = migrateSource(src, { css, mode: m });
      const rel = relative(root, p);
      for (const s of out.skipped) skipped.push(`${rel}:${s.line} "${s.value}"`);
      if (out.code === src) continue;
      if (!css) {
        const before = syntaxErrors(app.cwd, p, src);
        if (before !== null && syntaxErrors(app.cwd, p, out.code) > before) {
          refused.push(rel);
          continue;
        }
      }
      if (dryRun) console.log(`${rel}: ${out.changes.length} class`);
      else writeFileSync(p, out.code);
      files++;
      changes += out.changes.length;
    }
  }
  if (skipped.length) console.log(`\nBỏ qua ${skipped.length} chuỗi không phải danh sách class (xem tay):\n${skipped.slice(0, 30).map((x) => `- ${x}`).join("\n")}${skipped.length > 30 ? `\n- … và ${skipped.length - 30} chuỗi nữa` : ""}`);
  if (refused.length) console.log(`\nKhông ghi ${refused.length} file vì kết quả không còn parse được (giữ nguyên, báo lỗi codemod):\n${refused.map((x) => `- ${x}`).join("\n")}`);
  console.log(`\ncodemod${only ? ` (${only})` : ""}${dryRun ? " (thử, chưa ghi)" : ""}: ${changes} class đổi sang token trong ${files} file.${dryRun ? "" : " Xem lại diff, rồi chạy --verify."}`);
  process.exit(process.exitCode || 0);
}

// verify
const { report, path } = audit();
let failed = false;
for (const app of appsOf(report)) {
  if (!existsSync(join(app.cwd, "node_modules"))) {
    console.log(`(${relative(root, app.cwd) || "."}: chưa có node_modules, bỏ qua semi-lint / tsc)`);
    continue;
  }
  // The baseline foundation could not write before semi-lint was installed.
  const lintCfg = existsSync(join(app.cwd, "semi-lint.json")) ? JSON.parse(readFileSync(join(app.cwd, "semi-lint.json"), "utf8")) : null;
  if (lintCfg?.baseline && !existsSync(join(app.cwd, lintCfg.baseline))) {
    const b = runLocal(app.cwd, "semi-lint", ["--update-baseline"]);
    if (!b.skipped && b.status === 0) console.log(`${relative(root, app.cwd) || "."}: tạo ${lintCfg.baseline}`);
  }
  for (const [bin, args] of [["semi-lint", []], ["tsc", ["--noEmit"]]]) if (runLocal(app.cwd, bin, args).status !== 0) failed = true;
}
const t = totals(report);
process.stdout.write("\n" + formatSummary(report, shown(path)).replace("**Tiếp theo:** đồng ý để /semi-check sửa theo từng giai đoạn.", "**Còn lại:** làm tiếp theo file chi tiết."));
console.log(t.total ? `\nCòn ${t.total} vấn đề, ${shown(path)} đã cập nhật.` : `\nHết vấn đề: đã xoá semi-check.md.`);
process.exit(t.total || failed ? 1 : 0);
