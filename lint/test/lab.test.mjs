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
import { generateBrand, scale } from "../../brand/generate.mjs";
import { compareSamples, comparisonOk } from "../../brand/compare.mjs";
import { SAMPLES } from "../../brand/samples.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const styles = read("tokens/styles.json");
const sources = { tokens, styles, params: PARAMS };
const draft = (over) => ({ ...emptyDraft(), ...over });
const ROOT = new URL("../../", import.meta.url).pathname;

test("draft: a value equal to the source drops out; an empty draft writes no CSS", () => {
  let d = setDraftValue(emptyDraft(), ["type", "text-ui"], "15px", sources);
  assert.deepEqual(d.type, { "text-ui": "15px" });
  d = setDraftValue(d, ["styles", "soft", "radius-card"], "1rem", sources);
  d = setDraftValue(d, ["type", "text-ui"], "14px", sources); // back to the source value
  assert.deepEqual(d.type, {});
  assert.deepEqual(d.styles, { soft: { "radius-card": "1rem" } });
  d = setDraftValue(d, ["styles", "soft", "radius-card"], "1.25rem", sources);
  assert.ok(isEmptyDraft(d));
  assert.equal(labCss(d, sources), "");
  d = setDraftValue(d, ["params", "ladder", "500"], 0.635, sources); // numbers too
  assert.ok(isEmptyDraft(d));
});

test("labCss: px in rem like the build, styles in tokens.css order, product scopes after :root", () => {
  const css = labCss(draft({ type: { "text-ui": "15px" }, styles: { flat: { "radius-card": "2rem" } } }), sources);
  assert.match(css, /:root \{\n {2}--text-ui: 0\.9375rem;/);
  // the default style's block (which also matches :root) comes before the others, so a soft page keeps soft values
  const flat = css.indexOf('[data-style="flat"]');
  const soft = css.indexOf('[data-style="soft"]');
  assert.ok(flat > 0 && soft > flat, "flat block before soft");
  assert.match(css, /--semi-radius-card: 2rem;/);
  assert.match(css, /--semi-radius-card: 1\.25rem;/, "soft keeps its own radius");
  assert.doesNotMatch(css, /--card-border:/, "card-border is a utility of its own, no theme variable");
  // a density's own text-ui stays after the :root override
  assert.ok(css.indexOf('[data-density="compact"]') > css.indexOf(":root {"));
  assert.match(css, /\[data-density="compact"\] \{[^}]*--text-ui: 0\.8125rem;/);
});

test("validateDraft: unknown keys, wrong units and a ladder that does not go darker are refused", () => {
  assert.deepEqual(validateDraft(draft({ type: { "text-ui": "15px", "text-ui--line-height": "1.4" } }), sources), []);
  const errors = validateDraft(
    draft({
      type: { "text-nope": "12px", "text-ui": "1rem" },
      density: { compact: { spacing: "4px" } },
      styles: { soft: { "radius-card": "1rem; color: red" }, nope: { x: "1" } },
      params: { ladder: { 400: 0.6, 500: 0.7 }, nope: 1 },
    }),
    sources,
  );
  for (const m of [/type\.text-nope/, /type\.text-ui: "1rem"/, /density\.compact\.spacing/, /styles\.soft\.radius-card/, /styles\.nope/, /params\.nope/, /params\.ladder: độ sáng/])
    assert.ok(errors.some((e) => m.test(e)), `${m} in ${errors.join(" | ")}`);
  assert.match(validateDraft({ type: {} }, sources).join(), /\$semiLab/);
});

test("applyDraft: values land in the source shapes (notes kept); a font change updates the style's fonts", () => {
  const styleFiles = { flat: read("tokens/styles/flat.json"), soft: read("tokens/styles/soft.json"), sharp: read("tokens/styles/sharp.json") };
  const geist = Object.values(styles.styles[0].fonts).find((f) => f.family === "Geist");
  const d = draft({
    type: { "text-figure": "20px", "text-ui": "15px" },
    density: { compact: { spacing: "0.2rem", sizes: { "text-ui": "14px" } } },
    styles: { soft: { "font-sans": `var(--font-sans-family, var(${geist.variable})), "Geist", sans-serif`, "radius-card": "1rem" } },
    params: { ladder: { 500: 0.62 }, fillReach: 0.1 },
  });
  const out = applyDraft(d, { tokens, styleFiles, params: PARAMS });
  assert.equal(out.tokens.type["text-figure"].value, "20px");
  assert.ok(out.tokens.type["text-figure"].note, "note kept");
  assert.equal(out.tokens.type["text-ui"], "15px");
  assert.deepEqual(out.tokens.product.density.compact.sizes, { "text-ui": "14px", "text-ui-lg": "14px" });
  assert.equal(out.tokens.product.density.compact.spacing, "0.2rem");
  assert.equal(out.styleFiles.soft.tokens["radius-card"].value, "1rem");
  assert.deepEqual(out.styleFiles.soft.fonts.map((f) => f.family), ["Geist", "Plus Jakarta Sans"]);
  assert.equal(out.params.ladder[500], 0.62);
  assert.equal(out.params.ladder[400], PARAMS.ladder[400]);
  assert.equal(out.params.fillReach, 0.1);
  assert.equal(tokens.type["text-ui"], "14px", "sources untouched");
  assert.equal(fontOf(styles.styles.find((s) => s.id === "soft").tokens["font-sans"]), "--font-jakarta");
  // the diff lists exactly what changed, per file
  const rows = diffDraft(d, sources);
  assert.deepEqual([...new Set(rows.map((r) => r.file))], ["tokens/tokens.json", "tokens/styles/soft.json", "brand/params.mjs"]);
  assert.ok(rows.some((r) => r.key === "ladder.500" && r.from === 0.635 && r.to === 0.62));
});

test("share link: a draft survives #lab= encoding, Vietnamese text included", () => {
  const d = draft({ styles: { soft: { "shadow-card": "0 1px 2px var(--semi-shadow-tint) /* bóng nhẹ */" } } });
  assert.deepEqual(decodeDraft(encodeDraft(d)), d);
  assert.match(encodeDraft(d), /^[\w-]+$/);
});

test("params: default params give the same brand as no params; a new ladder moves the shades", () => {
  const brand = { name: "T", package: "@t/b", primary: "#2563EB", secondary: "#9333EA", neutral: "tinted", styles: { default: "flat", allowed: ["flat", "soft", "sharp"] }, fonts: { sans: "Geist", display: "Geist" } };
  assert.equal(generateBrand(brand, { tokens, styles }).css, generateBrand(brand, { tokens, styles, params: mergeParams({}) }).css);
  const moved = scale("#2563EB", mergeParams({ ladder: { 300: 0.7 } }));
  assert.notEqual(moved[300], scale("#2563EB")[300]);
  assert.equal(moved[600], scale("#2563EB")[600], "the brand's own shade stays the brand colour");
  assert.deepEqual(mergeParams({ ladder: { 500: 0.6 } }).ladder[400], PARAMS.ladder[400]);
});

test("params source: lab-apply rewrites only the PARAMS literal, and the file still imports", async () => {
  const src = readFileSync(join(ROOT, "brand/params.mjs"), "utf8");
  const next = writeParamsSource(src, mergeParams({ ladder: { 500: 0.6 }, statusGap: 25 }));
  assert.equal(next.split("// <params>")[0], src.split("// <params>")[0], "notes untouched");
  const dir = mkdtempSync(join(tmpdir(), "semi-params-"));
  writeFileSync(join(dir, "params.mjs"), next);
  const mod = await import(join(dir, "params.mjs"));
  assert.equal(mod.PARAMS.ladder[500], 0.6);
  assert.equal(mod.PARAMS.statusGap, 25);
  assert.throws(() => writeParamsSource("export const PARAMS = {};", PARAMS), /<params>/);
});

test("compare: every sample brand passes with the current params; a squashed ladder is caught", () => {
  const ok = compareSamples({ tokens, styles });
  assert.equal(ok.length, SAMPLES.length);
  assert.ok(comparisonOk(ok), ok.filter((r) => r.after.fails.length).map((r) => `${r.name}: ${r.after.fails}`).join("\n"));
  assert.ok(ok.every((r) => r.moved === 0));
  const flat = Object.fromEntries(Object.keys(PARAMS.ladder).map((s, i) => [s, 0.62 - i * 0.01]));
  const bad = compareSamples({ tokens, styles }, { after: { ladder: flat } });
  assert.equal(comparisonOk(bad), false);
  assert.ok(mergedValues(draft({ params: { ladder: flat } }), sources).params.ladder[900] < 0.6);
});

test("semi-brand compare and lab:apply --dry: exit 1 when a sample brand loses a pair, nothing written", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lab-"));
  const flat = Object.fromEntries(Object.keys(PARAMS.ladder).map((s, i) => [s, 0.62 - i * 0.01]));
  const bad = join(dir, "bad.json");
  writeFileSync(bad, JSON.stringify(draft({ params: { ladder: flat } })));
  const cli = spawnSync(process.execPath, [join(ROOT, "brand/cli.mjs"), "compare", "--params", bad], { encoding: "utf8" });
  assert.equal(cli.status, 1, cli.stdout + cli.stderr);
  assert.match(cli.stdout, /✗/);
  const before = readFileSync(join(ROOT, "brand/params.mjs"), "utf8");
  const apply = spawnSync(process.execPath, [join(ROOT, "scripts/lab-apply.mjs"), bad], { encoding: "utf8" });
  assert.equal(apply.status, 1);
  assert.equal(readFileSync(join(ROOT, "brand/params.mjs"), "utf8"), before);
  const good = join(dir, "good.json");
  writeFileSync(good, JSON.stringify(draft({ type: { "text-ui": "15px" } })));
  const out = execFileSync(process.execPath, [join(ROOT, "scripts/lab-apply.mjs"), good, "--dry"], { encoding: "utf8" });
  assert.match(out, /type\.text-ui: 14px → 15px/);
  const invalid = join(dir, "invalid.json");
  writeFileSync(invalid, JSON.stringify(draft({ type: { "text-ui": "big" } })));
  assert.equal(spawnSync(process.execPath, [join(ROOT, "scripts/lab-apply.mjs"), invalid], { encoding: "utf8" }).status, 1);
  assert.equal(spawnSync(process.execPath, [join(ROOT, "brand/cli.mjs"), "compare"], { encoding: "utf8" }).status, 0);
});
