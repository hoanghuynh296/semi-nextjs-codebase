// node --test lint/test — brand fills of a kit (1.0: primary / secondary, the text on them, their hover) and "every themed
// token differs between light and dark" in Semi's own tokens.css.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrast, hexToOklch } from "../../brand/color.mjs";
import { VISIONS, distance, worstPair } from "./cvd.mjs";
import { ON_COLORS, generateBrand, hoverOf, pickOn } from "../../brand/generate.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const kits = { semi: read("lint/test/fixtures/brand-semi.json"), "3dnoobs": read("lint/test/fixtures/brand-3dnoobs.json") };
const brand = (over = {}) => ({ name: "Test", package: "@test/brand", primary: "#00AE42", fonts: { sans: "Geist" }, ...over });
const gen = (b) => generateBrand(b, { tokens });

test("on-colour: white when it reaches 4.5:1, else Semi's near-black, else black; every pick reaches AA", () => {
  assert.equal(pickOn("#0b1f3a"), "#ffffff");
  assert.equal(pickOn("#ffd600"), "#0c0d0e");
  // Mid-lightness colours where neither white nor #0c0d0e quite reach 4.5:1 fall back to black.
  const mids = ["#7a7a7a", "#808080", "#2563eb", "#e11d48", "#f97316", "#7c6f9b", "#22d3ee", "#a35a00"];
  for (const c of mids) assert.ok(contrast(pickOn(c), c) >= 4.5, `${c}: ${pickOn(c)} ${contrast(pickOn(c), c).toFixed(2)}`);
  for (let i = 0; i < 4096; i += 7) {
    const hex = `#${[(i >> 8) & 15, (i >> 4) & 15, i & 15].map((n) => (n * 17).toString(16).padStart(2, "0")).join("")}`;
    assert.ok(contrast(pickOn(hex), hex) >= 4.5, `${hex}`);
    assert.ok(ON_COLORS.includes(pickOn(hex)));
  }
});

test("hover: moves away from the text on it (darker under white, lighter under dark) and keeps AA", () => {
  for (const c of ["#00ae42", "#ffd600", "#0b1f3a", "#e11d48", "#2563eb", "#7c6f9b", "#ff57ae"]) {
    const on = pickOn(c);
    const h = hoverOf(c, on);
    assert.notEqual(h, c, c);
    const darker = hexToOklch(h).l < hexToOklch(c).l;
    assert.equal(darker, on === "#ffffff", `${c}: hover ${h} under ${on}`);
    assert.ok(contrast(on, h) >= contrast(on, c) - 0.05, `${c}: hover keeps the text contrast`);
    assert.ok(contrast(on, h) >= 4.5, `${c}: hover ${h} ${contrast(on, h).toFixed(2)}`);
  }
});

test("the two shipped kits generate, with AA on every fill and hover; brand fills are the same in both themes", () => {
  for (const [id, b] of Object.entries(kits)) {
    const r = gen(b);
    assert.deepEqual(r.report.filter((x) => !x.ok && !x.soft), [], id);
    // One block for every theme scope: the same fill in light and dark.
    assert.equal(rules(r.css).filter((x) => "--semi-primary" in x.decls).length, 1, `${id}: one primary for both themes`);
  }
});

// ── Every themed --semi-* token differs between light and dark ───────────────────────────────────────────────────
/**
 * Rules of a stylesheet: [{ selectors: [..], decls: { "--x": "v" }, media: "" | "(prefers-color-scheme: light)" }].
 * `@media (prefers-color-scheme: …)` blocks are read one level deep; other at-rules (@theme, @theme inline) are skipped.
 */
function rules(css, media = "") {
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
    const body = src.slice(open + 1, j - 1);
    if (head.startsWith("@media")) out.push(...rules(body, head.replace(/^@media\s*/, "")));
    else if (!head.startsWith("@")) {
      const decls = {};
      for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[m[1]] = m[2].trim().replace(/\s+/g, " ");
      out.push({ selectors: head.split(",").map((s) => s.trim()), decls, media });
    }
    i = j;
  }
  return out;
}
/**
 * Light / dark pairs to compare: { scope: { dark, light } } for the plain theme scopes and the system theme
 * (dark = [data-theme="system"], light = the same selector inside @media (prefers-color-scheme: light)). :root counts as dark.
 */
function themedScopes(css) {
  const scopes = {};
  const put = (scope, side, decls) => Object.assign(((scopes[scope] ??= { dark: {}, light: {} })[side]), decls);
  for (const r of rules(css)) {
    for (const sel of r.selectors) {
      const m = /^\[data-theme="(dark|light|system)"\]$/.exec(sel);
      if (!m) continue;
      const theme = m[1];
      if (theme === "system") put("plain system", r.media.includes("light") ? "light" : "dark", r.decls);
      else put("plain", theme, r.decls);
    }
  }
  return scopes;
}
/** The plain theme scope. */
const themed = (css) => themedScopes(css).plain;
/**
 * Intended to be the same in both themes: white text on the solid status fills, the brand fills (one value for both
 * themes, a kit sets them), and tokens whose value only points at themed ones (a mix of the contrast colour, a
 * reference), so they still change with the theme.
 */
const BRAND = ["--semi-primary", "--semi-primary-hover", "--semi-on-primary", "--semi-secondary", "--semi-secondary-hover", "--semi-on-secondary"];
const SAME_OK = new Set(["--semi-on-solid", ...BRAND]);
function sameTokens({ dark, light }) {
  return Object.keys(light)
    .filter((k) => k.startsWith("--semi-") && k in dark && dark[k].toLowerCase() === light[k].toLowerCase() && !SAME_OK.has(k) && !/var\(--semi-/.test(light[k]))
    .sort();
}

test("core tokens.css: every themed --semi-* token differs between light and dark (allowlist: on-solid, brand fills, references)", () => {
  const css = readFileSync(new URL("../../tokens/tokens.css", import.meta.url), "utf8");
  const t = themed(css);
  assert.ok(Object.keys(t.light).length > 50, "parsed the light theme");
  assert.deepEqual(sameTokens(t), []);
  // The pure contrast colour the lines and fills mix really switches.
  assert.notEqual(t.dark["--semi-contrast"], t.light["--semi-contrast"]);
  // Every chart colour has its own dark value, and each reads against its panel (marks need 3:1).
  for (let n = 1; n <= 8; n++) assert.notEqual(t.dark[`--semi-chart-${n}`], t.light[`--semi-chart-${n}`], `chart-${n}`);
  assert.ok(contrast(t.dark["--semi-chart-6"], t.dark["--semi-panel"]) >= 3, "chart-6 on the dark panel");
  assert.ok(contrast(t.light["--semi-chart-6"], t.light["--semi-panel"]) >= 3, "chart-6 on the light panel");
  const sys = themedScopes(css)["plain system"];
  assert.ok(Object.keys(sys.light).length > 50, "system-light block parsed");
  assert.deepEqual(sameTokens(sys), [], "system-light vs system-dark");
});

test("a built brand kit sets only the brand fills and fonts, on every theme scope", () => {
  for (const [id, b] of Object.entries(kits)) {
    const decls = rules(gen(b).css).flatMap((r) => Object.keys(r.decls));
    assert.deepEqual([...new Set(decls.filter((d) => d.startsWith("--semi-")))].sort(), [...BRAND].sort(), id);
    assert.ok(decls.every((d) => d.startsWith("--semi-") || d.startsWith("--font-")), `${id}: ${decls}`);
    const sel = rules(gen(b).css).find((r) => "--semi-primary" in r.decls).selectors;
    for (const s of [":root", "[data-theme]", ".dark", ".light"]) assert.ok(sel.includes(s), `${id}: ${s}`);
  }
});

// ── The eight chart colours stay distinguishable, also with colour-vision deficiency ─────────────────────────────
const chartHexes = (theme) => Array.from({ length: 8 }, (_, i) => tokens.semantic[`color-chart-${i + 1}`][theme]);

test("chart colours: chart-6 is distinct from the other seven (OKLab ΔE, normal + protan + deutan + tritan, Machado 2009)", () => {
  // Dark: the other seven sit in a lightness band of 0.05 (OKLCH L 0.62-0.67), so no colour inside that band can reach
  // 0.10 under every simulation (the best is a plum, 0.081); 0.08 is the floor. Light has room: 0.10.
  const floor = { dark: 0.08, light: 0.1 };
  for (const theme of ["dark", "light"]) {
    const h = chartHexes(theme);
    const six = h[5];
    for (const vision of VISIONS)
      h.forEach((o, i) => {
        if (i !== 5) assert.ok(distance(six, o, vision) >= floor[theme], `${theme} chart-6 vs chart-${i + 1} ${vision}: ${distance(six, o, vision).toFixed(3)}`);
      });
    const l = hexToOklch(six).l;
    const others = h.filter((_, i) => i !== 5).map((x) => hexToOklch(x).l);
    if (theme === "dark") assert.ok(l >= Math.min(...others) - 1e-3 && l <= Math.max(...others) + 1e-3, `dark chart-6 L ${l.toFixed(3)} inside the others' band`);
  }
});

test("chart colours: no pair of the eight regresses under any vision, in both themes", () => {
  // The seven older colours were never checked for CVD: their closest pairs (dark 3/5 deutan 0.016, light 0.045) are
  // recorded as the floor so a change cannot make them worse. Tighter palette spacing is a separate decision.
  const baseline = { dark: 0.015, light: 0.04 };
  for (const theme of ["dark", "light"]) {
    const h = chartHexes(theme).filter((_, i) => i !== 5);
    const w = worstPair(h);
    assert.ok(w.min >= baseline[theme], `${theme}: closest pair ${w.pair} ${w.vision} ${w.min.toFixed(3)}`);
    const all = worstPair(chartHexes(theme));
    assert.ok(all.min >= baseline[theme], `${theme}: with chart-6, closest pair ${all.pair} ${all.vision} ${all.min.toFixed(3)}`);
  }
});
