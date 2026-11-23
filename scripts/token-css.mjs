// Shared by scripts/build-tokens.mjs (tokens.css) and scripts/lab.mjs (the Design Lab's live preview), so a value
// tried in the Lab is written the way the build writes it. No Node imports: the docs site runs it in the browser.

/**
 * Font sizes are written in px in tokens.json (easy to read) and emitted in rem, so text follows the browser's default
 * font size setting (WCAG 1.4.4): 14px → 0.875rem at the default 16px. Line heights are unitless and stay.
 */
export const toRem = (key, v) => (/^text-[a-z-]+$/.test(key) && /^\d+(\.\d+)?px$/.test(v) ? `${+(parseFloat(v) / 16).toFixed(4)}rem` : v);

/** Style tokens that are a utility of their own instead of a Tailwind theme variable: key → [utility, CSS property]. */
export const UTILITY_KEYS = { "card-border": ["border-card", "border"] };

/** The selectors the shape block (tokens.json "shape") sets its --semi-* variables on. */
export const SHAPE_SELECTORS = [":root", "[data-theme]"];

/** The text tiers and the page surfaces they must reach AA (4.5:1) on in their own theme. */
export const TEXT_TIERS = ["color-text-strong", "color-text-body", "color-text-muted", "color-text-faint"];
export const PAGE_SURFACES = ["color-panel", "color-app", "color-canvas"];
/** Surfaces every tier but text-faint must reach AA on (text-faint: page surfaces and the card only). */
export const CARD_SURFACES = ["color-card", "color-card-field", "color-raised"];
/** Translucent item fills (hover / selected / checked rows): checked composited over the panel and over the card. */
export const ITEM_FILLS = ["color-item-hover", "color-item-selected", "color-item-checked"];
export const ITEM_BASES = ["color-panel", "color-card"];
/** Where each tier is checked: [surface, fill over it or null]. */
export const aaPairs = (tier) => [
  ...PAGE_SURFACES.map((s) => [s, null]),
  ["color-card", null],
  ...(tier === "color-text-faint"
    ? []
    : [...CARD_SURFACES.slice(1).map((s) => [s, null]), ...ITEM_BASES.flatMap((b) => ITEM_FILLS.map((f) => [b, f]))]),
];

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const rgbOf = (hex) => [0, 2, 4].map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255);
const hexOf = (rgb) => `#${rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0")).join("")}`;
const toOklab = (hex) => {
  const [r, g, b] = rgbOf(hex).map(lin);
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};
const fromOklab = ([L, a, b]) => {
  const [l, m, s] = [L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.291485548 * b].map((x) => x ** 3);
  return hexOf(
    [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map(gam),
  );
};

/**
 * A semantic token's value in a theme as [#rrggbb, alpha]: a hex, var(--semi-<name>) of another token, or
 * color-mix(in oklab, A [p%], B [q%]) of those (with `transparent`: A at that alpha). Null when it is something else.
 */
export function resolveColor(tokens, key, theme, seen = []) {
  if (seen.includes(key)) return null;
  const raw = tokens.semantic[key]?.[theme];
  return raw == null ? null : resolveValue(tokens, raw.trim(), theme, [...seen, key]);
}
function resolveValue(tokens, v, theme, seen) {
  if (/^#[0-9a-f]{6}$/i.test(v)) return [v.toLowerCase(), 1];
  if (v === "transparent") return ["#000000", 0];
  const ref = /^var\(--semi-([a-z0-9-]+)\)$/.exec(v);
  if (ref) return resolveColor(tokens, `color-${ref[1]}`, theme, seen);
  const mix = /^color-mix\(in oklab,\s*(.+?)(?:\s+([\d.]+)%)?\s*,\s*(.+?)(?:\s+([\d.]+)%)?\s*\)$/.exec(v);
  if (!mix) return null;
  const [A, B] = [resolveValue(tokens, mix[1], theme, seen), resolveValue(tokens, mix[3], theme, seen)];
  if (!A || !B) return null;
  let [p, q] = [mix[2], mix[4]].map((x) => (x == null ? null : +x / 100));
  if (p == null && q == null) p = q = 0.5;
  else if (p == null) p = 1 - q;
  else if (q == null) q = 1 - p;
  const [pa, pb] = [(p / (p + q)) * A[1], (q / (p + q)) * B[1]]; // premultiplied weights
  const alpha = pa + pb;
  if (alpha === 0) return ["#000000", 0];
  const [la, lb] = [toOklab(A[0]), toOklab(B[0])];
  return [fromOklab(la.map((x, i) => (x * pa + lb[i] * pb) / alpha)), alpha];
}
/** A translucent colour [hex, alpha] painted over an opaque #rrggbb (sRGB source-over, as the browser composites). */
export const composite = ([hex, a], base) => hexOf(rgbOf(hex).map((c, i) => c * a + rgbOf(base)[i] * (1 - a)));

const lum = (hex) => {
  const [r, g, b] = rgbOf(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio of two #rrggbb colours. */
export const contrastRatio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Surfaces a button or a New tag sits on: the page surfaces and the card. */
export const MARK_BASES = [...PAGE_SURFACES, "color-card"];
/** Each button variant's text on its fill (1.0, #146), checked like the text tiers: [variant, text token, fill token]. */
export const BUTTON_PAIRS = [
  ["subtle", "color-text-strong", "color-subtle-button"],
  ["subtle hover", "color-text-strong", "color-tint-hover"],
  ["surface", "color-text-strong", "color-raised"],
  ["surface hover", "color-text-strong", "color-raised-2"],
  ["inverse", "color-on-inverted", "color-inverted"],
  ["inverse hover", "color-on-inverted", "color-inverted-hover"],
  ["outline / ghost hover", "color-text-strong", "color-item-hover"],
  ["ghost", "color-text-body", null],
  ["primary", "color-on-primary", "color-primary"],
  ["primary hover", "color-on-primary", "color-primary-hover"],
  ["secondary", "color-on-secondary", "color-secondary"],
  ["secondary hover", "color-on-secondary", "color-secondary-hover"],
  ["disabled", "color-text-muted", "color-subtle-button"],
  ["count badge", "color-on-primary", "color-primary"],
  ["new tag", "color-on-new-tag", "color-new-tag"],
];

/**
 * The New tag's text in a theme: the brand primary when it reaches 4.5:1 on its 18% tint over every MARK_BASES surface,
 * else the theme's strong text. The token build checks Semi's default with it; the brand generator picks a kit's with it.
 */
export function newTagText(tokens, primary, theme) {
  const ok = MARK_BASES.every((b) => {
    const base = resolveColor(tokens, b, theme);
    return base && contrastRatio(primary, composite([primary, 0.18], base[0])) >= 4.5;
  });
  return ok ? primary.toLowerCase() : tokens.semantic["color-text-strong"][theme].toLowerCase();
}

/** BUTTON_PAIRS below 4.5:1 in either theme, over every MARK_BASES surface (a translucent fill composited over it). */
export function buttonAaErrors(tokens) {
  const errors = [];
  for (const theme of ["dark", "light"])
    for (const [name, fgKey, fillKey] of BUTTON_PAIRS)
      for (const b of MARK_BASES) {
        const fg = resolveColor(tokens, fgKey, theme);
        const base = resolveColor(tokens, b, theme);
        const fill = fillKey ? resolveColor(tokens, fillKey, theme) : null;
        if (!fg || fg[1] !== 1 || !base || base[1] !== 1 || (fillKey && !fill)) {
          errors.push(`${theme} button ${name}: ${fgKey} on ${fillKey ?? b} does not resolve to a colour`);
          continue;
        }
        const over = fill ? composite(fill, base[0]) : base[0];
        const r = contrastRatio(fg[0], over);
        if (r < 4.5) errors.push(`${theme} button ${name}: ${fgKey} ${fg[0]} on ${fillKey ?? ""} over ${b} ${over}: ${r.toFixed(2)}:1`);
      }
  return errors;
}

/**
 * Every text tier × surface × theme pair of tokens.json below 4.5:1, as messages: all tiers on panel / app / canvas
 * and card; strong / body / muted also on card-field, raised and the item fills (hover / selected / checked) over the
 * panel and over the card. Tiers must be plain hex; a surface must resolve (hex, var(--semi-*), color-mix in oklab).
 */
export function aaErrors(tokens) {
  const sem = tokens.semantic;
  const errors = [];
  for (const theme of ["dark", "light"])
    for (const t of TEXT_TIERS)
      for (const [s, fill] of aaPairs(t)) {
        const fg = sem[t]?.[theme];
        const where = fill ? `${fill} over ${s}` : s;
        const base = resolveColor(tokens, s, theme);
        const over = fill ? resolveColor(tokens, fill, theme) : null;
        if (!/^#[0-9a-f]{6}$/i.test(fg ?? "") || !base || base[1] !== 1 || (fill && !over)) {
          errors.push(`${theme} ${t} on ${where}: both must be #rrggbb or resolve to one (got ${fg} on ${fill ? sem[fill]?.[theme] + " over " : ""}${sem[s]?.[theme]})`);
          continue;
        }
        const bg = over ? composite(over, base[0]) : base[0];
        const r = contrastRatio(fg, bg);
        if (r < 4.5) errors.push(`${theme} ${t} ${fg} on ${where} ${bg}: ${r.toFixed(2)}:1`);
      }
  return errors.concat(buttonAaErrors(tokens));
}
