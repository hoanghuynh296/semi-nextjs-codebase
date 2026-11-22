// node --test lint/test — the per-theme accent of a brand kit (#84) and "every themed token differs between light and dark".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrast, hexToOklch } from "../../brand/color.mjs";
import { accentErrors, generateBrand, validateBrand } from "../../brand/generate.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const styles = read("tokens/styles.json");
const kits = { semi: read("lint/test/fixtures/brand-semi.json"), "3dnoobs": read("lint/test/fixtures/brand-3dnoobs.json") };
const brand = (over = {}) => ({
  name: "Test",
  package: "@test/brand",
  primary: "#00AE42",
  neutral: "tinted",
  styles: { default: "flat", allowed: ["flat", "soft", "sharp"] },
  fonts: { sans: "Geist", display: "Montserrat Alternates" },
  ...over,
});
const gen = (b) => generateBrand(b, { tokens, styles });

test("accent per theme: light is a deeper 600-700 shade, dark a lighter 400-500 one, hover moves one step with the theme", () => {
  for (const primary of ["#00AE42", "#DD592A", "#2563EB", "#E11D48", "#FFD600", "#00FFFF", "#7C3AED", "#1E3A8A", "#0B1F3A"]) {
    const r = gen(brand({ primary }));
    const { light: l, dark: d } = r.tokens.themes;
    assert.notEqual(l["color-accent"], d["color-accent"], `${primary} fill differs between themes`);
    for (const [th, t] of [["light", l], ["dark", d]]) {
      assert.ok(contrast(t["color-accent"], t["color-on-accent"]) >= 4.5, `${primary} ${th} on-accent`);
      assert.ok(contrast(t["color-accent-hover"], t["color-on-accent"]) >= 4.5, `${primary} ${th} hover text`);
    }
    assert.ok(hexToOklch(d["color-accent"]).l > hexToOklch(l["color-accent"]).l, `${primary} dark fill is lighter`);
    assert.ok(hexToOklch(l["color-accent-hover"]).l < hexToOklch(l["color-accent"]).l, `${primary} light hover is deeper`);
    assert.ok(hexToOklch(d["color-accent-hover"]).l > hexToOklch(d["color-accent"]).l, `${primary} dark hover is lighter`);
    assert.ok([600, 700].includes(r.tokens.fidelity.light.fill), `${primary} light shade ${r.tokens.fidelity.light.fill}`);
    assert.ok([400, 500].includes(r.tokens.fidelity.dark.fill), `${primary} dark shade ${r.tokens.fidelity.dark.fill}`);
    assert.equal(l["color-accent"], r.tokens.primary[r.tokens.fidelity.light.fill]);
    assert.ok(r.report.filter((x) => x.check.startsWith("nút tách khỏi nền")).every((x) => x.ok), `${primary} fills stand out from the page`);
  }
  const g = gen(brand()).tokens.themes;
  assert.deepEqual([g.light["color-on-accent"], g.dark["color-on-accent"]], ["#ffffff", "#0c0d0e"]);
  assert.equal(g.dark["color-accent"], "#00ae42", "a brand colour that sits on 500 keeps it in the dark theme");
  const white = gen(brand({ primary: "#DD592A", color: { buttonText: "white" } })).tokens.themes;
  for (const th of ["dark", "light"]) assert.equal(white[th]["color-on-accent"], "#ffffff");
});

test("both shipped brands (semi, 3dnoobs) get different light and dark accents with AA contrast", () => {
  for (const [id, b] of Object.entries(kits)) {
    const { light, dark } = gen(b).tokens.themes;
    assert.notEqual(light["color-accent"], dark["color-accent"], `${id} fill`);
    assert.notEqual(light["color-accent-hover"], dark["color-accent-hover"], `${id} hover`);
    for (const t of [light, dark]) {
      assert.ok(contrast(t["color-accent"], t["color-on-accent"]) >= 4.5, `${id} on-accent`);
      assert.ok(contrast(t["color-accent-hover"], t["color-on-accent"]) >= 4.5, `${id} hover on-accent`);
    }
  }
});

test("sameInBothThemes keeps one value; equal accents without it are an error; explicit pins win", () => {
  const same = gen(brand({ primary: "#FF6B00", accent: { sameInBothThemes: true } })).tokens.themes;
  for (const k of ["color-accent", "color-accent-hover", "color-on-accent"]) assert.equal(same.light[k], same.dark[k], k);
  assert.ok(contrast(same.light["color-accent"], same.light["color-on-accent"]) >= 4.5);
  assert.throws(() => gen(brand({ accent: { light: { fill: 600 }, dark: { fill: 600 } } })), /giống nhau ở theme sáng và tối/);
  assert.equal(accentErrors({ light: { "color-accent": "#abc123" }, dark: { "color-accent": "#ABC123" } }, {}).length, 1);
  assert.deepEqual(accentErrors({ light: { "color-accent": "#abc123" }, dark: { "color-accent": "#abc123" } }, { accent: { sameInBothThemes: true } }), []);
  const pin = gen(brand({ accent: { light: { fill: 600, on: "white" }, dark: { fill: "#33CC66", hover: "#66DD88", on: "dark" } } })).tokens;
  assert.equal(pin.themes.light["color-accent"], pin.primary[600]);
  assert.equal(pin.themes.light["color-accent-hover"], pin.primary[700]);
  assert.deepEqual([pin.themes.dark["color-accent"], pin.themes.dark["color-accent-hover"], pin.themes.dark["color-on-accent"]], ["#33cc66", "#66dd88", "#0c0d0e"]);
  const bad = validateBrand(brand({ accent: { sameInBothThemes: "yes", light: { fill: 650 }, dark: { fill: "#fff" } } }), { styles }).errors.join("\n");
  assert.match(bad, /sameInBothThemes: true hoặc false/);
  assert.match(bad, /accent\.light\.fill/);
  assert.match(bad, /accent\.dark\.hover: bắt buộc/);
  assert.match(validateBrand(brand({ accent: { sameInBothThemes: true, light: { fill: 600 } } }), { styles }).errors.join("\n"), /không đi cùng/);
});

// ── Every themed --semi-* token differs between light and dark ───────────────────────────────────────────────────
/** Top-level rules of a stylesheet: [{ selectors: [..], decls: { "--x": "v" } }] (at-rules such as @media are skipped). */
function rules(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    if (open < 0) break;
    const head = src.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < src.length && depth) depth += src[j] === "{" ? 1 : src[j] === "}" ? -1 : 0, j++;
    if (!head.startsWith("@")) {
      const decls = {};
      for (const m of src.slice(open + 1, j - 1).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[m[1]] = m[2].trim().replace(/\s+/g, " ");
      out.push({ selectors: head.split(",").map((s) => s.trim()), decls });
    }
    i = j;
  }
  return out;
}
/** The tokens each theme sets in plain theme scopes ([data-theme="dark"] / "light"; :root counts as dark). */
function themed(css) {
  const dark = {};
  const light = {};
  for (const r of rules(css)) {
    const isDark = r.selectors.some((s) => s === '[data-theme="dark"]');
    const isLight = r.selectors.some((s) => s === '[data-theme="light"]');
    if (isDark) Object.assign(dark, r.decls);
    if (isLight) Object.assign(light, r.decls);
  }
  return { dark, light };
}
/** Intended to be the same in both themes: white text on the solid status fills, and tokens that only point at themed ones. */
const SAME_OK = new Set(["--semi-on-solid", "--semi-accent-line", "--semi-focus", "--semi-control-line-hover"]);
function sameTokens({ dark, light }) {
  return Object.keys(light)
    .filter((k) => k.startsWith("--semi-") && k in dark && dark[k].toLowerCase() === light[k].toLowerCase() && !SAME_OK.has(k))
    .sort();
}

test("core tokens.css: every themed --semi-* token differs between light and dark (allowlist: on-solid and references)", () => {
  const t = themed(readFileSync(new URL("../../tokens/tokens.css", import.meta.url), "utf8"));
  assert.ok(Object.keys(t.light).length > 50, "parsed the light theme");
  assert.deepEqual(sameTokens(t), []);
  // The allowlisted references really are references, not hidden constants.
  for (const k of ["--semi-accent-line", "--semi-focus", "--semi-control-line-hover"]) assert.match(t.light[k], /var\(--semi-/, k);
  // Every chart colour has its own dark value, and chart-6 reads against the dark panel like the others.
  for (let n = 1; n <= 8; n++) assert.notEqual(t.dark[`--semi-chart-${n}`], t.light[`--semi-chart-${n}`], `chart-${n}`);
  assert.ok(contrast(t.dark["--semi-chart-6"], t.dark["--semi-panel"]) >= 3, "chart-6 on the dark panel");
});

test("a built brand kit: every themed --semi-* token differs between light and dark", () => {
  for (const [id, b] of Object.entries(kits)) assert.deepEqual(sameTokens(themed(gen(b).css)), [], id);
  // A kit that opts into one accent shows up here, which is why sameInBothThemes has to be written down.
  const same = sameTokens(themed(gen(brand({ accent: { sameInBothThemes: true } })).css));
  assert.deepEqual(same, ["--semi-accent", "--semi-accent-hover", "--semi-on-accent"]);
});
