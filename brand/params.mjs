// Tuning of the brand generator (brand/generate.mjs): the numbers that turn one brand colour into every colour a Semi
// product needs. The same for every brand, so changing one re-colours every brand kit on its next build: a core change
// (CHANGELOG + /semi-brand update note). Try values in the Design Lab of the docs site first (/lab/, docs/LAB.md); its
// patch is applied with `npm run lab:apply` (it rewrites the PARAMS literal below, nothing else).

/** Notes shown in the Lab and kept here as the documentation of each parameter. */
export const PARAM_NOTES = {
  ladder: "OKLCH lightness of every shade 50…900, the same for every brand (close to Tailwind v4 / Radix steps): primary-200 means the same thing in every brand",
  chroma:
    "How a shade's chroma follows from the brand colour: lighter shades fade towards `white` with the curve `lighter` (higher = keeps colour longer); darker shades lose up to `darker` of it towards black",
  fillReach: "How far (OKLab ΔE) the main button may move from the brand colour to stand out from the page (3:1) instead of blending in",
  tint: "Chroma of the primary's hue that each style's tinted text and lines take (text ×0.6, lines ×2)",
  surfaceTint: "Chroma that each style's tinted surfaces (canvas, app, panel, field, raised) take: large areas tinted above ~0.005 read as a colour cast",
  statusGap: "A status colour (danger, success, warning, info) closer than this to the primary's hue (OKLCH degrees) is turned away from it",
  statusTurn: "How far each status colour may turn away from the primary and still read as that status (OKLCH degrees)",
};

// <params> (rewritten by scripts/lab-apply.mjs)
export const PARAMS = {
  "ladder": {
    "50": 0.975,
    "100": 0.945,
    "200": 0.89,
    "300": 0.815,
    "400": 0.725,
    "500": 0.635,
    "600": 0.55,
    "700": 0.47,
    "800": 0.39,
    "900": 0.31
  },
  "chroma": {
    "lighter": 1.1,
    "darker": 0.35,
    "white": 0.99
  },
  "fillReach": 0.2,
  "tint": {
    "flat": 0.01,
    "soft": 0.016,
    "sharp": 0.005
  },
  "surfaceTint": {
    "flat": 0.003,
    "soft": 0.004,
    "sharp": 0.002
  },
  "statusGap": 30,
  "statusTurn": {
    "danger": 12,
    "success": 20,
    "warning": 12,
    "info": 20
  }
};
// </params>

/** PARAMS with `over` laid on top (one level deep: { ladder: { 500: 0.6 } } keeps the other shades). */
export function mergeParams(over) {
  const out = {};
  for (const [k, v] of Object.entries(PARAMS)) {
    const o = over?.[k];
    out[k] = v && typeof v === "object" ? { ...v, ...(o && typeof o === "object" ? o : {}) } : o ?? v;
  }
  return out;
}
