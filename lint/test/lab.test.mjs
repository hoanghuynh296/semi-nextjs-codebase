// node --test lint/test — Design Lab (scripts/lab.mjs, scripts/lab-apply.mjs), generator params (brand/params.mjs) and
// the sample-brand comparison (brand/compare.mjs, semi-brand compare).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyDraft, decodeDraft, diffDraft, emptyDraft, encodeDraft, fontOf, isEmptyDraft, labCss, mergedValues, setDraftValue, validateDraft } from "../../scripts/lab.mjs";
import { writeParamsSource } from "../../scripts/lab-apply.mjs";
import { PARAMS, mergeParams } from "../../brand/params.mjs";
import { generateBrand } from "../../brand/generate.mjs";
import { compareSamples, comparisonOk } from "../../brand/compare.mjs";
import { SAMPLES } from "../../brand/samples.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const sources = { tokens, params: PARAMS };
const draft = (over) => ({ ...emptyDraft(), ...over });
const ROOT = new URL("../../", import.meta.url).pathname;

test("draft: a value equal to the source drops out; an empty draft writes no CSS", () => {
  let d = setDraftValue(emptyDraft(), ["type", "text-ui"], "15px", sources);
  assert.deepEqual(d.type, { "text-ui": "15px" });
  d = setDraftValue(d, ["shape", "radius-card"], "1rem", sources);
  d = setDraftValue(d, ["type", "text-ui"], "12px", sources); // back to the source value
  assert.deepEqual(d.type, {});
  assert.deepEqual(d.shape, { "radius-card": "1rem" });
  d = setDraftValue(d, ["shape", "radius-card"], tokens.shape["radius-card"].value, sources);
  assert.ok(isEmptyDraft(d));
  assert.equal(labCss(d, sources), "");
  d = setDraftValue(d, ["params", "hoverStep"], PARAMS.hoverStep, sources); // numbers too
  assert.ok(isEmptyDraft(d));
});

test("labCss: px in rem like the build, the shape on :root and every theme scope, product scopes after :root", () => {
  const css = labCss(draft({ type: { "text-ui": "15px" }, shape: { "radius-card": "2rem" } }), sources);
  assert.match(css, /:root \{\n {2}--text-ui: 0\.9375rem;/);
  assert.match(css, /:root,\n\[data-theme\] \{[^}]*--semi-radius-card: 2rem;/);
  assert.doesNotMatch(css, /data-style/);
  assert.doesNotMatch(css, /--card-border:/, "card-border is a utility of its own, no theme variable");
  // a density's own sizes stay after the :root override
  assert.ok(css.indexOf('[data-density="compact"]') > css.indexOf(":root {"));
  assert.match(css, /\[data-density="compact"\] \{[^}]*--text-copy: 0\.8125rem;/);
});

test("validateDraft: unknown keys, wrong units and unknown params are refused", () => {
  assert.deepEqual(validateDraft(draft({ type: { "text-ui": "15px", "text-ui--line-height": "1.4" } }), sources), []);
  const errors = validateDraft(
    draft({
      type: { "text-nope": "12px", "text-ui": "1rem" },
      density: { compact: { spacing: "4px" } },
      shape: { "radius-card": "1rem; color: red", nope: "1" },
      params: { hoverStep: "big", nope: 1 },
      styles: { soft: {} },
    }),
    sources,
  );
  for (const m of [/type\.text-nope/, /type\.text-ui: "1rem"/, /density\.compact\.spacing/, /shape\.radius-card/, /shape\.nope/, /params\.hoverStep/, /params\.nope/, /^styles:/])
    assert.ok(errors.some((e) => m.test(e)), `${m} in ${errors.join(" | ")}`);
  assert.match(validateDraft({ type: {} }, sources).join(), /\$semiLab/);
});

test("applyDraft: values land in tokens.json (notes kept); a font change updates shape $fonts", () => {
  const geist = tokens.shape.$fonts.find((f) => f.family === "Geist");
  const d = draft({
    type: { "text-figure": "20px", "text-tag": "11px" },
    density: { compact: { spacing: "0.2rem", sizes: { "text-ui": "11px" } } },
    shape: { "font-display": `var(--font-display-family, var(${geist.variable})), "Geist", sans-serif`, "radius-card": "1rem" },
    params: { hoverStep: 0.08 },
  });
  const out = applyDraft(d, { tokens, params: PARAMS });
  assert.equal(out.tokens.type["text-figure"].value, "20px");
  assert.ok(out.tokens.type["text-figure"].note, "note kept");
  assert.equal(out.tokens.type["text-tag"].value, "11px");
  assert.deepEqual(out.tokens.product.density.compact.sizes, { ...tokens.product.density.compact.sizes, "text-ui": "11px" });
  assert.equal(out.tokens.product.density.compact.spacing, "0.2rem");
  assert.equal(out.tokens.shape["radius-card"].value, "1rem");
  assert.ok(out.tokens.shape["radius-card"].note, "note kept");
  assert.deepEqual(out.tokens.shape.$fonts.map((f) => f.family), ["Geist"]);
  assert.equal(out.params.hoverStep, 0.08);
  assert.equal(tokens.shape["radius-card"].value, "0.75rem", "sources untouched");
  assert.equal(fontOf(tokens.shape["font-sans"].value), "--font-geist");
  assert.equal(fontOf(tokens.shape["font-display"].value), null, "font-display falls back to the UI sans");
  // the diff lists exactly what changed, per file
  const rows = diffDraft(d, sources);
  assert.deepEqual([...new Set(rows.map((r) => r.file))], ["tokens/tokens.json", "brand/params.mjs"]);
  assert.ok(rows.some((r) => r.key === "shape.radius-card" && r.from === "0.75rem" && r.to === "1rem"));
  assert.ok(rows.some((r) => r.key === "hoverStep" && r.from === PARAMS.hoverStep && r.to === 0.08));
});

test("share link: a draft survives #lab= encoding, Vietnamese text included", () => {
  const d = draft({ shape: { "shadow-card": "0 1px 2px var(--semi-shadow-tint) /* bóng nhẹ */" } });
  assert.deepEqual(decodeDraft(encodeDraft(d)), d);
  assert.match(encodeDraft(d), /^[\w-]+$/);
});

test("params: default params give the same brand as no params", () => {
  const brand = { name: "T", package: "@t/b", primary: "#2563EB", secondary: "#9333EA", fonts: { sans: "Geist" } };
  assert.equal(generateBrand(brand, { tokens }).css, generateBrand(brand, { tokens, params: mergeParams({}) }).css);
  assert.equal(mergeParams({ hoverStep: 0.1 }).hoverStep, 0.1);
});

test("params source: lab-apply rewrites only the PARAMS literal, and the file still imports", async () => {
  const src = readFileSync(join(ROOT, "brand/params.mjs"), "utf8");
  const next = writeParamsSource(src, mergeParams({ hoverStep: 0.09 }));
  assert.equal(next.split("// <params>")[0], src.split("// <params>")[0], "notes untouched");
  const dir = mkdtempSync(join(tmpdir(), "semi-params-"));
  writeFileSync(join(dir, "params.mjs"), next);
  const mod = await import(join(dir, "params.mjs"));
  assert.equal(mod.PARAMS.hoverStep, 0.09);
  assert.throws(() => writeParamsSource("export const PARAMS = {};", PARAMS), /<params>/);
});

test("compare: every sample brand passes with the current params", () => {
  const ok = compareSamples({ tokens });
  assert.equal(ok.length, SAMPLES.length);
  assert.ok(comparisonOk(ok), ok.filter((r) => r.after.fails?.length).map((r) => `${r.name}: ${r.after.fails}`).join("\n"));
});

test("lab:apply --dry prints the changes and writes nothing; an invalid patch exits 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lab-"));
  const before = readFileSync(join(ROOT, "tokens/tokens.json"), "utf8");
  const good = join(dir, "good.json");
  writeFileSync(good, JSON.stringify(draft({ type: { "text-ui": "13px" }, shape: { "radius-card": "1rem" } })));
  const out = execFileSync(process.execPath, [join(ROOT, "scripts/lab-apply.mjs"), good, "--dry"], { encoding: "utf8" });
  assert.match(out, /type\.text-ui: 12px → 13px/);
  assert.match(out, /shape\.radius-card: 0\.75rem → 1rem/);
  assert.equal(readFileSync(join(ROOT, "tokens/tokens.json"), "utf8"), before);
  const invalid = join(dir, "invalid.json");
  writeFileSync(invalid, JSON.stringify(draft({ type: { "text-ui": "big" } })));
  assert.equal(spawnSync(process.execPath, [join(ROOT, "scripts/lab-apply.mjs"), invalid], { encoding: "utf8" }).status, 1);
  assert.equal(spawnSync(process.execPath, [join(ROOT, "brand/cli.mjs"), "compare"], { encoding: "utf8" }).status, 0);
});
