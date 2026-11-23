#!/usr/bin/env node
// Write a Design Lab patch (docs/LAB.md) into the sources, then rebuild what depends on them:
//   npm run lab:apply -- patch.json      validate, write tokens/tokens.json, brand/params.mjs,
//                                        run build:tokens + sync:vendor, compare the sample brands (params changed)
//   npm run lab:apply -- patch.json --dry  print the changes only
//   npm run lab:apply -- -               read the patch from stdin
// Exit 1 when the patch is invalid or a sample brand loses a pair that passed (nothing is written then).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyDraft, diffDraft, isEmptyDraft, validateDraft } from "./lab.mjs";
import { PARAMS } from "../brand/params.mjs";
import { compareSamples, comparisonOk, formatComparison } from "../brand/compare.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const writeJson = (p, v) => writeFileSync(join(root, p), JSON.stringify(v, null, 2) + "\n");

/** brand/params.mjs with a new PARAMS literal (between the <params> markers; the notes stay). */
export function writeParamsSource(source, params) {
  const re = /(\/\/ <params>[^\n]*\n)export const PARAMS = [\s\S]*?;\n(\/\/ <\/params>)/;
  if (!re.test(source)) throw new Error("brand/params.mjs: thiếu dấu // <params> … // </params>");
  return source.replace(re, (_, open, close) => `${open}export const PARAMS = ${JSON.stringify(params, null, 2)};\n${close}`);
}

function main(argv) {
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: npm run lab:apply -- <patch.json | -> [--dry]");
    return 2;
  }
  const draft = JSON.parse(file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8"));
  const tokens = readJson("tokens/tokens.json");
  const sources = { tokens, params: PARAMS };
  const errors = validateDraft(draft, sources);
  if (errors.length) {
    console.error(`lab:apply: patch không hợp lệ:\n- ${errors.join("\n- ")}`);
    return 1;
  }
  if (isEmptyDraft(draft)) {
    console.log("lab:apply: patch không đổi gì");
    return 0;
  }
  const rows = diffDraft(draft, sources);
  for (const r of rows) console.log(`  ${r.file}  ${r.key}: ${r.from} → ${r.to}`);

  const paramsChanged = rows.some((r) => r.file === "brand/params.mjs");
  const next = applyDraft(draft, { tokens, params: PARAMS });
  let ok = true;
  if (paramsChanged) {
    const cmp = compareSamples({ tokens }, { after: next.params });
    console.log(`\n${formatComparison(cmp)}`);
    ok = comparisonOk(cmp);
    if (!ok) console.error("\nlab:apply: có brand mẫu mất cặp màu đạt AA (dòng ✗): chỉnh lại tham số trong Lab, chưa ghi gì");
  }
  if (argv.includes("--dry") || !ok) return ok ? 0 : 1;

  writeJson("tokens/tokens.json", next.tokens);
  if (paramsChanged) {
    const p = join(root, "brand/params.mjs");
    writeFileSync(p, writeParamsSource(readFileSync(p, "utf8"), next.params));
  }
  execFileSync(process.execPath, [join(root, "scripts/build-tokens.mjs")], { stdio: "inherit" });
  execFileSync(process.execPath, [join(root, "scripts/sync-vendor.mjs")], { stdio: "inherit" });
  const files = [...new Set(rows.map((r) => r.file))];
  console.log(
    [
      "",
      `lab:apply: đã ghi ${files.join(", ")} và sinh lại tokens.css.`,
      "Còn lại (cùng commit, AGENTS.md › Change checklist):",
      ...(rows.some((r) => r.key.startsWith("shape.")) ? ["  - docs/TOKENS.md: bảng shape token"] : []),
      ...(rows.some((r) => r.key.startsWith("type.") || r.key.includes(".sizes.")) ? ["  - docs/DESIGN_SYSTEM.md + docs/QUICK_REF.md: thang chữ; TITLES.type trong scripts/build-tokens.mjs"] : []),
      ...(paramsChanged ? ["  - CHANGELOG: mọi brand kit đổi màu khi build lại → ghi chú /semi-brand update"] : []),
      "  - CHANGELOG.md, docs/DECISIONS.md (vì sao đổi)",
      "  - npm run build:manifest && npm run check, rồi build:storybook + build:brand-book + test:ui",
    ].join("\n"),
  );
  return 0;
}

const isMain = process.argv[1] && /lab-apply\.mjs$/.test(process.argv[1]);
if (isMain) process.exit(main(process.argv.slice(2)));
