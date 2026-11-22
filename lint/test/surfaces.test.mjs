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
  if (theme === "light") {
    step("color-field", "color-app", "field < app");
    step("color-canvas", "color-app", "canvas < app");
  }
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

test("Flat light steps (canvas to app, app to panel) are at least Sharp's, in core and in kits", () => {
  const gaps = (n) => ({ low: L(n["color-app"]) - L(n["color-canvas"]), high: L(n["color-panel"]) - L(n["color-app"]) });
  const check = (label, flat, sharp) => {
    const f = gaps(flat), r = gaps(sharp);
    for (const k of ["low", "high"]) assert.ok(f[k] >= r[k] - 1e-6, `${label} flat ${k} ${f[k].toFixed(4)} vs sharp ${r[k].toFixed(4)}`);
  };
  const core = (id) => coreSurfaces(styles.styles.find((s) => s.id === id), "light");
  check("core", core("flat"), core("sharp"));
  for (const [id, b] of Object.entries(kits)) {
    const n = kitNeutrals(b);
    check(`kit ${id}`, n.flat.light, n.sharp.light);
  }
});
