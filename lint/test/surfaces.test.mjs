// node --test lint/test — the surface ladder of every style x theme (#88): the content panel must read as a card on the app.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hexToOklch } from "../../brand/color.mjs";
import { generateBrand } from "../../brand/generate.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const styles = read("tokens/styles.json");
const kits = { semi: read("lint/test/fixtures/brand-semi.json"), "3dnoobs": read("lint/test/fixtures/brand-3dnoobs.json") };

const MIN_STEP = 0.01; // OKLCH L
const KEYS = ["color-canvas", "color-app", "color-panel", "color-field", "color-raised"];
const L = (hex) => hexToOklch(hex).l;
const ids = styles.styles.map((s) => s.id);
const coreSurfaces = (st, theme) => Object.fromEntries(KEYS.map((k) => [k, (st.semantic?.[k] ?? tokens.semantic[k])[theme]]));
const kitNeutrals = (b) => generateBrand({ ...b, styles: { default: "flat", allowed: ids } }, { tokens, styles }).tokens.neutrals;

/**
 * Dark climbs canvas < app < panel < field < raised. Light: canvas < app < panel, and the field / raised fills sit
 * below the panel (field may equal canvas: it is the same tone by design).
 */
function checkLadder(label, theme, s) {
  const step = (lo, hi, what) => {
    const d = L(s[hi]) - L(s[lo]);
    assert.ok(d >= MIN_STEP, `${label} ${theme}: ${what} needs an OKLCH L step >= ${MIN_STEP} (${lo} ${s[lo]} -> ${hi} ${s[hi]}: ${d.toFixed(4)})`);
  };
  step("color-canvas", "color-app", "canvas < app");
  step("color-app", "color-panel", "app < panel");
  if (theme === "dark") {
    step("color-panel", "color-field", "panel < field");
    step("color-field", "color-raised", "field < raised");
  } else {
    step("color-field", "color-panel", "field < panel");
    step("color-raised", "color-field", "raised < field");
  }
}

test("core tokens: every style x theme has strictly ordered, distinct surfaces", () => {
  for (const st of styles.styles) for (const theme of ["light", "dark"]) checkLadder(`core ${st.id}`, theme, coreSurfaces(st, theme));
});

test("built kits: every allowed style x theme has strictly ordered, distinct surfaces", () => {
  for (const [id, b] of Object.entries(kits)) {
    for (const [sid, themes] of Object.entries(kitNeutrals(b))) {
      for (const theme of ["light", "dark"]) checkLadder(`kit ${id} ${sid}`, theme, themes[theme]);
    }
  }
});

test("Flat light panel steps off the app as much as Soft and Sharp do (core and kits)", () => {
  const gap = (n) => L(n["color-panel"]) - L(n["color-app"]);
  const core = (id) => coreSurfaces(styles.styles.find((s) => s.id === id), "light");
  const ref = Math.min(gap(core("soft")), gap(core("sharp")));
  assert.ok(gap(core("flat")) >= ref - 0.005, `core flat ${gap(core("flat")).toFixed(4)} vs ${ref.toFixed(4)}`);
  for (const [id, b] of Object.entries(kits)) {
    const n = kitNeutrals(b);
    const kref = Math.min(gap(n.soft.light), gap(n.sharp.light));
    assert.ok(gap(n.flat.light) >= kref - 0.005, `kit ${id} flat ${gap(n.flat.light).toFixed(4)} vs ${kref.toFixed(4)}`);
  }
});
