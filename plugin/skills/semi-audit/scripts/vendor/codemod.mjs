// Token-level codemod from physical Tailwind colours / sizes to Semi tokens (used by /semi-init). No dependencies.
//
// It rewrites class tokens only inside string literals (lint/classes.mjs), never prose or comments, keeps variants
// (hover:, md:, group-hover:) and collapses legacy pairs: in "bg-white dark:bg-slate-900" the base maps to bg-panel,
// which already switches with the theme, so the dark: override is dropped. Whatever has no safe mapping is reported
// as unresolved for a person to decide; nothing is guessed.
import { analyse, extractApply, extractStrings, parseColour, splitToken, tokensOf } from "./classes.mjs";

/** Neutral → semantic token, per utility family. "?" = depends on whether the app was light- or dark-first. */
const NEUTRAL = {
  bg: { white: "panel", black: "canvas", 50: "field", 100: "field", 200: "raised", 300: "raised", 700: "raised", 800: "panel", 900: "app", 950: "canvas" },
  text: { white: "contrast", black: "contrast", 950: "contrast", 900: "contrast", 800: "contrast", 700: "body", 600: "body", 500: "muted", 400: "muted", 300: { light: "muted", dark: "body" }, 200: { dark: "contrast" }, 100: { dark: "contrast" }, 50: { dark: "contrast" } },
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
  if (/^shadow(?:-sm|-md)?$/.test(utility)) return ""; // flat: no drop shadows on surfaces
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
  const lead = value.match(/^\s*/)[0];
  const trail = value.slice(lead.length).match(/\s*$/)[0];
  const tokens = tokensOf(value);
  if (!tokens.length) return { value, changes: [], unresolved: [] };
  const changes = [];
  const unresolved = [];
  const out = [];
  const semanticKeys = new Set(); // property|variants already set by a semantic token in this string
  const parsed = tokens.map((t) => ({ t, ...splitToken(t) }));

  for (const p of parsed) {
    if (p.variants.includes("dark") || p.variants.includes("light")) continue;
    const mapped = mapUtility(p.utility, p.variants, mode);
    const utility = mapped === undefined ? p.utility : mapped; // already-semantic bases count too
    const m = utility && utility.match(SEMANTIC);
    if (m) semanticKeys.add(keyOf(m[1], p.variants));
  }

  for (const p of parsed) {
    const themed = p.variants.includes("dark") || p.variants.includes("light");
    const mapped = mapUtility(p.utility, p.variants, mode);
    if (themed) {
      const c = parseColour(p.utility);
      if (c && semanticKeys.has(keyOf(c.prefix, p.variants))) {
        changes.push({ from: p.t, to: "" }); // the base is a semantic token now: the theme override is redundant
        continue;
      }
      // A lone dark:/light: colour (no base for it in this string) needs a person: dropping it would lose a colour.
      if (c && (c.kind === "neutral" || (c.kind === "white-black" && !c.alpha) || c.kind === "arbitrary" || (c.kind === "hue" && mapped !== undefined))) {
        unresolved.push(p.t);
      }
      out.push(p.t);
      continue;
    }
    if (mapped === undefined) {
      out.push(p.t);
      continue;
    }
    if (mapped === null) {
      unresolved.push(p.t);
      out.push(p.t);
      continue;
    }
    const next = mapped === "" ? "" : [...p.variants, (p.important ? "!" : "") + mapped].join(":");
    changes.push({ from: p.t, to: next });
    if (next) out.push(next);
  }
  const deduped = out.filter((t, i) => out.indexOf(t) === i);
  return { value: lead + deduped.join(" ") + trail, changes, unresolved };
}

/** Light-first (bg-white / bg-*-50 …) or dark-first (bg-*-800/900/950 …) legacy styling, judged from the sources. */
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

/** Migrate a whole file. Only strings that contain at least one class token are rewritten. */
export function migrateSource(src, { css = false, mode = "light" } = {}) {
  const strings = css ? extractApply(src) : extractStrings(src);
  const edits = [];
  const changes = [];
  const unresolved = [];
  for (const s of strings) {
    if (s.start === undefined) continue;
    const raw = src.slice(s.start, s.end);
    if (raw.includes("\\")) continue; // escapes: leave for a person
    const r = migrateClassString(raw, mode);
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
  return { code, changes, unresolved };
}
