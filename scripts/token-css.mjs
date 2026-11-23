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

/** The text tiers and the page surfaces they must reach AA on (4.5:1) in their own theme. */
export const TEXT_TIERS = ["color-text-strong", "color-text-body", "color-text-muted", "color-text-faint"];
export const PAGE_SURFACES = ["color-panel", "color-app", "color-canvas"];

const lum = (hex) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio of two #rrggbb colours. */
export const contrastRatio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Every text tier × page surface × theme pair of tokens.json below 4.5:1 (or not a plain hex), as messages. */
export function aaErrors(tokens) {
  const sem = tokens.semantic;
  const errors = [];
  for (const theme of ["dark", "light"])
    for (const t of TEXT_TIERS)
      for (const s of PAGE_SURFACES) {
        const [fg, bg] = [sem[t]?.[theme], sem[s]?.[theme]];
        if (!/^#[0-9a-f]{6}$/i.test(fg ?? "") || !/^#[0-9a-f]{6}$/i.test(bg ?? "")) {
          errors.push(`${theme} ${t} on ${s}: both must be #rrggbb (got ${fg} on ${bg})`);
          continue;
        }
        const r = contrastRatio(fg, bg);
        if (r < 4.5) errors.push(`${theme} ${t} ${fg} on ${s} ${bg}: ${r.toFixed(2)}:1`);
      }
  return errors;
}
