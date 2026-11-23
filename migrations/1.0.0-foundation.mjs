// 1.0.0 (#141): the foundation tokens. One look (no data-style), pure neutral surfaces, four text tiers (text-strong
// replaces text-contrast), no brand-derived colour (accent-fg / accent-subtle / accent-line are gone; selection is the
// neutral item-selected), brand fills only for main buttons (accent / action → primary), and the 1.0 type scale
// (text-ui is the 12px base UI size; the old sizes map to the nearest new role). Exact renames, one pass, so a second
// run changes nothing. What needs a judgement is flagged (and in the CHANGELOG "Migration" note).
export const version = "1.0.0";
export const id = "foundation";
export const description =
  "text-contrast → text-strong, accent/action → primary, accent-fg → text-strong, accent-subtle → item-selected, accent-line → outline-line, old type sizes → the 1.0 scale (a field's max-sm:text-title-lg → max-sm:text-input), data-style removed";

/** Colour names after a utility prefix (bg-, text-, border-, ring- …) and in CSS variables. */
export const COLORS = {
  contrast: "strong",
  "text-contrast": "text-strong",
  "accent-fg": "strong",
  "accent-subtle-hover": "item-selected",
  "accent-subtle": "item-selected",
  "accent-line": "outline-line",
  "accent-hover": "primary-hover",
  "on-accent": "on-primary",
  accent: "primary",
  "action-hover": "primary-hover",
  "on-action": "on-primary",
  action: "primary",
};

/** Type sizes (text-<old> → text-<new>). text-ui keeps its name (now 12px), so it is not here. */
export const SIZES = {
  caption: "ui",
  label: "ui",
  "ui-lg": "lead",
  "title-lg": "lead",
  title: "lead",
  "heading-sm": "section",
  "heading-lg": "tab-xl",
  heading: "section",
  display: "tab-xl",
  kpi: "figure",
};

const PREFIX = "(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|fill|stroke|decoration|divide|placeholder|caret|from|via|to|shadow|inset-shadow|accent)";
const names = (o) => Object.keys(o).sort((a, b) => b.length - a.length).join("|");
const colorRx = new RegExp(`(^|[^\\w-])(${PREFIX})-(${names(COLORS)})(?![\\w-])`, "g");
const sizeRx = new RegExp(`(^|[^\\w-])text-(${names(SIZES)})(?![\\w-])`, "g");
// CSS variables: --color-<name> and --semi-<name> (colours), --text-<size> (sizes, with their --line-height etc.).
const colorVarRx = new RegExp(`--(color|semi)-(${names(COLORS)})(?![\\w-])`, "g");
const sizeVarRx = new RegExp(`--text-(${names(SIZES)})(?=--|[^\\w-]|$)`, "g");

// A field's phone size (16px below sm, iOS zoom) was max-sm:text-title-lg: it becomes the 16px text-input, not lead (15).
const fieldPhoneRx = /(^|[^\w-])max-sm:text-title-lg(?![\w-])/g;

/** One source text: classes (with any variants and /opacity) and CSS variables. */
export function migrateFoundation(src) {
  return src
    .replace(fieldPhoneRx, (m, pre) => `${pre}max-sm:text-input`)
    .replace(colorRx, (m, pre, util, name) => {
      // text-text-contrast never existed; "text-contrast" as a colour name is only reached through --color-text-contrast.
      if (name === "text-contrast") return m;
      // accent-* the Tailwind accent-color utility: accent-accent → accent-primary is still right.
      return `${pre}${util}-${COLORS[name]}`;
    })
    .replace(sizeRx, (m, pre, size) => `${pre}text-${SIZES[size]}`)
    .replace(colorVarRx, (m, ns, name) => `--${ns}-${ns === "semi" && name === "text-contrast" ? "text-strong" : COLORS[name]}`)
    .replace(sizeVarRx, (m, size) => `--text-${SIZES[size]}`)
    .replace(/\s+data-style=(?:"[^"]*"|'[^']*'|\{["'][^"']*["']\})/g, "");
}

/** What a person must check after the rename (returned as flags; also in the CHANGELOG "Migration" note). */
export function foundationFlags(before, after) {
  const flags = [];
  if (/(^|[^\w-])(?:bg|text|border|ring|from|to|via|fill|stroke)-primary-\d{2,3}(?![\w-])/.test(after))
    flags.push("primary-50…900 brand scale removed: use bg-primary (main button / attention) or a neutral token");
  if (/(^|[^\w-])bg-accent(?![\w-])/.test(before))
    flags.push("bg-accent → bg-primary: the brand fill is only for the main button, attention badges / tags and the active big-tab underline; a checked control or selection is bg-inverted / bg-item-selected");
  if (/(^|[^\w-])(?:text|border|decoration|fill|stroke)-accent-fg(?![\w-])/.test(before))
    flags.push("accent-fg → strong: brand-coloured text is gone (links, check marks, active tabs are neutral)");
  if (/data-style|\[data-style/.test(after)) flags.push("data-style left in an expression or a CSS selector: remove it (one look)");
  return flags;
}

export default function migrate({ files, read, write, flag }) {
  for (const f of files) {
    if (!/\.(tsx?|jsx?|mdx?|css)$/.test(f)) continue;
    const before = read(f);
    const after = migrateFoundation(before);
    write(f, after);
    if (flag) for (const msg of foundationFlags(before, after)) flag(f, msg);
  }
}
