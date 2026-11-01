// node --test lint/test — brand generator (brand/generate.mjs) and the semi-brand CLI on a throwaway kit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contrast, deltaE, hexToOklch } from "../../brand/color.mjs";
import { LADDER, SHADES, brandStep, generateBrand, scale, validateBrand } from "../../brand/generate.mjs";
import { scan } from "../semi-lint.mjs";
import { preparePreview } from "../../brand/cli.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const styles = read("tokens/styles.json");
const CLI = new URL("../../brand/cli.mjs", import.meta.url).pathname;
const brand = (over = {}) => ({
  name: "Test",
  package: "@test/brand",
  primary: "#00AE42",
  neutral: "tinted",
  styles: { default: "flat", allowed: ["flat", "soft", "sharp"] },
  fonts: { sans: "Geist", display: "Montserrat Alternates" },
  ...over,
});

test("validation: grey colours, bad names and styles outside the allowed list are errors", () => {
  const { errors } = validateBrand(brand({ primary: "#111827", package: "Test Brand", styles: { default: "sharp", allowed: ["flat"] } }), { styles });
  assert.equal(errors.length, 3);
  assert.match(errors.join("\n"), /gần như xám/);
  assert.match(errors.join("\n"), /package/);
  assert.match(errors.join("\n"), /styles.default/);
  assert.throws(() => generateBrand(brand({ primary: "green" }), { tokens, styles }), /primary/);
});

test("scale: fixed lightness per shade, the brand colour itself on its nearest shade, hue kept", () => {
  for (const hex of ["#2563EB", "#0B1F3A", "#FFD600", "#00AE42"]) {
    const sc = scale(hex);
    const step = brandStep(hex);
    assert.equal(sc[step], hex.toLowerCase(), `${hex} sits on ${step}`);
    const ls = SHADES.map((s) => hexToOklch(sc[s]).l);
    // No squashed ends: every neighbour pair differs by a visible step, even for near-black and near-white brands.
    for (let i = 1; i < ls.length; i++) assert.ok(ls[i - 1] - ls[i] > 0.025, `${hex} ${SHADES[i]} is clearly darker than ${SHADES[i - 1]}`);
    for (const s of SHADES) if (s !== step) assert.ok(Math.abs(hexToOklch(sc[s]).l - LADDER[s]) < 0.01, `${hex} ${s} on the ladder`);
  }
  const hue = hexToOklch("#2563EB").h;
  for (const s of [200, 400, 600, 800]) assert.ok(Math.abs(hexToOklch(scale("#2563EB")[s]).h - hue) < 6, `shade ${s} keeps the hue`);
});

test("fill: the readable shade closest to the brand; lifted only when it would vanish into the page", () => {
  const themes = (primary) => generateBrand(brand({ primary }), { tokens, styles }).tokens.themes;
  // Orange stays orange in the light theme (dark text) instead of turning brown under white text.
  const orange = themes("#FF6B00").light;
  assert.equal(orange["color-on-accent"], "#0c0d0e");
  assert.ok(deltaE(orange["color-accent"], "#FF6B00") < 0.1, `orange light fill ${orange["color-accent"]}`);
  // Navy keeps its exact colour in the light theme, and is lifted in the dark theme where it would blend in.
  const navy = themes("#1E3A8A");
  assert.equal(navy.light["color-accent"], "#1e3a8a");
  assert.notEqual(navy.dark["color-accent"], "#1e3a8a");
  assert.ok(contrast(navy.dark["color-accent"], "#181918") >= 3, "navy dark fill stands out from the panel");
  // Hover always differs from the fill and still reads.
  for (const p of ["#0B1F3A", "#FFD600", "#00FFFF", "#E11D48"]) {
    for (const t of Object.values(themes(p))) {
      assert.notEqual(t["color-accent-hover"], t["color-accent"], `${p} hover`);
      assert.ok(contrast(t["color-accent-hover"], t["color-on-accent"]) >= 4.5, `${p} hover text`);
    }
  }
});

test("report: focus ring and hover are checked; a fill that blends into the page is a soft finding with a warning", () => {
  const r = generateBrand(brand({ primary: "#FFD600" }), { tokens, styles });
  assert.ok(r.report.some((x) => x.check.startsWith("viền focus") && x.min === 3 && x.ok));
  assert.ok(r.report.some((x) => x.check.startsWith("nút chính khi hover") && x.ok));
  const soft = r.report.find((x) => x.check === "nút tách khỏi nền (sáng)");
  assert.ok(soft.soft && !soft.ok, "yellow on white is reported");
  assert.ok(r.warnings.some((w) => /tách khỏi nền/.test(w)));
  assert.deepEqual(r.tokens.fidelity.light, { fill: 200, text: r.tokens.fidelity.light.text, deltaE: 0 });
});

test("every pair reaches AA for very different brand colours, in every style and theme", () => {
  for (const primary of ["#00AE42", "#FACC15", "#2563EB", "#E11D48", "#14B8A6", "#7C3AED", "#F97316", "#0EA5E9", "#84CC16", "#DB2777", "#8B5CF6", "#B45309"]) {
    for (const neutral of ["tinted", "preset"]) {
      const r = generateBrand(brand({ primary, secondary: "#F59E0B", neutral }), { tokens, styles });
      assert.deepEqual(r.report.filter((x) => !x.ok && !x.soft).map((x) => `${primary} ${neutral} ${x.check} ${x.ratio.toFixed(2)}`), []);
      for (const theme of ["dark", "light"]) {
        const t = r.tokens.themes[theme];
        assert.ok(contrast(t["color-accent"], t["color-on-accent"]) >= 4.5, `${primary} ${theme} button`);
      }
    }
  }
});

test("Semi's own green stays itself: dark text on 500 in the dark theme, white on a deeper green in the light theme", () => {
  const t = generateBrand(brand(), { tokens, styles }).tokens.themes;
  assert.deepEqual([t.dark["color-accent"], t.dark["color-on-accent"]], ["#00ae42", "#0c0d0e"]);
  assert.equal(t.light["color-on-accent"], "#ffffff");
  // A very light brand colour keeps its own fill (dark text) in the light theme instead of turning brown.
  const y = generateBrand(brand({ primary: "#FACC15" }), { tokens, styles }).tokens.themes.light;
  assert.deepEqual([y["color-accent"], y["color-on-accent"]], ["#facc15", "#0c0d0e"]);
});

test("neutrals: tinted takes the primary's hue, preset copies the chosen palette; only allowed styles are emitted", () => {
  const tinted = generateBrand(brand({ primary: "#2563EB", styles: { default: "soft", allowed: ["soft"] } }), { tokens, styles });
  assert.deepEqual(Object.keys(tinted.tokens.neutrals), ["soft"]);
  const panel = hexToOklch(tinted.tokens.neutrals.soft.dark["color-panel"]);
  assert.ok(Math.abs(panel.h - hexToOklch("#2563EB").h) < 15, "dark panel leans blue");
  // surfaces stay near neutral: a colour cast on large areas is what people see as "ám màu"
  for (const k of ["color-canvas", "color-app", "color-panel", "color-field"]) for (const theme of ["dark", "light"]) {
    assert.ok(hexToOklch(tinted.tokens.neutrals.soft[theme][k]).c < 0.006, `${theme} ${k} chroma`);
  }
  const preset = generateBrand(brand({ neutral: "preset", palettes: { soft: "sage" } }), { tokens, styles });
  const sage = styles.styles.find((s) => s.id === "soft").palettes.find((p) => p.id === "sage").semantic;
  assert.equal(preset.tokens.neutrals.soft.light["color-canvas"], sage["color-canvas"].light);
  assert.match(preset.css, /\[data-style="sharp"\]\[data-theme="dark"\]/);
  assert.doesNotMatch(tinted.css, /data-style="flat"/);
});

test("css: primary scale in @theme, fonts through the family hooks, secondary utilities only when chosen", () => {
  const plain = generateBrand(brand(), { tokens, styles }).css;
  assert.match(plain, /@theme \{\n {2}--color-primary: #00ae42;/);
  assert.match(plain, /--font-sans-family: var\(--font-geist\), "Geist";/);
  assert.match(plain, /--font-display-family: var\(--font-montserrat-alternates\), "Montserrat Alternates";/);
  assert.doesNotMatch(plain, /secondary/);
  const two = generateBrand(brand({ secondary: "#7C3AED" }), { tokens, styles }).css;
  assert.match(two, /--color-secondary: #7c3aed;/);
  assert.match(two, /--color-secondary-600: #7c3aed;/);
  assert.match(two, /--color-secondary-fg: var\(--semi-secondary-fg\);/);
  assert.match(two, /--color-on-secondary: var\(--semi-on-secondary\);/);
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

test("brand-override: an app with a brand kit may not set brand colours, fonts or Semi tokens in its CSS", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-lint-"));
  mkdirSync(join(dir, "app"));
  const css = join(dir, "app/globals.css");
  writeFileSync(css, `@import "@3dnoobs/brand/dist/brand.css";\n:root { --color-primary-500: #ff0000; }\n@theme { --font-sans: Arial; }\n.x { --semi-panel: #fff; --my-gap: 4px; }\n`);
  const withBrand = scan([css], { brand: "@3dnoobs/brand" }, dir).hard.filter((h) => h.rule === "brand-override");
  assert.deepEqual(withBrand.map((h) => h.line), [2, 3, 4]);
  assert.equal(scan([css], {}, dir).hard.filter((h) => h.rule === "brand-override").length, 0); // only with a brand
  rmSync(dir, { recursive: true });
});

test("preview site: the template plus this brand's data, fonts module and CSS land in .preview/", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-brand-preview-"));
  writeFileSync(join(dir, "brand.json"), JSON.stringify(brand({ name: "3D Noobs", package: "@3dnoobs/brand", fonts: { sans: "Inter", display: "Montserrat Alternates" } })));
  execFileSync("node", [CLI, "build"], { cwd: dir });
  const out = preparePreview(dir);
  for (const f of ["next.config.mjs", "postcss.config.mjs", "app/layout.jsx", "app/page.jsx", "app/globals.css", "app/brand.css", "app/brand.json"]) assert.ok(readFileSync(join(out, f), "utf8").length > 20, f);
  const fonts = readFileSync(join(out, "app/fonts.js"), "utf8");
  assert.match(fonts, /import \{ Inter, Montserrat_Alternates \} from "next\/font\/google";/);
  assert.match(fonts, /weight: \["600","700"\]/);
  assert.match(fonts, /export const fontVariables = \[inter\.variable, montserratAlternates\.variable\]\.join\(" "\);/);
  assert.equal(readFileSync(join(out, "app/brand.css"), "utf8"), readFileSync(join(dir, "dist/brand.css"), "utf8"));
  assert.match(readFileSync(join(out, "next.config.mjs"), "utf8"), /SEMI_BRAND_BASE_PATH/);
  rmSync(dir, { recursive: true });
});
