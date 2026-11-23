// Every sample brand (./samples.mjs) generated with two sets of generator parameters (./params.mjs), side by side:
// the check a core change of the generator needs before it ships (Design Lab "So sánh", `semi-brand compare`).
// No Node imports: the docs site runs it in the browser.
import { deltaE } from "./color.mjs";
import { generateBrand } from "./generate.mjs";
import { SAMPLES } from "./samples.mjs";

/** One generated brand, summed up: failing pairs (soft ones apart), the fills. */
export function summarize(result) {
  if ("error" in result) return { error: result.error };
  const { tokens, report } = result;
  return {
    fails: report.filter((r) => !r.ok && !r.soft).map((r) => `${r.check}: ${r.ratio.toFixed(2)} < ${r.min}`),
    soft: report.filter((r) => !r.ok && r.soft).length,
    pairs: report.length,
    primary: tokens.primary,
    secondary: tokens.secondary,
  };
}

const run = (brand, sources, params) => {
  try {
    return summarize(generateBrand(brand, { tokens: sources.tokens, params }));
  } catch (e) {
    return { error: e.message };
  }
};

/**
 * Each sample with `before` (default: the current params) and `after` params:
 * [{ id, name, why, before, after, moved }] where moved = the largest OKLab ΔE of a derived colour between the two.
 * @param {{ tokens: any }} sources
 * @param {{ before?: any, after?: any, samples?: typeof SAMPLES }} [options]
 */
export function compareSamples({ tokens }, { before, after, samples = SAMPLES } = {}) {
  return samples.map((s) => {
    const b = run(s.brand, { tokens }, before);
    const a = run(s.brand, { tokens }, after);
    const parts = (x) => [x.primary, x.secondary].filter(Boolean).flatMap((f) => [f.hover, f.on]);
    const moved = b.primary && a.primary ? Math.max(0, ...parts(b).map((c, i) => deltaE(c, parts(a)[i]))) : 0;
    return { id: s.id, name: s.name, why: s.why, primary: s.brand.primary, before: b, after: a, moved: +moved.toFixed(3) };
  });
}

/** Rows of the comparison as text (the CLI and lab-apply print it). */
export function formatComparison(rows) {
  const pad = (s, n) => String(s).padEnd(n);
  const fill = (x) => (x.error ? "lỗi" : `${x.primary.on} · hover ${x.primary.hover}`);
  const lines = [`${pad("Brand", 16)}${pad("Màu", 9)}${pad("Chữ · hover trước", 30)}${pad("Chữ · hover sau", 30)}${pad("Lệch", 11)}Chưa đạt (trước → sau)`];
  for (const r of rows)
    lines.push(
      `${pad(r.name, 16)}${pad(r.primary, 9)}${pad(fill(r.before), 30)}${pad(fill(r.after), 30)}${pad(`ΔE ${r.moved.toFixed(2)}`, 11)}${r.before.error ? "lỗi" : r.before.fails.length} → ${r.after.error ? "lỗi" : r.after.fails.length}`,
    );
  for (const r of rows) {
    const newFails = r.after.error ? [r.after.error] : r.after.fails.filter((f) => !(r.before.fails ?? []).some((b) => b.split(":")[0] === f.split(":")[0]));
    for (const f of newFails) lines.push(`  ✗ ${r.name}: ${f}`);
  }
  return lines.join("\n");
}

/** True when `after` makes no sample fail a pair that passed before (or fail to generate). */
export const comparisonOk = (rows) => rows.every((r) => !r.after.error && r.after.fails.every((f) => (r.before.fails ?? []).some((b) => b.split(":")[0] === f.split(":")[0])));
