// Tuning of the brand generator (brand/generate.mjs). Since 1.0 the generator derives only the text colour on each
// brand fill and its hover, so one number is left. The same for every brand, so changing it re-colours every brand
// kit's hover on its next build: a core change (CHANGELOG + /semi-brand update note). Try values in the Design Lab of
// the docs site first (/lab/, docs/LAB.md); its patch is applied with `npm run lab:apply` (it rewrites the PARAMS
// literal below, nothing else).

/** Notes shown in the Lab and kept here as the documentation of each parameter. */
export const PARAM_NOTES = {
  hoverStep: "How far (OKLCH lightness) the hover of a brand fill moves away from the text on it: darker under white text, lighter under dark text",
};

// <params> (rewritten by scripts/lab-apply.mjs)
export const PARAMS = {
  "hoverStep": 0.06
};
// </params>

/** PARAMS with `over` laid on top (one level deep: an object value is merged key by key). */
export function mergeParams(over) {
  const out = {};
  for (const [k, v] of Object.entries(PARAMS)) {
    const o = over?.[k];
    out[k] = v && typeof v === "object" ? { ...v, ...(o && typeof o === "object" ? o : {}) } : o ?? v;
  }
  return out;
}
