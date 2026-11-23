// node --test lint/test — the token build's AA check of the text tiers (scripts/token-css.mjs aaErrors).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aaErrors, aaPairs, composite, contrastRatio, ITEM_FILLS, PAGE_SURFACES, resolveColor, TEXT_TIERS } from "../../scripts/token-css.mjs";

const tokens = JSON.parse(readFileSync(new URL("../../tokens/tokens.json", import.meta.url), "utf8"));

test("every text tier reaches 4.5:1 on panel, app, canvas and card; all but faint also on card-field, raised and the item fills", () => {
  assert.deepEqual(aaErrors(tokens), []);
  assert.deepEqual(TEXT_TIERS, ["color-text-strong", "color-text-body", "color-text-muted", "color-text-faint"]);
  assert.deepEqual(PAGE_SURFACES, ["color-panel", "color-app", "color-canvas"]);
  const where = (t) => aaPairs(t).map(([s, f]) => (f ? `${f}/${s}` : s));
  assert.deepEqual(where("color-text-faint"), ["color-panel", "color-app", "color-canvas", "color-card"]);
  const muted = where("color-text-muted");
  for (const s of ["color-card", "color-card-field", "color-raised"]) assert.ok(muted.includes(s), s);
  for (const f of ITEM_FILLS) for (const b of ["color-panel", "color-card"]) assert.ok(muted.includes(`${f}/${b}`), `${f} over ${b}`);
});

test("a failing tier or a non-hex value is reported (and fails the build)", () => {
  const bad = structuredClone(tokens);
  bad.semantic["color-text-faint"].light = "#737373"; // 3.98:1 on the light canvas #ebebeb
  bad.semantic["color-text-muted"].dark = "var(--x)";
  const errors = aaErrors(bad);
  assert.ok(errors.some((e) => e.startsWith("light color-text-faint #737373 on color-canvas")), errors.join("\n"));
  assert.ok(errors.some((e) => e.includes("dark color-text-muted") && e.includes("#rrggbb")));
});

test("the 0.x muted / faint values fail on the card and on a selected row in a card (why 1.0 moved them)", () => {
  const old = structuredClone(tokens);
  Object.assign(old.semantic["color-text-muted"], { dark: "#ababab", light: "#636363" });
  Object.assign(old.semantic["color-text-faint"], { dark: "#858585", light: "#6a6a6a" });
  const errors = aaErrors(old);
  assert.ok(errors.some((e) => /^dark color-text-muted #ababab on color-item-selected over color-card #444444: 4\.24:1/.test(e)), errors.join("\n"));
  assert.ok(errors.some((e) => /^light color-text-muted #636363 on color-item-selected over color-card #c1c1c1: 3\.34:1/.test(e)), errors.join("\n"));
  assert.ok(errors.some((e) => /^light color-text-muted #636363 on color-card-field #dadada/.test(e)));
  assert.ok(errors.some((e) => /^dark color-text-faint #858585 on color-card #232323: 4\.26:1/.test(e)));
  assert.ok(errors.some((e) => /^light color-text-faint #6a6a6a on color-card #e3e3e3: 4\.21:1/.test(e)));
  // faint is not checked on card-field / raised / item fills
  assert.ok(!errors.some((e) => /color-text-faint .* on (color-card-field|color-raised|color-item)/.test(e)));
});

test("resolveColor: hex, var(--semi-*), color-mix in oklab (with transparent → alpha); composite paints it over a base", () => {
  assert.deepEqual(resolveColor(tokens, "color-panel", "light"), ["#ffffff", 1]);
  assert.deepEqual(resolveColor(tokens, "color-panel-4", "dark"), [tokens.semantic["color-panel"].dark, 1]);
  assert.deepEqual(resolveColor(tokens, "color-card", "dark"), ["#232323", 1]); // panel #1a1a1a 95% + white
  assert.deepEqual(resolveColor(tokens, "color-card", "light"), ["#e3e3e3", 1]); // app #f3f3f3 95% + black
  assert.deepEqual(resolveColor(tokens, "color-item-selected", "dark"), ["#ffffff", 0.15]);
  assert.deepEqual(resolveColor(tokens, "color-item-selected", "light"), ["#000000", 0.15]);
  assert.equal(composite(["#000000", 0.5], "#ffffff"), "#808080");
  assert.equal(resolveColor({ semantic: { a: { dark: "oklch(0.5 0 0)" } } }, "a", "dark"), null);
  const t = { semantic: { "color-a": { x: "#000000" }, "color-b": { x: "#ffffff" }, m: { x: "color-mix(in oklab, var(--semi-a), var(--semi-b))" } } };
  assert.equal(resolveColor(t, "m", "x")[0], "#636363"); // oklab L 0.5 → sRGB 0x63
});

test("contrastRatio is the WCAG ratio", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(1), "21.0");
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
});

test("light item fills are visible on the card and step hover < checked < selected", () => {
  const card = resolveColor(tokens, "color-card", "light")[0];
  const r = (f) => contrastRatio(composite(resolveColor(tokens, f, "light"), card), card);
  const [hover, checked, selected] = ["color-item-hover", "color-item-checked", "color-item-selected"].map(r);
  assert.ok(hover >= 1.2 && checked > hover + 0.05 && selected > checked + 0.05, `${hover} ${checked} ${selected}`);
});
