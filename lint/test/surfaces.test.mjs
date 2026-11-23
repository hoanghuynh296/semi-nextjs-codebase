// node --test lint/test — the 1.0 neutral surfaces (#141): one ladder for every brand, and AA of every text tier on the
// page surfaces (the token build runs the same check, scripts/token-css.mjs aaErrors, so a failing value fails `npm run check`).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hexToOklch } from "../../brand/color.mjs";
import { aaErrors } from "../../scripts/token-css.mjs";

const tokens = JSON.parse(readFileSync(new URL("../../tokens/tokens.json", import.meta.url), "utf8"));
const MIN_STEP = 0.01; // OKLCH L
const L = (hex) => hexToOklch(hex).l;
const v = (k, theme) => tokens.semantic[k][theme];
const step = (theme, lo, hi) => {
  const d = L(v(hi, theme)) - L(v(lo, theme));
  assert.ok(d >= MIN_STEP, `${theme}: ${lo} ${v(lo, theme)} -> ${hi} ${v(hi, theme)} needs an OKLCH L step >= ${MIN_STEP} (${d.toFixed(4)})`);
};

test("dark climbs canvas < app < panel < field < raised < raised-2; the focused field is one step below the field", () => {
  const ladder = ["color-canvas", "color-app", "color-panel", "color-field", "color-raised", "color-raised-2"];
  for (let i = 1; i < ladder.length; i++) step("dark", ladder[i - 1], ladder[i]);
  step("dark", "color-field-focus", "color-field");
});

test("light: canvas < app < panel, the raised track sits below the canvas, the focused field one step below the field", () => {
  step("light", "color-canvas", "color-app");
  step("light", "color-app", "color-panel");
  step("light", "color-raised", "color-canvas");
  step("light", "color-field-focus", "color-field");
});

test("surfaces are pure neutral greys (no brand tint)", () => {
  for (const k of ["color-canvas", "color-app", "color-panel", "color-field", "color-field-focus", "color-raised", "color-raised-2"])
    for (const theme of ["dark", "light"]) assert.ok(hexToOklch(v(k, theme)).c < 0.001, `${theme} ${k} ${v(k, theme)} is tinted`);
});

test("every text tier reaches 4.5:1 on panel, app, canvas and card in its theme; a failing value is reported", () => {
  assert.deepEqual(aaErrors(tokens), []);
  const bad = structuredClone(tokens);
  bad.semantic["color-text-faint"].light = "#737373"; // 3.98:1 on the light canvas, 4.27:1 on app, below 4.5 on the card, 4.74:1 on panel
  const errors = aaErrors(bad);
  assert.equal(errors.length, 3);
  assert.ok(errors.some((e) => /light color-text-faint #737373 on color-canvas #ebebeb: 3\.98:1/.test(e)), errors.join("; "));
  bad.semantic["color-text-muted"].dark = "var(--semi-x)";
  assert.ok(aaErrors(bad).some((e) => /must be #rrggbb/.test(e)), "a non-hex tier fails too");
});
