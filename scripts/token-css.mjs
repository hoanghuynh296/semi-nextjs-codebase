// Shared by scripts/build-tokens.mjs (tokens.css) and scripts/lab.mjs (the Design Lab's live preview), so a value
// tried in the Lab is written the way the build writes it. No Node imports: the docs site runs it in the browser.

/**
 * Font sizes are written in px in tokens.json (easy to read) and emitted in rem, so text follows the browser's default
 * font size setting (WCAG 1.4.4): 14px → 0.875rem at the default 16px. Line heights are unitless and stay.
 */
export const toRem = (key, v) => (/^text-[a-z-]+$/.test(key) && /^\d+(\.\d+)?px$/.test(v) ? `${+(parseFloat(v) / 16).toFixed(4)}rem` : v);

/** Style tokens that are a utility of their own instead of a Tailwind theme variable: key → [utility, CSS property]. */
export const UTILITY_KEYS = { "card-border": ["border-card", "border"] };

/** The selectors a style's block sets its --semi-* variables on (the default style also applies without data-style). */
export const styleSelectors = (id, isDefault) => [...(isDefault ? [":root", "[data-theme]"] : []), `[data-style="${id}"]`, `[data-style="${id}"] [data-theme]`];
