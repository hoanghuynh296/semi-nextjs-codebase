// node --test lint/test — brand generator (brand/generate.mjs, 1.0 schema) and the semi-brand CLI on a throwaway kit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contrast } from "../../brand/color.mjs";
import { REMOVED_FIELDS, generateBrand, validateBrand } from "../../brand/generate.mjs";
import { scan } from "../semi-lint.mjs";
import { preparePreview } from "../../brand/cli.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const CLI = new URL("../../brand/cli.mjs", import.meta.url).pathname;
const brand = (over = {}) => ({ name: "Test", package: "@test/brand", primary: "#00AE42", fonts: { sans: "Geist" }, ...over });
const gen = (b) => generateBrand(b, { tokens });

test("validation: primary is required, colours are hex, an explicit on-colour must reach 4.5:1, bad names are errors", () => {
  const { errors } = validateBrand(brand({ primary: undefined, package: "Test Brand", secondary: "orange" }));
  assert.match(errors.join("\n"), /primary/);
  assert.match(errors.join("\n"), /package/);
  assert.match(errors.join("\n"), /secondary/);
  assert.throws(() => gen(brand({ primary: "green" })), /primary/);
  assert.match(validateBrand(brand({ primary: { color: "#506bf2", on: "#ffffff" } })).errors.join("\n"), /primary\.on: [^\n]*4\.44:1/);
  assert.deepEqual(validateBrand(brand({ primary: { color: "#3a4fd0", on: "#ffffff" } })).errors, []);
  // A grey or black primary is allowed since 1.0 (the brand colour is only a button fill).
  assert.deepEqual(validateBrand(brand({ primary: "#111827" })).errors, []);
  assert.match(validateBrand(brand({ fonts: {} })).errors.join("\n"), /fonts\.sans/);
});

test("fills: the text on each fill reaches 4.5:1, the hover keeps it, an explicit on-colour wins; nothing else is derived", () => {
  const r = gen(brand({ secondary: { color: "#3a4fd0", on: "#ffffff" } }));
  const { primary, secondary } = r.tokens;
  assert.equal(primary.fill, "#00ae42");
  assert.equal(primary.on, "#0c0d0e");
  assert.notEqual(primary.hover, primary.fill);
  for (const f of [primary, secondary]) {
    assert.ok(contrast(f.on, f.fill) >= 4.5);
    assert.ok(contrast(f.on, f.hover) >= 4.5);
  }
  assert.equal(secondary.on, "#ffffff");
  assert.deepEqual(Object.keys(r.tokens).sort(), ["fonts", "guide", "name", "package", "primary", "secondary", "semi"]);
  assert.doesNotMatch(r.css, /accent|neutral|data-style|--color-primary-\d|--semi-(canvas|panel|text-|focus|danger|success)/);
  // Every pair of the report is a text pair (hard) or a fill-against-page note (soft).
  assert.ok(r.report.filter((x) => !x.soft).every((x) => x.ok && x.min === 4.5));
});

test("secondary: absent = the primary's values on the secondary tokens; present = its own fill", () => {
  const one = gen(brand());
  assert.equal(one.tokens.secondary, null);
  assert.match(one.css, /--semi-secondary: #00ae42;/);
  assert.match(one.css, /--semi-on-secondary: #0c0d0e;/);
  const two = gen(brand({ secondary: "#FF8A00" }));
  assert.match(two.css, /--semi-secondary: #ff8a00;/);
  assert.equal(two.tokens.guide.color.secondaryRule !== null, true);
  assert.equal(one.tokens.guide.color.secondaryRule, null);
});

test("fonts: sans required, display optional (without it --font-display-family is not set, so titles use the UI sans)", () => {
  const plain = gen(brand());
  assert.match(plain.css, /--font-sans-family: var\(--font-geist\), "Geist";/);
  assert.doesNotMatch(plain.css, /--font-display-family/);
  assert.deepEqual(plain.fonts.map((f) => f.roles), [["sans"]]);
  const css = readFileSync(new URL("../../tokens/tokens.css", import.meta.url), "utf8");
  assert.match(css, /--semi-font-display: var\(--font-display-family, var\(--semi-font-sans\)\);/, "tokens.css falls back to the UI sans");
  const both = gen(brand({ fonts: { sans: "Inter", display: "Montserrat Alternates" } }));
  assert.match(both.css, /--font-display-family: var\(--font-montserrat-alternates\), "Montserrat Alternates";/);
  assert.deepEqual(both.fonts.find((f) => f.family === "Montserrat Alternates").weight, ["400", "500", "600", "700"]);
  const same = gen(brand({ fonts: { sans: "Inter", display: "Inter" } }));
  assert.deepEqual(same.fonts.map((f) => f.roles), [["sans", "display"]]);
});

test("pre-1.0 fields are ignored with a warning naming what they did; the kit still builds", () => {
  const old = brand({
    neutral: "tinted",
    primaryStyle: "inverted",
    styles: { default: "flat", allowed: ["flat", "soft"] },
    accent: { sameInBothThemes: true },
    palettes: {},
    color: { accent: "balanced", buttonText: "white", secondaryRole: "badge" },
    fonts: { sans: "Geist", figure: "Inter" },
  });
  const v = validateBrand(old);
  assert.deepEqual(v.errors, []);
  for (const k of Object.keys(REMOVED_FIELDS)) assert.ok(v.warnings.some((w) => w.startsWith(`${k}: không còn dùng từ Semi 1.0`)), k);
  const r = gen(old);
  assert.equal(r.tokens.primary.on, "#0c0d0e", "color.buttonText no longer forces white");
  assert.equal(r.css, gen(brand()).css, "old fields change nothing in the CSS");
  for (const kit of ["lint/test/fixtures/brand-semi.json", "lint/test/fixtures/brand-3dnoobs.json", "tests/fixtures/brand.json"]) assert.doesNotThrow(() => gen(read(kit)), kit);
});

test("guideline: brief, logo, voice and imagery are validated; defaults fill what the brand leaves out", () => {
  const bad = validateBrand(brand({ voice: { tone: "loud", emoji: "no" }, logo: { full: "logo.gif" } }));
  assert.match(bad.errors.join("\n"), /voice.tone/);
  assert.match(bad.errors.join("\n"), /voice.emoji/);
  assert.match(bad.errors.join("\n"), /logo.full/);
  const plain = gen(brand());
  assert.equal(plain.tokens.guide.voice.tone, "neutral");
  assert.equal(plain.tokens.guide.voice.custom, false);
  assert.match(plain.tokens.guide.color.rule, /nút chính/);
  assert.ok(plain.warnings.some((w) => /giọng văn/.test(w)), "a brand without a voice is told to add one");
  assert.ok(plain.warnings.some((w) => /Chưa có logo/.test(w)));
  const g = gen(brand({ voice: { tone: "formal", address: "quý khách" } })).tokens.guide;
  assert.equal(g.voice.address, "quý khách");
  assert.ok(g.voice.rules.some((r) => /viết tắt/.test(r)), "formal tone rules");
  assert.ok(g.voice.rules.some((r) => /Nút: động từ/.test(r)), "shared microcopy rules");
  assert.match(validateBrand(brand({ brief: { tagline: "x".repeat(91) } })).errors.join("\n"), /brief.tagline/);
  assert.equal(gen(brand({ brief: { tagline: "In 3D chính xác ngay lần đầu" } })).tokens.guide.brief.tagline, "In 3D chính xác ngay lần đầu");
});

test("brand.json: density, type scale, typography and motif are not brand choices (warnings, no CSS)", () => {
  const r = gen(brand({ brief: { personality: ["táo bạo"] } }));
  assert.doesNotMatch(r.css, /--brand-spacing|--brand-title-weight|--brand-motif|--text-/);
  const old = validateBrand(brand({ density: "airy", typography: { scale: "contrast", title: "strong" }, motif: "dots" }));
  assert.equal(old.errors.length, 0);
  assert.match(old.warnings.join("\n"), /density: mật độ là lựa chọn của từng sản phẩm[\s\S]*typography: không còn dùng[\s\S]*motif: không còn dùng/);
});

test("report: a fill that blends into the page is a soft finding with a warning, never a failure", () => {
  const r = gen(brand({ primary: "#FFD600" }));
  const soft = r.report.filter((x) => x.soft && !x.ok);
  assert.ok(soft.length > 0, "yellow on the light page");
  assert.ok(r.warnings.some((w) => /tách khỏi nền/.test(w)));
  assert.ok(r.report.filter((x) => !x.soft).every((x) => x.ok));
});

test("semi-brand build writes the kit, check catches a stale file, storybook encodes brand.json", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-"));
  writeFileSync(join(dir, "brand.json"), JSON.stringify(brand({ name: "3D Noobs", package: "@3dnoobs/brand" }), null, 2));
  execFileSync("node", [CLI, "build"], { cwd: dir });
  for (const f of ["dist/brand.css", "dist/brand.json", "BRAND.md", "AGENTS.brand.md"]) assert.ok(readFileSync(join(dir, f), "utf8").length > 100, f);
  assert.match(readFileSync(join(dir, "AGENTS.brand.md"), "utf8"), /<!-- semi-brand:start -->[\s\S]*@3dnoobs\/brand[\s\S]*<!-- semi-brand:end -->/);
  execFileSync("node", [CLI, "check"], { cwd: dir });
  writeFileSync(join(dir, "brand.json"), JSON.stringify(brand({ name: "3D Noobs", package: "@3dnoobs/brand", primary: "#2563EB" })));
  assert.throws(() => execFileSync("node", [CLI, "check"], { cwd: dir, stdio: "pipe" }));
  const url = execFileSync("node", [CLI, "storybook"], { cwd: dir, encoding: "utf8" }).trim();
  assert.equal(JSON.parse(Buffer.from(url.split("#brand=")[1], "base64url").toString()).primary, "#2563EB");
  rmSync(dir, { recursive: true });
});

test("kit with a logo and a voice: logo files land in dist/logo, BRAND.md and AGENTS.brand.md carry the guideline", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "assets", "logo.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  const b = brand({ logo: { full: "assets/logo.svg", mark: "assets/missing.svg" }, voice: { tone: "friendly", examples: { error: "Chưa lưu được. Thử lại nhé." } } });
  writeFileSync(join(dir, "brand.json"), JSON.stringify(b));
  assert.throws(() => execFileSync("node", [CLI, "build"], { cwd: dir, stdio: "pipe" }), /missing\.svg/);
  delete b.logo.mark;
  writeFileSync(join(dir, "brand.json"), JSON.stringify(b));
  execFileSync("node", [CLI, "build"], { cwd: dir });
  assert.ok(readFileSync(join(dir, "dist", "logo", "full.svg"), "utf8").includes("<svg"));
  const md = readFileSync(join(dir, "BRAND.md"), "utf8");
  for (const h of ["## Logo", "## Cách dùng màu", "## Giọng văn"]) assert.ok(md.includes(h), h);
  assert.match(md, /@test\/brand\/dist\/logo\/full\.svg/);
  const agents = readFileSync(join(dir, "AGENTS.brand.md"), "utf8");
  assert.match(agents, /\*\*Voice \(UI text\)\*\* — Thân thiện/);
  assert.match(agents, /Chưa lưu được\. Thử lại nhé\./);
  assert.match(agents, /at most one filled brand button per page or dialog/);
  execFileSync("node", [CLI, "check"], { cwd: dir });
  writeFileSync(join(dir, "assets", "logo.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>');
  assert.throws(() => execFileSync("node", [CLI, "check"], { cwd: dir, stdio: "pipe" }), "a changed logo makes the kit stale");
  rmSync(dir, { recursive: true });
});

test("brand-override: an app with a brand kit may not set brand colours, fonts or Semi tokens in its CSS", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-lint-"));
  mkdirSync(join(dir, "app"));
  const css = join(dir, "app/globals.css");
  writeFileSync(css, `@import "@3dnoobs/brand/dist/brand.css";\n:root { --color-primary-500: #ff0000; }\n@theme { --font-sans: Arial; }\n.x { --semi-panel: #fff; --my-gap: 4px; }\n:root { --brand-primary: #f00; --spacing: 5px; }\n.y { --spacing-gutter: 4px; }\n`);
  const withBrand = scan([css], { brand: "@3dnoobs/brand" }, dir).hard.filter((h) => h.rule === "brand-override");
  assert.deepEqual(withBrand.map((h) => h.line), [2, 3, 4, 5]);
  assert.equal(scan([css], {}, dir).hard.filter((h) => h.rule === "brand-override").length, 0); // only with a brand
  rmSync(dir, { recursive: true });
});

test("preview site: the template plus this brand's data, fonts module and CSS land in .preview/", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-preview-"));
  writeFileSync(join(dir, "brand.json"), JSON.stringify(brand({ name: "3D Noobs", package: "@3dnoobs/brand", fonts: { sans: "Inter", display: "Montserrat Alternates" } })));
  execFileSync("node", [CLI, "build"], { cwd: dir });
  const out = preparePreview(dir);
  for (const f of ["next.config.mjs", "postcss.config.mjs", "app/layout.jsx", "app/parts.jsx", "app/(book)/layout.jsx", "app/(book)/page.jsx", "app/(book)/apps/page.jsx", "app/(book)/kit/page.jsx", "app/(book)/components/page.jsx", "app/globals.css", "app/brand.css", "app/brand.json", "public/kit/brand.css", "public/kit/brand.json"]) assert.ok(readFileSync(join(out, f), "utf8").length > 20, f);
  const fonts = readFileSync(join(out, "app/fonts.js"), "utf8");
  assert.match(fonts, /import \{ Inter, Montserrat_Alternates \} from "next\/font\/google";/);
  assert.match(fonts, /weight: \["400","500","600","700"\]/);
  assert.match(fonts, /export const fontVariables = \[inter\.variable, montserratAlternates\.variable\]\.join\(" "\);/);
  assert.equal(readFileSync(join(out, "app/brand.css"), "utf8"), readFileSync(join(dir, "dist/brand.css"), "utf8"));
  assert.match(readFileSync(join(out, "next.config.mjs"), "utf8"), /SEMI_BRAND_BASE_PATH/);
  rmSync(dir, { recursive: true });
});

test("product look: density and type scale live in the tokens, per element, and the app wires them on <html>", async () => {
  const css = readFileSync(new URL("../../tokens/tokens.css", import.meta.url), "utf8");
  assert.match(css, /\[data-density="compact"\] \{[^}]*--semi-spacing: 0\.225rem/);
  assert.match(css, /\[data-type-scale="contrast"\] \{[^}]*--text-section: 1.5rem/); // 24px, emitted in rem
  const { wireProductLook } = await import("../../plugin/skills/semi-new-app/scripts/setup.mjs");
  const dir = mkdtempSync(join(tmpdir(), "semi-look-"));
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "app/layout.tsx"), '<html lang="vi">\n');
  writeFileSync(join(dir, "semi-lint.json"), '{}\n');
  assert.equal(wireProductLook(dir, { density: "airy", typeScale: "contrast" }).ok, true);
  assert.match(readFileSync(join(dir, "app/layout.tsx"), "utf8"), /<html data-density="airy" data-type-scale="contrast" lang="vi">/);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "semi-lint.json"), "utf8")), { density: "airy", typeScale: "contrast" });
  assert.equal(wireProductLook(dir, { density: "regular" }).ok, true); // back to the default: attribute and key go
  assert.doesNotMatch(readFileSync(join(dir, "app/layout.tsx"), "utf8"), /data-density/);
  assert.equal(wireProductLook(dir, { density: "tight" }).ok, false);
  rmSync(dir, { recursive: true });
});

test("brief.sample: validated, warned about when missing, and written into the agent rules", () => {
  const sample = { list: "Bản in", items: ["Móc khoá PLA", "Giá đỡ điện thoại"], metric: { label: "Bản in đang chạy", value: "12" }, proof: { label: "bản in đã giao", value: "12.000+" } };
  const ok = validateBrand(brand({ brief: { product: "In 3D", sample } }));
  assert.deepEqual(ok.errors, []);
  assert.doesNotMatch(ok.warnings.join("\n"), /brief\.sample/);
  assert.match(validateBrand(brand({ brief: { product: "In 3D" } })).warnings.join("\n"), /Chưa có brief\.sample/);
  const bad = validateBrand(brand({ brief: { sample: { items: ["một"], metric: { label: "x" } } } }));
  assert.match(bad.errors.join("\n"), /brief\.sample\.items[\s\S]*brief\.sample\.metric/);
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-sample-"));
  writeFileSync(join(dir, "brand.json"), JSON.stringify(brand({ brief: { product: "In 3D", sample } })));
  execFileSync("node", [CLI, "build"], { cwd: dir });
  assert.match(readFileSync(join(dir, "AGENTS.brand.md"), "utf8"), /\*\*Sample content\*\*[^\n]*“Bản in”[^\n]*“Móc khoá PLA”[^\n]*“Bản in đang chạy” \(12\)/);
  assert.equal(JSON.parse(readFileSync(join(dir, "dist/brand.json"), "utf8")).guide.brief.sample.proof.value, "12.000+");
  rmSync(dir, { recursive: true });
});

test("semi-brand check ignores the @semi/ui version stamp, not a real change", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-stamp-"));
  writeFileSync(join(dir, "brand.json"), JSON.stringify(brand(), null, 2));
  execFileSync("node", [CLI, "build"], { cwd: dir });
  for (const f of ["dist/brand.css", "dist/brand.json"]) {
    const p = join(dir, f);
    writeFileSync(p, readFileSync(p, "utf8").replace(/@semi\/ui \d+\.\d+\.\d+/, "@semi/ui 0.1.0").replace(/"semiVersion": "[^"]*"/, '"semiVersion": "0.1.0"'));
  }
  execFileSync("node", [CLI, "check"], { cwd: dir, stdio: "pipe" });
  const css = join(dir, "dist/brand.css");
  writeFileSync(css, readFileSync(css, "utf8").replace("--semi-primary:", "--semi-primary: #000; --x:"));
  assert.throws(() => execFileSync("node", [CLI, "check"], { cwd: dir, stdio: "pipe" }));
  rmSync(dir, { recursive: true });
});
