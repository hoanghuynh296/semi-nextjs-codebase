// node --test lint/test — the token build's AA check of the text tiers (scripts/token-css.mjs aaErrors).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aaErrors, contrastRatio, PAGE_SURFACES, TEXT_TIERS } from "../../scripts/token-css.mjs";

const tokens = JSON.parse(readFileSync(new URL("../../tokens/tokens.json", import.meta.url), "utf8"));

test("every text tier reaches 4.5:1 on panel, app and canvas in both themes", () => {
  assert.deepEqual(aaErrors(tokens), []);
  assert.deepEqual(TEXT_TIERS, ["color-text-strong", "color-text-body", "color-text-muted", "color-text-faint"]);
  assert.deepEqual(PAGE_SURFACES, ["color-panel", "color-app", "color-canvas"]);
});

test("a failing tier or a non-hex value is reported (and fails the build)", () => {
  const bad = structuredClone(tokens);
  bad.semantic["color-text-faint"].light = "#737373"; // 3.98:1 on the light canvas #ebebeb
  bad.semantic["color-text-muted"].dark = "var(--x)";
  const errors = aaErrors(bad);
  assert.ok(errors.some((e) => e.startsWith("light color-text-faint #737373 on color-canvas")), errors.join("\n"));
  assert.ok(errors.some((e) => e.includes("dark color-text-muted") && e.includes("#rrggbb")));
});

test("contrastRatio is the WCAG ratio", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(1), "21.0");
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
});
