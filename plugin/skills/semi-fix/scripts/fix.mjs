#!/usr/bin/env node
// /semi-fix helper: works from semi-audit.md (written by /semi-audit), one phase at a time. Zero external deps.
//   node fix.mjs --cwd <root>                      plan: re-audits when semi-audit.md is missing or older than the code,
//                                                  then prints the summary (the agent reads semi-audit.md for details)
//   node fix.mjs --cwd <root> foundation           phase 1: install @semi/ui (Next / Tailwind untouched),
//                                                  transpilePackages, Semi CSS, semi-lint.json + baseline, AGENTS.md;
//                                                  prints the layout providers to add by hand
//   node fix.mjs --cwd <root> tokens [--only dir]  phase 2: token codemod (colour / size classes), all apps or one dir
//   node fix.mjs --cwd <root> --verify             re-audit: rewrites semi-audit.md with what is left (deletes it when
//                                                  nothing is), runs semi-lint and tsc. Exit 1 while anything is left.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { auditFileState, auditProject, formatSummary, scanTargets, totals, writeAuditFile } from "../../semi-audit/scripts/audit.mjs";
import { detectMode, migrateSource } from "../../semi-audit/scripts/vendor/codemod.mjs";
import { installSemiUi, installedSemiVersion, resolveTargetSpec, runLocal, wireAgentsMd, wireGlobalsCss, wireNextConfig, wireSemiLintConfig } from "../../semi-init/scripts/setup.mjs";

const argv = process.argv.slice(2);
let root = process.cwd();
let mode = "plan";
let only = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cwd" && argv[i + 1]) root = argv[++i];
  else if (argv[i] === "--only" && argv[i + 1]) only = argv[++i];
  else if (argv[i] === "--verify") mode = "verify";
  else if (["foundation", "tokens"].includes(argv[i])) mode = argv[i];
  else if (argv[i] === "--codemod") mode = "tokens"; // old name
}
root = resolve(root);

function audit() {
  const report = auditProject(root);
  const path = writeAuditFile(report, root);
  return { report, path };
}
const shown = (p) => {
  const rel = p ? relative(process.cwd(), p) : "semi-audit.md";
  return rel && !rel.startsWith("..") ? rel : p;
};
const appsOf = (report) => (report.apps?.length ? report.apps : []);

if (mode === "plan") {
  const state = auditFileState(root);
  if (state.fresh) console.log(`${shown(state.path)} còn khớp với code: dùng file này.\n`);
  else console.log(state.exists ? `${shown(state.path)} cũ hơn code: audit lại.\n` : `Chưa có semi-audit.md: audit trước.\n`);
  const { report, path } = audit();
  process.stdout.write(formatSummary(report, shown(path)).replace("**Tiếp theo:** chạy **/semi-fix**.", "**Tiếp theo:** làm theo giai đoạn trong file chi tiết, từ giai đoạn đầu tiên còn vấn đề."));
  process.exit(0);
}

if (mode === "foundation") {
  const report = auditProject(root);
  let spec = null;
  for (const app of appsOf(report)) {
    const todo = new Set(app.issues.filter((i) => i.phase === "foundation").map((i) => i.check));
    const name = relative(root, app.cwd) || ".";
    if (!todo.size) {
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
    if (todo.has("transpile")) console.log(`${name}: ${relative(app.cwd, wireNextConfig(app.cwd, false))} ← transpilePackages`);
    if (todo.has("semi-css")) console.log(`${name}: ${relative(app.cwd, wireGlobalsCss(app.cwd))} ← tokens.css + base.css`);
    if (todo.has("semi-lint-config")) {
      wireSemiLintConfig(app.cwd);
      // Today's debt becomes the baseline, so the edit hook blocks only new debt; the later phases shrink it.
      runLocal(app.cwd, "semi-lint", ["--update-baseline"]);
    }
    wireAgentsMd(root, installedSemiVersion(app.cwd) || "latest");
    if (todo.has("providers")) {
      const layout = app.issues.find((i) => i.check === "providers").file;
      const theme = app.legacyMode === "dark" ? "dark" : "light";
      console.log(
        [
          `${name}: sửa tay ${layout} (giữ nguyên phần còn lại của layout):`,
          `  import { ThemeScript, ThemeProvider, ToastHost, ConfirmHost } from "@semi/ui";`,
          `  <html … suppressHydrationWarning>  <head><ThemeScript defaultTheme="${theme}" /></head>`,
          `  <body …><ThemeProvider defaultTheme="${theme}">{children}<ToastHost /><ConfirmHost /></ThemeProvider></body>`,
          `  defaultTheme="${theme}": app đang ${theme === "dark" ? "tối" : "sáng"}, giữ đúng như cũ.`,
        ].join("\n"),
      );
    }
  }
  console.log(`\nXong phần tự động của nền móng. Chụp lại các trang đã chụp trước đó để so, rồi chạy --verify.`);
  process.exit(process.exitCode || 0);
}

if (mode === "tokens") {
  const report = auditProject(root);
  const onlyAbs = only ? resolve(root, only) : null;
  let files = 0;
  let changes = 0;
  for (const app of appsOf(report)) {
    if (!app.stack.hasSemiUi) {
      console.log(`${relative(root, app.cwd) || "."}: chưa xong nền móng (chưa cài @semi/ui), bỏ qua.`);
      continue;
    }
    const all = scanTargets(app.cwd).files.map((p) => ({ p, src: readFileSync(p, "utf8"), css: p.endsWith(".css") }));
    const m = detectMode(all); // judged on the whole app, so one module matches the rest
    for (const { p, src, css } of all) {
      if (onlyAbs && p !== onlyAbs && !p.startsWith(onlyAbs + sep)) continue;
      const out = migrateSource(src, { css, mode: m });
      if (out.code === src) continue;
      writeFileSync(p, out.code);
      files++;
      changes += out.changes.length;
    }
  }
  console.log(`codemod${only ? ` (${only})` : ""}: ${changes} class đổi sang token trong ${files} file. Xem lại diff, rồi chạy --verify.`);
  process.exit(0);
}

// verify
const { report, path } = audit();
let failed = false;
for (const app of appsOf(report)) {
  if (!existsSync(join(app.cwd, "node_modules"))) {
    console.log(`(${relative(root, app.cwd) || "."}: chưa có node_modules, bỏ qua semi-lint / tsc)`);
    continue;
  }
  for (const [bin, args] of [["semi-lint", []], ["tsc", ["--noEmit"]]]) if (runLocal(app.cwd, bin, args).status !== 0) failed = true;
}
const t = totals(report);
process.stdout.write("\n" + formatSummary(report, shown(path)).replace("**Tiếp theo:** chạy **/semi-fix**.", "**Còn lại:** làm tiếp theo file chi tiết."));
console.log(t.total ? `\nCòn ${t.total} vấn đề, ${shown(path)} đã cập nhật.` : `\nHết vấn đề: đã xoá semi-audit.md.`);
process.exit(t.total || failed ? 1 : 0);
