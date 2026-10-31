#!/usr/bin/env node
// /semi-fix helper: works from semi-audit.md (written by /semi-audit). Zero external deps.
//   node fix.mjs --cwd <root>             plan: re-runs the audit when semi-audit.md is missing or older than the code,
//                                         then prints the summary (the agent reads semi-audit.md for the details)
//   node fix.mjs --cwd <root> --codemod   rewrite every "auto" item (colour / size classes → tokens) in every app
//   node fix.mjs --cwd <root> --verify    re-audit: rewrites semi-audit.md with what is left (deletes it when nothing
//                                         is), then runs semi-lint and tsc in each app. Exit 1 while anything is left.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { auditFileState, auditProject, formatSummary, scanTargets, totals, writeAuditFile } from "../../semi-audit/scripts/audit.mjs";
import { detectMode, migrateSource } from "../../semi-audit/scripts/vendor/codemod.mjs";

const argv = process.argv.slice(2);
let root = process.cwd();
let mode = "plan";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cwd" && argv[i + 1]) root = argv[++i];
  else if (argv[i] === "--codemod") mode = "codemod";
  else if (argv[i] === "--verify") mode = "verify";
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

if (mode === "plan") {
  const state = auditFileState(root);
  if (state.fresh) console.log(`${shown(state.path)} còn khớp với code: dùng file này.\n`);
  else console.log(state.exists ? `${shown(state.path)} cũ hơn code: audit lại.\n` : `Chưa có semi-audit.md: audit trước.\n`);
  const { report, path } = audit();
  process.stdout.write(formatSummary(report, shown(path)).replace("**Tiếp theo:** chạy **/semi-fix**.", "**Tiếp theo:** đọc file chi tiết rồi sửa theo thứ tự: quyết định → codemod → sửa tay."));
  process.exit(0);
}

if (mode === "codemod") {
  const report = auditProject(root);
  const apps = report.apps?.length ? report.apps : [];
  let files = 0;
  let changes = 0;
  for (const app of apps) {
    const sources = scanTargets(app.cwd).files.map((p) => ({ p, src: readFileSync(p, "utf8"), css: p.endsWith(".css") }));
    const m = detectMode(sources);
    for (const { p, src, css } of sources) {
      const out = migrateSource(src, { css, mode: m });
      if (out.code === src) continue;
      writeFileSync(p, out.code);
      files++;
      changes += out.changes.length;
    }
  }
  console.log(`codemod: ${changes} class đổi sang token trong ${files} file. Xem lại diff, rồi chạy --verify.`);
  process.exit(0);
}

// verify
const { report, path } = audit();
let failed = false;
for (const app of report.apps?.length ? report.apps : []) {
  if (!existsSync(join(app.cwd, "node_modules"))) {
    console.log(`(${relative(root, app.cwd) || "."}: chưa có node_modules, bỏ qua semi-lint / tsc)`);
    continue;
  }
  for (const [cmd, args] of [["npx", ["semi-lint"]], ["npx", ["tsc", "--noEmit"]]]) {
    const res = spawnSync(cmd, args, { cwd: app.cwd, stdio: "inherit" });
    if (res.status !== 0) failed = true;
  }
}
const t = totals(report);
process.stdout.write("\n" + formatSummary(report, shown(path)).replace("**Tiếp theo:** chạy **/semi-fix**.", "**Còn lại:** sửa tiếp theo file chi tiết."));
console.log(t.total ? `\nCòn ${t.total} vấn đề, ${shown(path)} đã cập nhật.` : `\nHết vấn đề: đã xoá semi-audit.md.`);
process.exit(t.total || failed ? 1 : 0);
