// 1.0.0 (#141): the foundation tokens. One look (no data-style), pure neutral surfaces, four text tiers (text-strong
// replaces text-contrast), no brand-derived colour (accent-fg / accent-subtle / accent-line are gone; selection is the
// neutral item-selected), brand fills only for main buttons (bg-accent / bg-action → bg-primary), and the 1.0 type scale
// (text-ui is the 12px base UI size; the old sizes map to the nearest new role). Exact renames, one pass, so a second
// run changes nothing. What needs a judgement is flagged (and in the CHANGELOG "Migration" note).
//
// Brand colour is not carried onto text or lines: text-accent / text-action (and placeholder- / caret-) → text-strong,
// border- / ring- / outline- / divide-accent → *-outline-line, fill- / stroke-accent → *-strong. Only fills keep the
// brand (bg-accent → bg-primary, flagged) and decoration-accent → decoration-primary (the active big-tab underline).
//
// CSS variables: reads (var(--semi-accent), var(--color-text-contrast) …) are renamed. Declarations an app wrote
// (`--semi-accent: #f00;`, `"--semi-panel": x` in a style object, `--color-accent:` in an app @theme) are NEVER renamed: renaming `--semi-accent:` to
// `--semi-primary:` would silently override the brand kit's fill. They are left as they are (a removed name then sets
// nothing) and flagged, with every declaration of a surface / text / line token apps must not set. `--semi-contrast`
// (the private contrast colour every line and fill mixes) is not a rename source: only `--color-contrast` →
// `--color-strong` and `--semi-text-contrast` → `--semi-text-strong`.
export const version = "1.0.0";
export const id = "foundation";
export const description =
  "text-contrast → text-strong, bg-accent/action → bg-primary, text-/border-/ring-accent → text-strong / *-outline-line, accent-fg → text-strong, accent-subtle → item-selected, accent-line → outline-line, old type sizes → the 1.0 scale (a field's max-sm:text-title-lg → max-sm:text-input), data-style removed; --semi-* declarations are flagged, not renamed";

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
// A brand fill (accent / action and their hover) after a text or line utility: neutral, not the brand. A ring or an
// outline is a focus indicator: ring-focus / outline-focus (≥ 3:1), never the faint outline-line.
const BRAND_FILLS = new Set(["accent", "accent-hover", "action", "action-hover"]);
const brandOnNonFill = (util) =>
  /^(?:text|placeholder|caret|fill|stroke)$/.test(util) ? "strong" : /^(?:ring|outline)$/.test(util) ? "focus" : /^(?:border|divide|ring-offset)/.test(util) ? "outline-line" : null;
const sizeRx = new RegExp(`(^|[^\\w-])text-(${names(SIZES)})(?![\\w-])`, "g");
// CSS variables: --color-<name> and --semi-<name> (colours), --text-<size> (sizes, with their --line-height etc.).
// A declaration is left alone and flagged: a name followed by `:` (CSS, or a quoted / computed object key
// `["--semi-x" as string]:`) or the name passed to style.setProperty("--semi-x", …).
const DECL_AFTER = `["']?(?:\\s+as\\s+[\\w.<>]+)?\\s*\\]?\\s*:`;
const colorVarRx = new RegExp(`(?<!setProperty\\(\\s*["'])--(color|semi)-(${names(COLORS)})(?![\\w-])(?!${DECL_AFTER})`, "g");
/** --semi-* names apps must not set: removed in 1.0, or a Semi surface / text / line token (the brand kit sets the fills). */
const REMOVED_VAR = /^(?:accent(?:-[\w-]+)?|action(?:-[\w-]+)?|on-accent|on-action|text-contrast|primary-\d{2,3})$/;
const PROTECTED_VAR =
  /^(?:canvas|app|panel(?:-\d)?|field(?:-[\w-]+)?|raised(?:-2)?|card(?:-field)?|text-[\w-]+|strong|body|muted|faint|line(?:-[\w-]+)?|divider|focus|outline-line|control-line|item-[\w-]+|subtle-button|inverted(?:-[\w-]+)?|on-inverted|tint(?:-[\w-]+)?|contrast|overlay)$/;
const declRx = new RegExp(`setProperty\\(\\s*["']--(semi|color)-([\\w-]+)|--(semi|color)-([\\w-]+)(?=${DECL_AFTER})`, "g");
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
      // accent / action on text or a line: neutral (decoration-accent, the big-tab underline, stays the brand).
      const neutral = BRAND_FILLS.has(name) && brandOnNonFill(util);
      if (neutral) return `${pre}${util}-${neutral}`;
      // accent-* the Tailwind accent-color utility: accent-accent → accent-primary is still right.
      return `${pre}${util}-${COLORS[name]}`;
    })
    .replace(sizeRx, (m, pre, size) => `${pre}text-${SIZES[size]}`)
    .replace(colorVarRx, (m, ns, name) => {
      if (ns === "semi" && name === "contrast") return m; // the private contrast colour, not the old text-contrast
      // --semi-* has no "strong": the text tier's source variable is --semi-text-strong.
      const to = COLORS[name];
      return `--${ns}-${ns === "semi" && (to === "strong" || name === "text-contrast") ? "text-strong" : to}`;
    })
    .replace(sizeVarRx, (m, size) => `--text-${SIZES[size]}`)
    .replace(/\s+data-style=(?:"[^"]*"|'[^']*'|\{["'][^"']*["']\})/g, "");
}

/** What a person must check after the rename (returned as flags; also in the CHANGELOG "Migration" note). */
export function foundationFlags(before, after) {
  const flags = [];
  if (/(^|[^\w-])(?:bg|text|border|ring|from|to|via|fill|stroke)-primary-\d{2,3}(?![\w-])/.test(after))
    flags.push("primary-50…900 brand scale removed: use bg-primary (main button / attention) or a neutral token");
  if (/(^|[^\w-])accent-accent(?![\w-])/.test(before))
    flags.push("accent-accent → accent-primary: a checkbox / range tinted with the brand; Semi's checked controls are neutral (bg-inverted)");
  if (/(^|[^\w-])bg-accent(?![\w-])/.test(before))
    flags.push("bg-accent → bg-primary: the brand fill is only for the main button, attention badges / tags and the active big-tab underline; a checked control or selection is bg-inverted / bg-item-selected");
  if (/(^|[^\w-])(?:text|border|decoration|fill|stroke)-accent-fg(?![\w-])/.test(before))
    flags.push("accent-fg → strong: brand-coloured text is gone (links, check marks, active tabs are neutral)");
  if (/data-style|\[data-style/.test(after)) flags.push("data-style left in an expression or a CSS selector: remove it (one look)");
  if (/(^|[^\w-])text-ui(?![\w-])|--text-ui(?![\w-])/.test(before))
    flags.push("text-ui is now 12px, was 14: reading copy (sentences, descriptions, table cells) → text-copy; UI text (labels, buttons, meta) stays text-ui");
  const declared = new Set([...before.matchAll(declRx)].map((m) => (m[1] ? `${m[1]}-${m[2]}` : `${m[3]}-${m[4]}`)));
  for (const v of declared) {
    const name = v.replace(/^(?:semi|color)-/, "");
    if (REMOVED_VAR.test(name) || PROTECTED_VAR.test(name))
      flags.push(`app CSS sets --${v}: remove it (brand-override) or use the brand kit${REMOVED_VAR.test(name) ? " (removed in 1.0: it now sets nothing; not renamed)" : ""}`);
  }
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
