// Token-level codemod from physical Tailwind colours / sizes / radii to Semi tokens (used by /semi-new-app). No dependencies.
//
// It rewrites class tokens only inside string literals whose every token is a class (lint/classes.mjs `isClassList`),
// never prose, comments, SVG geometry, style values or tagged templates (glsl`…`). A string changes token for token:
// whitespace, line breaks and order stay, nothing is deduplicated. It keeps variants
// (hover:, md:, group-hover:) and collapses legacy pairs: in "bg-white dark:bg-slate-900" the base maps to bg-panel,
// which already switches with the theme, so the dark: override is dropped. Whatever has no safe mapping is reported
// as unresolved for a person to decide; nothing is guessed.
import { analyse, extractApply, extractStrings, inNonClassPosition, isClassList, parseColour, radiusToken, splitToken, tokensOf } from "./classes.mjs";

/** Neutral → semantic token, per utility family. "?" = depends on whether the app was light- or dark-first. */
const NEUTRAL = {
  // In a dark app a solid white / black fill is a deliberate element (toggle knob, swatch, logo tile): a person decides.
  bg: { white: { light: "panel" }, black: { light: "canvas" }, 50: "field", 100: "field", 200: "raised", 300: "raised", 700: "raised", 800: "panel", 900: "app", 950: "canvas" },
  text: { white: "contrast", black: { light: "contrast" }, 950: "contrast", 900: "contrast", 800: "contrast", 700: "body", 600: "body", 500: "muted", 400: "muted", 300: { light: "muted", dark: "body" }, 200: { dark: "contrast" }, 100: { dark: "contrast" }, 50: { dark: "contrast" } },
  border: { white: { dark: "line" }, black: { light: "line" }, 50: "divider", 100: "divider", 200: "line", 300: "line", 400: "line-hover", 600: "line-hover", 700: "line", 800: "line", 900: "divider", 950: "divider" },
  stop: { white: "panel", black: "canvas", 50: "field", 100: "field", 800: "panel", 900: "canvas", 950: "canvas" },
  icon: { white: "contrast", black: "contrast", 900: "contrast", 800: "contrast", 700: "body", 600: "body", 500: "muted", 400: "muted" },
};
const FAMILY = (prefix) =>
  prefix === "bg" ? "bg"
  : prefix === "text" || prefix === "placeholder" ? "text"
  : prefix.startsWith("border") || prefix === "divide" || prefix === "ring" || prefix === "outline" ? "border"
  : prefix === "from" || prefix === "via" || prefix === "to" ? "stop"
  : prefix === "fill" || prefix === "stroke" ? "icon"
  : null;

/** Hues that have a text-tone-* token; the others fall back to the nearest one. */
const TONE = {
  purple: "purple", violet: "violet", indigo: "indigo", blue: "blue", sky: "sky", cyan: "cyan", teal: "teal",
  emerald: "emerald", green: "emerald", lime: "emerald", amber: "amber", yellow: "amber", orange: "orange",
  rose: "rose", red: "rose", pink: "pink", fuchsia: "pink",
};
const SIZES = { 11: "caption", 12: "label", 13: "ui", 14: "ui-lg", 15: "title", 16: "title-lg", 18: "kpi", 20: "heading-sm", 22: "heading", 24: "heading-lg", 26: "display" };

/** Map one utility (no variants). Returns a string, "" (drop it), or null (leave it, report as unresolved). */
export function mapUtility(utility, variants = [], mode = "light") {
  const size = utility.match(/^text-\[(\d+)px\]$/);
  if (size) return SIZES[size[1]] ? `text-${SIZES[size[1]]}` : null;
  const control = utility.match(/^(h|w|size|min-h|min-w)-\[34px\]$/);
  if (control) return `${control[1]}-control`; // the toolbar control size, which the style sets (34px in Flat)
  const radius = radiusToken(utility);
  if (radius !== undefined) return radius; // same value in the default style, follows the app's style after
  if (/^shadow(?:-sm|-md)?$/.test(utility)) return "shadow-card"; // a resting surface shadow: the style decides (none in Flat)
  if (/^shadow-(?:lg|xl|2xl)$/.test(utility)) return "shadow-overlay"; // big shadows only ever meant "floating layer"

  const c = parseColour(utility);
  if (!c) return undefined; // not a colour: untouched
  if (c.kind === "arbitrary") return null;
  if (c.kind === "white-black" && c.alpha) return undefined; // overlays (bg-black/50, bg-white/10) are allowed

  const family = FAMILY(c.prefix);
  if (c.kind === "white-black" || c.kind === "neutral") {
    if (!family || c.alpha) return null; // shadow-gray-200, bg-slate-900/80: a person decides
    let token = NEUTRAL[family][c.kind === "white-black" ? c.family : c.shade];
    if (token && typeof token === "object") token = token[mode];
    return token ? `${c.prefix}-${token}` : null;
  }

  // Chromatic hue
  if (c.family === "primary") {
    if (family === "text" || family === "icon") return `${c.prefix}-accent-fg`;
    const focus = variants.some((v) => v.startsWith("focus"));
    if (c.prefix === "ring" || c.prefix === "outline") return `${c.prefix}-focus`;
    if (family === "border" && focus) return `${c.prefix}-focus`;
    if (family === "border") return c.alpha && Number(c.alpha) <= 60 ? `${c.prefix}-accent-line` : `${c.prefix}-accent-fg`;
    if (c.prefix === "bg" && c.alpha) return Number(c.alpha) <= 15 ? "bg-accent-subtle" : "bg-accent-subtle-hover";
    return undefined; // bg-primary-500 etc. are brand fills, kept
  }
  const tone = TONE[c.family];
  if (family === "text" || family === "icon") return tone ? `${c.prefix}-tone-${tone}` : null;
  const state = variants.includes("active") ? "active" : variants.includes("hover") || variants.some((v) => v.startsWith("group-hover")) ? "hover" : "static";
  if (c.alpha || c.shade > 300) return undefined; // tinted (bg-rose-500/10) or solid status fills (bg-emerald-400) are fine
  if (c.prefix === "bg" && c.shade <= 200) return `bg-${c.family}-500/${state === "active" ? 20 : state === "hover" ? 15 : 10}`;
  if (family === "border" && c.shade >= 100) return `${c.prefix}-${c.family}-500/${state === "hover" ? 30 : 20}`;
  if (family === "border" && c.shade === 50) return `${c.prefix}-${c.family}-500/10`;
  return null;
}

const SEMANTIC = /^(.*)-(canvas|app|panel|field|raised|contrast|body|muted|line|line-hover|divider|accent-fg|on-accent|(?:danger|success|warning|info)-fg|tone-[a-z]+)$/;
const keyOf = (prefix, variants) => `${FAMILY(prefix) === "border" ? prefix : FAMILY(prefix) ?? prefix}|${variants.filter((v) => v !== "dark" && v !== "light").join(":")}`;

/** Rewrite one class string. Returns { value, changes: [{ from, to }], unresolved: [token] }. */
export function migrateClassString(value, mode = "light") {
  // [whitespace before, token] pairs: the output replaces tokens in place, so spacing, line breaks and order survive.
  const pieces = [...value.matchAll(/(\s*)(\S+)/g)].map((m) => ({ ws: m[1], t: m[2] }));
  const trail = value.slice(pieces.reduce((n, p) => n + p.ws.length + p.t.length, 0));
  if (!pieces.length) return { value, changes: [], unresolved: [] };
  const changes = [];
  const unresolved = [];
  const semanticKeys = new Set(); // property|variants already set by a semantic token in this string
  const parsed = pieces.map((p) => ({ ...p, ...splitToken(p.t) }));

  for (const p of parsed) {
    if (p.variants.includes("dark") || p.variants.includes("light")) continue;
    const mapped = mapUtility(p.utility, p.variants, mode);
    const utility = mapped === undefined ? p.utility : mapped; // already-semantic bases count too
    const m = utility && utility.match(SEMANTIC);
    if (m) semanticKeys.add(keyOf(m[1], p.variants));
  }

  for (const p of parsed) {
    p.next = p.t;
    const themed = p.variants.includes("dark") || p.variants.includes("light");
    const mapped = mapUtility(p.utility, p.variants, mode);
    if (themed) {
      const c = parseColour(p.utility);
      if (c && semanticKeys.has(keyOf(c.prefix, p.variants))) {
        changes.push({ from: p.t, to: "" }); // the base is a semantic token now: the theme override is redundant
        p.next = "";
        continue;
      }
      // A lone dark:/light: colour (no base for it in this string) needs a person: dropping it would lose a colour.
      if (c && (c.kind === "neutral" || (c.kind === "white-black" && !c.alpha) || c.kind === "arbitrary" || (c.kind === "hue" && mapped !== undefined))) {
        unresolved.push(p.t);
      }
      continue;
    }
    if (mapped === undefined) continue;
    if (mapped === null) {
      unresolved.push(p.t);
      continue;
    }
    p.next = mapped === "" ? "" : [...p.variants, (p.important ? "!" : "") + mapped].join(":");
    changes.push({ from: p.t, to: p.next });
  }

  // A dropped token takes its leading whitespace with it; when that whitespace held the line break, the next token's
  // plain spaces go instead, so the string keeps its lines.
  let out = "";
  let started = false;
  let carry = null; // whitespace of the first dropped token(s), kept for the first token that stays
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    if (!p.next) {
      if (!started) carry ??= p.ws;
      else if (p.ws.includes("\n") && parsed[i + 1] && !parsed[i + 1].ws.includes("\n")) carry = p.ws;
      continue;
    }
    out += (carry ?? p.ws) + p.next;
    carry = null;
    started = true;
  }
  return { value: out + (started ? "" : carry ?? "") + trail, changes, unresolved };
}

/** Light-first (bg-white / bg-*-50 …) or dark-first (bg-*-800/900/950 …) by class count only; /semi-check uses detectTheme. */
export function detectMode(sources) {
  let light = 0;
  let dark = 0;
  for (const { src, css } of sources) {
    for (const { value } of css ? extractApply(src) : extractStrings(src)) {
      for (const t of tokensOf(value)) {
        const { variants, utility } = splitToken(t);
        if (variants.includes("dark")) continue;
        const c = parseColour(utility);
        if (!c || c.prefix !== "bg" || c.alpha) continue;
        if (c.family === "white" || (c.kind === "neutral" && c.shade <= 200)) light++;
        if (c.family === "black" || (c.kind === "neutral" && c.shade >= 800)) dark++;
      }
    }
  }
  return dark > light ? "dark" : "light";
}

// ---- Theme of an existing app, from what its page paints ---------------------------------------------------------

/** Relative luminance (WCAG) of a hex / rgb() / white / black value, or null when it is not a plain colour. */
function luminance(value) {
  const v = value.trim().toLowerCase();
  let rgb = null;
  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1].length <= 4 ? [...hex[1].slice(0, 3)].map((c) => c + c).join("") : hex[1].slice(0, 6);
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const fn = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (fn) rgb = fn.slice(1, 4).map(Number);
  if (v === "white") rgb = [255, 255, 255];
  if (v === "black") rgb = [0, 0, 0];
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const DARK_SCOPE = /prefers-color-scheme\s*:\s*dark|\.dark\b|data-theme\s*=\s*["']?dark|data-mode\s*=\s*["']?dark/;
/** Declarations of a CSS file outside dark-only scopes (.dark, [data-theme=dark], prefers-color-scheme: dark). */
function baseDeclarations(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const stack = [];
  let buf = "";
  for (const ch of src) {
    if (ch === "{") {
      stack.push(buf.trim());
      buf = "";
    } else if (ch === "}" || ch === ";") {
      const d = buf.match(/^\s*([-\w]+)\s*:\s*([\s\S]+?)\s*(?:!important)?\s*$/);
      if (d && stack.length && !stack.some((sel) => DARK_SCOPE.test(sel))) out.push({ selector: stack[stack.length - 1], prop: d[1], value: d[2] });
      buf = "";
      if (ch === "}") stack.pop();
    } else buf += ch;
  }
  return out;
}

const SURFACE_VARS = ["--background", "--color-background", "--color-app", "--color-canvas", "--color-panel", "--bg", "--app-bg"];
const fromLuminance = (l) => (l === null ? null : l < 0.18 ? "dark" : "light");
const hexOf = (v) => v.trim();

/**
 * Theme of an existing app: "dark" | "light" | "unknown", with the evidence (docs/DECISIONS.md, issue #12).
 * Signals, strongest first: defaultTheme / data-theme / class "dark" on <html> or <body> in the root layout; the
 * background of html / body / :root and surface variables (--background, --color-app, @theme …) in its CSS; then the
 * count of solid light vs dark bg-* classes. Disagreeing page signals, or a class count without a clear winner (only one
 * side, or at least 3 and twice the other), give
 * "unknown": the caller asks the user (fix.mjs --theme) instead of guessing light.
 * `sources`: [{ p?, src, css }].
 */
export function detectTheme(sources) {
  const signals = [];
  const vars = {};
  for (const { src, css } of sources.filter((x) => x.css)) {
    for (const d of baseDeclarations(src)) if (d.prop.startsWith("--")) vars[d.prop] = d.value;
  }
  const resolve = (v, depth = 0) => {
    const m = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
    if (!m || depth > 4) return v;
    return vars[m[1]] !== undefined ? resolve(vars[m[1]], depth + 1) : m[2] ? resolve(m[2], depth + 1) : v;
  };
  for (const { p, src, css } of sources) {
    if (css) {
      for (const d of baseDeclarations(src)) {
        if (/^(?:html|body|:root)(?:\s*,\s*(?:html|body|:root))*$/.test(d.selector) && /^background(?:-color)?$/.test(d.prop)) {
          const value = resolve(d.value.split(/\s+/)[0]);
          const theme = fromLuminance(luminance(value));
          if (theme) signals.push({ theme, evidence: `nền ${d.selector} ${hexOf(value)}${p ? ` (${p})` : ""}` });
        }
      }
      continue;
    }
    if (!/<html\b/.test(src)) continue;
    const def = src.match(/defaultTheme\s*=\s*\{?\s*["'](dark|light)["']/);
    if (def) signals.push({ theme: def[1], evidence: `defaultTheme="${def[1]}"`, strong: true });
    for (const tag of ["html", "body"]) {
      const open = src.match(new RegExp(`<${tag}\\b[^>]*>`));
      if (!open) continue;
      const dt = open[0].match(/data-theme\s*=\s*["'](dark|light)["']/);
      if (dt) signals.push({ theme: dt[1], evidence: `<${tag} data-theme="${dt[1]}">`, strong: true });
      const cls = open[0].match(/className\s*=\s*\{?\s*["'`]([^"'`]*)["'`]/)?.[1] ?? "";
      for (const t of tokensOf(cls)) {
        if (t === "dark") signals.push({ theme: "dark", evidence: `<${tag} className="dark">`, strong: true });
        const c = parseColour(splitToken(t).utility);
        if (!c || c.prefix !== "bg" || c.alpha || splitToken(t).variants.length) continue;
        const theme = c.family === "white" || (c.kind === "neutral" && c.shade <= 200) ? "light" : c.family === "black" || (c.kind === "neutral" && c.shade >= 800) ? "dark" : null;
        if (theme) signals.push({ theme, evidence: `<${tag} className="${t}">` });
      }
    }
  }
  for (const name of SURFACE_VARS) {
    if (vars[name] === undefined) continue;
    const theme = fromLuminance(luminance(resolve(vars[name])));
    if (theme) signals.push({ theme, evidence: `${name}: ${hexOf(resolve(vars[name]))}` });
    break; // the first surface variable found is the page; panels may differ
  }
  const strong = signals.filter((x) => x.strong);
  const pick = strong.length ? strong : signals;
  if (pick.length) {
    const themes = new Set(pick.map((x) => x.theme));
    if (themes.size === 1) return { theme: pick[0].theme, evidence: pick.map((x) => x.evidence).join(", ") };
    return { theme: "unknown", evidence: `tín hiệu trái nhau: ${pick.map((x) => `${x.evidence} → ${x.theme}`).join(", ")}` };
  }
  let light = 0;
  let dark = 0;
  for (const { src, css } of sources) {
    for (const { value } of css ? extractApply(src) : extractStrings(src)) {
      for (const t of tokensOf(value)) {
        const { variants, utility } = splitToken(t);
        if (variants.includes("dark")) continue;
        const c = parseColour(utility);
        if (!c || c.prefix !== "bg" || c.alpha) continue;
        if (c.family === "white" || (c.kind === "neutral" && c.shade <= 200)) light++;
        if (c.family === "black" || (c.kind === "neutral" && c.shade >= 800)) dark++;
      }
    }
  }
  const evidence = `đếm class nền: ${light} sáng, ${dark} tối`;
  const [hi, lo] = [Math.max(light, dark), Math.min(light, dark)];
  if ((hi && !lo) || (hi >= 3 && hi >= 2 * lo)) return { theme: light > dark ? "light" : "dark", evidence };
  return { theme: "unknown", evidence };
}

/**
 * Migrate a whole file. Only class lists are rewritten (every token a class, not an SVG / style attribute, not a
 * tagged template); a string the mapping would change that is not a class list is returned in `skipped` for a person.
 */
export function migrateSource(src, { css = false, mode = "light" } = {}) {
  const strings = css ? extractApply(src) : extractStrings(src);
  const edits = [];
  const changes = [];
  const unresolved = [];
  const skipped = [];
  for (const s of strings) {
    if (s.start === undefined) continue;
    const raw = src.slice(s.start, s.end);
    if (raw.includes("\\")) continue; // escapes: leave for a person
    const r = migrateClassString(raw, mode);
    if (!r.changes.length && !r.unresolved.length) continue;
    if (!css && inNonClassPosition(src, s)) continue; // SVG geometry, style values, glsl`…`: never classes
    if (!css && !isClassList(raw)) {
      if (r.changes.length) skipped.push({ line: s.line, value: raw.trim().replace(/\s+/g, " ").slice(0, 80) });
      continue;
    }
    for (const ch of r.changes) changes.push({ line: s.line, ...ch });
    for (const u of r.unresolved) unresolved.push({ line: s.line, token: u });
    if (r.value !== raw) edits.push([s.start, s.end, r.value]);
  }
  let code = src;
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0])) code = code.slice(0, start) + value + code.slice(end);
  // Findings the codemod cannot fix (literal colour values, off-scale sizes, arbitrary colours) are reported too.
  for (const f of analyse(code, { css })) {
    if (f.rule === "literal-colour-value" && !unresolved.some((u) => u.line === f.line && u.token === f.token)) unresolved.push({ line: f.line, token: f.token });
  }
  return { code, changes, unresolved, skipped };
}
