// Colour maths for the brand generator: sRGB hex ↔ OKLCH (Björn Ottosson's Oklab), WCAG contrast, gamut fitting.
// No dependencies; runs in Node and in the browser (Storybook brand preview).

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** "#0a0" / "#00aa00" / "rgb(0 170 0)" / "rgba(0, 170, 0, 0.5)" → { r, g, b, a } with r/g/b in 0…1. */
export function parseColor(input) {
  const s = String(input).trim();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a };
  }
  return null;
}

export const isHex = (s) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s).trim());

/** { r, g, b } (0…1, gamma) → { l, c, h } (OKLCH, h in degrees). */
export function rgbToOklch({ r, g, b }) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const h = c < 1e-6 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

/** OKLCH → { r, g, b } (0…1, gamma, may be out of gamut). */
export function oklchToRgb({ l, c, h }) {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: toGamma(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    g: toGamma(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    b: toGamma(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  };
}

const inGamut = ({ r, g, b }) => [r, g, b].every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH → hex, lowering chroma (same lightness and hue) until the colour fits in sRGB. */
export function oklchToHex({ l, c, h }) {
  let lo = 0;
  let hi = c;
  let rgb = oklchToRgb({ l, c, h });
  if (!inGamut(rgb)) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToRgb({ l, c: mid, h }))) lo = mid;
      else hi = mid;
    }
    rgb = oklchToRgb({ l, c: lo, h });
  }
  const to = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`;
}

export const hexToOklch = (hex) => rgbToOklch(parseColor(hex));

/** WCAG relative luminance of an opaque colour. */
export function luminance(color) {
  const { r, g, b } = typeof color === "string" ? parseColor(color) : color;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio of two opaque colours. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => p - q);
  return (y + 0.05) / (x + 0.05);
}

/** Smallest hue distance in degrees. */
export const hueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/** Distance of two colours in OKLab (0 = same colour; ≈0.02 is barely visible, 0.1 clearly another shade). */
export function deltaE(a, b) {
  const p = hexToOklch(a);
  const q = hexToOklch(b);
  const ab = ({ c, h }) => [c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  const [pa, pb] = ab(p);
  const [qa, qb] = ab(q);
  return Math.hypot(p.l - q.l, pa - qa, pb - qb);
}

/** `fg` at `alpha` over the opaque `bg` (sRGB, as the browser composites), as hex. */
export function blend(fg, bg, alpha) {
  const f = parseColor(fg);
  const b = parseColor(bg);
  const mix = (k) => Math.round((f[k] * alpha + b[k] * (1 - alpha)) * 255).toString(16).padStart(2, "0");
  return `#${mix("r")}${mix("g")}${mix("b")}`;
}
