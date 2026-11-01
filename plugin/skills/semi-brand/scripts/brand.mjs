#!/usr/bin/env node
// /semi-brand helper: creates, edits and updates a brand kit repo (docs/BRANDS.md). Zero external deps; the colour
// work is done by the kit's own @semi/ui (semi-brand build).
//   node brand.mjs create --cwd <dir> --name "3D Noobs" --package @3dnoobs/brand --primary "#00AE42"
//        [--secondary "#hex"] [--neutral tinted|preset] [--palette soft=sage] [--style flat] [--allow flat,soft]
//        [--sans Geist] [--display "Montserrat Alternates"]
//   node brand.mjs set --cwd <dir> primary=#00C853 secondary=none neutral=preset palette.soft=sage allow=flat,soft
//        style=flat sans=Inter display=Inter        edit brand.json, then build
//   node brand.mjs build|check|preview --cwd <dir>  the kit's semi-brand
//   node brand.mjs update --cwd <dir>               newest @semi/ui, "semi" range, rebuild, suggest the version bump
//   node brand.mjs bump --cwd <dir> patch|minor|major|<x.y.z>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { cmpSemver, detectPkgManager, resolveTargetSpec, runLocal } from "../../semi-init/scripts/setup.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];
let cwd = process.cwd();
const opts = {};
const pairs = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--cwd" && argv[i + 1]) cwd = resolve(argv[++i]);
  else if (a.startsWith("--") && argv[i + 1] !== undefined) opts[a.slice(2)] = argv[++i];
  else pairs.push(a);
}
const brandPath = join(cwd, "brand.json");
const pkgPath = join(cwd, "package.json");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
const semiVersion = () => {
  try {
    return readJson(join(cwd, "node_modules", "@semi", "ui", "package.json")).version;
  } catch {
    return null;
  }
};
const kitBin = (sub) => runLocal(cwd, "semi-brand", [sub]);

function installSemi(spec) {
  const pkg = readJson(pkgPath);
  (pkg.devDependencies ||= {})["@semi/ui"] = spec;
  writeJson(pkgPath, pkg);
  const pm = detectPkgManager(cwd);
  return spawnSync(pm, pm === "npm" ? ["install", "--install-links"] : ["install"], { cwd, stdio: "inherit" }).status === 0;
}

/** Brand tokens of the last build (dist/brand.json), for comparing before / after an update. */
const builtTokens = () => (existsSync(join(cwd, "dist", "brand.json")) ? readJson(join(cwd, "dist", "brand.json")) : null);

/** Which part of a kit changed between two builds: "major" (colours / fonts people see), "minor" (new options), "patch". */
function changeLevel(before, after) {
  if (!before) return "major";
  const pick = (t) => JSON.stringify({ primary: t.primary, secondary: t.secondary, themes: t.themes, neutrals: t.neutrals, fonts: t.fonts });
  if (pick(before) !== pick(after)) {
    const removed = before.styles.allowed.some((s) => !after.styles.allowed.includes(s));
    const onlyAdded = !removed && JSON.stringify(before.primary) === JSON.stringify(after.primary) && JSON.stringify(before.themes) === JSON.stringify(after.themes) &&
      Object.keys(before.neutrals).every((s) => JSON.stringify(before.neutrals[s]) === JSON.stringify(after.neutrals[s])) && JSON.stringify(before.fonts) === JSON.stringify(after.fonts);
    return onlyAdded ? "minor" : "major";
  }
  return JSON.stringify(before.styles) !== JSON.stringify(after.styles) ? "minor" : "patch";
}

const README = (b) => `# ${b.name}: brand kit

Bộ nhận diện của **${b.name}** trên Semi Design System. File duy nhất người sửa là \`brand.json\`; mọi file trong
\`dist/\`, \`BRAND.md\` và \`AGENTS.brand.md\` do \`semi-brand build\` sinh ra.

- Guideline: [BRAND.md](BRAND.md)
- Đổi lựa chọn: \`/semi-brand\` (hoặc sửa \`brand.json\`, rồi \`npm run build\`)
- Bản Semi mới: \`/semi-brand update\`
- Dùng trong sản phẩm mới: \`/semi-init --brand github:<owner>/<repo>\`; sản phẩm có sẵn: \`/semi-update\`

Hướng dẫn đầy đủ: \`node_modules/@semi/ui/docs/BRANDS.md\`.
`;

function applyPair(brand, key, value) {
  const v = value === "none" || value === "null" ? null : value;
  if (key === "primary" || key === "secondary" || key === "name" || key === "neutral") brand[key] = v;
  else if (key === "allow") brand.styles.allowed = v.split(",").map((x) => x.trim()).filter(Boolean);
  else if (key === "style") brand.styles.default = v;
  else if (key === "sans" || key === "display") brand.fonts[key] = v;
  else if (key.startsWith("palette.")) {
    brand.palettes ||= {};
    if (v) brand.palettes[key.slice(8)] = v;
    else delete brand.palettes[key.slice(8)];
  } else throw new Error(`không biết khoá "${key}" (primary, secondary, name, neutral, allow, style, sans, display, palette.<style>)`);
}

if (cmd === "create") {
  if (existsSync(brandPath)) {
    console.error(`${brandPath} đã có: đây là brand kit có sẵn. Sửa bằng: node brand.mjs set …`);
    process.exit(10);
  }
  for (const k of ["name", "package", "primary"])
    if (!opts[k]) {
      console.error(`thiếu --${k}`);
      process.exit(2);
    }
  mkdirSync(cwd, { recursive: true });
  const target = resolveTargetSpec();
  const style = opts.style || "flat";
  const brand = {
    name: opts.name,
    package: opts.package,
    primary: opts.primary,
    secondary: opts.secondary && opts.secondary !== "none" ? opts.secondary : null,
    neutral: opts.neutral || "tinted",
    ...(opts.palette ? { palettes: Object.fromEntries(opts.palette.split(",").map((p) => p.split("="))) } : {}),
    styles: { default: style, allowed: (opts.allow || style).split(",").map((s) => s.trim()) },
    fonts: { sans: opts.sans || "Geist", display: opts.display || "Montserrat Alternates" },
    semi: `^${target.version}`,
  };
  writeJson(brandPath, brand);
  writeJson(pkgPath, {
    name: opts.package,
    version: "0.1.0",
    private: true,
    description: `${opts.name} brand kit on the Semi Design System`,
    type: "module",
    files: ["dist", "brand.json", "BRAND.md", "AGENTS.brand.md"],
    exports: {
      "./dist/brand.css": "./dist/brand.css",
      "./brand.json": "./dist/brand.json",
      "./BRAND.md": "./BRAND.md",
      "./AGENTS.brand.md": "./AGENTS.brand.md",
      "./package.json": "./package.json",
    },
    scripts: { build: "semi-brand build", check: "semi-brand check", preview: "semi-brand preview" },
    devDependencies: { "@semi/ui": target.spec },
  });
  writeFileSync(join(cwd, ".gitignore"), "node_modules/\n");
  writeFileSync(join(cwd, "README.md"), README(brand));
  console.log(`Cài @semi/ui (${target.spec}) cho brand kit…`);
  if (!installSemi(target.spec)) process.exit(1);
  brand.semi = `^${semiVersion() || target.version}`; // the version really installed
  writeJson(brandPath, brand);
  const r = kitBin("build");
  console.log(`\nBrand kit ${opts.name} đã tạo ở ${cwd}. Xem trước:`);
  kitBin("preview");
  process.exit(r.status || 0);
}

if (cmd === "set") {
  if (!existsSync(brandPath)) {
    console.error("chưa có brand.json: tạo brand kit bằng node brand.mjs create …");
    process.exit(2);
  }
  const brand = readJson(brandPath);
  const before = builtTokens();
  try {
    for (const p of pairs) {
      const i = p.indexOf("=");
      applyPair(brand, p.slice(0, i), p.slice(i + 1));
    }
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  writeJson(brandPath, brand);
  const r = kitBin("build");
  if (r.status === 0) {
    const level = changeLevel(before, builtTokens());
    console.log(`Thay đổi này là mức ${level} (sản phẩm: ${level === "major" ? "/semi-update sẽ hỏi trước vì giao diện đổi" : "/semi-update tự nhận"}). Xem trước:`);
    kitBin("preview");
  }
  process.exit(r.status || 0);
}

if (["build", "check", "preview"].includes(cmd)) process.exit(kitBin(cmd).status || 0);

if (cmd === "update") {
  if (!existsSync(brandPath)) {
    console.error("chưa có brand.json ở đây: /semi-brand update chạy trong repo brand kit");
    process.exit(2);
  }
  const before = builtTokens();
  const from = semiVersion();
  const target = resolveTargetSpec();
  if (from && cmpSemver(target.version, from) <= 0) console.log(`@semi/ui đã mới nhất (${from}); chỉ sinh lại.`);
  else {
    console.log(`@semi/ui ${from || "?"} → ${target.version}`);
    if (!installSemi(target.spec)) process.exit(1);
  }
  const brand = readJson(brandPath);
  brand.semi = `^${semiVersion() || target.version}`;
  writeJson(brandPath, brand);
  const r = kitBin("build");
  if (r.status !== 0) process.exit(r.status);
  const level = changeLevel(before, builtTokens());
  const version = readJson(pkgPath).version;
  console.log(`\nKit sinh lại xong. Mức thay đổi: ${level} → đề xuất bump ${level} từ ${version} (node brand.mjs bump --cwd "${cwd}" ${level}).`);
  process.exit(0);
}

if (cmd === "bump") {
  const pkg = readJson(pkgPath);
  const level = pairs[0];
  const [a, b, c] = pkg.version.split(".").map(Number);
  const next = /^\d+\.\d+\.\d+$/.test(level || "") ? level : level === "major" ? `${a + 1}.0.0` : level === "minor" ? `${a}.${b + 1}.0` : level === "patch" ? `${a}.${b}.${c + 1}` : null;
  if (!next) {
    console.error("bump cần patch | minor | major | x.y.z");
    process.exit(2);
  }
  pkg.version = next;
  writeJson(pkgPath, pkg);
  console.log(`${pkg.name} ${a}.${b}.${c} → ${next}. Commit, rồi gắn tag v${next} và push (sản phẩm cài theo tag).`);
  process.exit(0);
}

console.log("usage: brand.mjs create | set | build | check | preview | update | bump  (xem đầu file)");
process.exit(cmd ? 2 : 0);
