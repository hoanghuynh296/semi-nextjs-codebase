// Class-token analysis shared by semi-lint, /semi-audit and the /semi-init codemod. No dependencies.
//
// Regex over raw lines missed every new spelling of a colour (border-*-50, divide-*, from-*, …: issues #1–#4).
// Instead, this reads every string literal of a file (className="…", cn("…"), const X = "…", template parts, object
// values) plus @apply lines in CSS, splits them into class tokens, strips variants (hover:, dark:, md:, [&>*]:, !)
// and classifies the colour utility itself. A colour is only allowed when it is a Semi token; the palette rules below
// say which literal spellings are debt.

/** Utility prefixes that take a colour value (longest first so ring-offset wins over ring). */
const COLOUR_PREFIXES = [
  "ring-offset", "decoration", "placeholder", "outline", "divide", "border-x", "border-y", "border-t", "border-r",
  "border-b", "border-l", "border-s", "border-e", "border", "stroke", "accent", "shadow", "caret", "ring", "fill",
  "text", "from", "via", "bg", "to",
];
const NEUTRALS = new Set(["slate", "gray", "zinc", "neutral", "stone"]);
export const HUES = new Set([
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet",
  "purple", "fuchsia", "pink", "rose", "primary",
]);
const TEXTLIKE = new Set(["text", "fill", "stroke", "decoration", "placeholder", "caret", "accent"]);
const SURFACE = new Set(["bg", "divide", "ring", "border", "border-x", "border-y", "border-t", "border-r", "border-b", "border-l", "border-s", "border-e"]);

/** Split "md:hover:!bg-white/10" into { variants: ["md", "hover"], utility: "bg-white/10", important } (brackets aware). */
export function splitToken(token) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of token) {
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ":" && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  let utility = cur;
  let important = false;
  if (utility.startsWith("!")) (utility = utility.slice(1)), (important = true);
  if (utility.endsWith("!")) (utility = utility.slice(0, -1)), (important = true);
  return { variants: parts, utility, important };
}

/**
 * Colour part of a utility, or null. kind: "white-black" | "neutral" | "hue" | "arbitrary".
 * e.g. "border-t-slate-200/50" → { prefix: "border-t", kind: "neutral", family: "slate", shade: 200, alpha: "50" }
 */
export function parseColour(utility) {
  for (const prefix of COLOUR_PREFIXES) {
    if (!utility.startsWith(prefix + "-")) continue;
    const value = utility.slice(prefix.length + 1);
    let m = value.match(/^(white|black)(?:\/([\w.[\]%]+))?$/);
    if (m) return { prefix, kind: "white-black", family: m[1], shade: null, alpha: m[2] ?? null };
    m = value.match(/^([a-z]+)-(\d{2,3})(?:\/([\w.[\]%]+))?$/);
    if (m && (NEUTRALS.has(m[1]) || HUES.has(m[1]))) {
      return { prefix, kind: NEUTRALS.has(m[1]) ? "neutral" : "hue", family: m[1], shade: Number(m[2]), alpha: m[3] ?? null };
    }
    m = value.match(/^\[(#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb|color-mix)\(.*\))\](?:\/[\w.]+)?$/);
    if (m) return { prefix, kind: "arbitrary", family: m[1], shade: null, alpha: null };
    return null;
  }
  return null;
}

/** Which colour rule a utility breaks, or null. Mirrors docs/DESIGN_SYSTEM.md §2–§3c. */
export function colourRule(utility) {
  const c = parseColour(utility);
  if (!c) return null;
  if (c.kind === "arbitrary") return "hex-colour-class";
  if (c.kind === "white-black") return c.alpha ? null : "no-literal-palette"; // white/10 overlays and sheens stay allowed
  if (c.kind === "neutral") return "no-literal-palette";
  // Chromatic hue
  if (TEXTLIKE.has(c.prefix)) return "no-fixed-tone-text";
  if (SURFACE.has(c.prefix) && c.shade <= 200 && !c.alpha) return "no-solid-pastel-surfaces";
  return null;
}

/** text-[13px] / text-[0.8rem] → "arbitrary-text-size" (use the type scale). */
export function sizeRule(utility) {
  return /^text-\[\d+(?:\.\d+)?(?:px|rem|em)\]$/.test(utility) ? "arbitrary-text-size" : null;
}

const CSS_COLOUR_LITERAL = /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|(?:rgb|rgba|hsl|hsla|oklch)\([^)]*\))$/;
/** A whole string literal that is a CSS colour ("#fff", "rgb(0 0 0 / .5)"): inline styles, chart configs. */
export const isColourLiteral = (s) => CSS_COLOUR_LITERAL.test(s.trim());

/**
 * Every string literal of a JS/TS(X) source with the line it starts on and its raw [start, end) offsets:
 * '…', "…", `…` (template text outside ${…}).
 * Comments, regex literals and JSX text are skipped. A tokenizer, not a parser: it only has to find strings.
 */
export function extractStrings(src) {
  const out = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  let prevSignificant = ""; // last non-space char outside strings/comments, to tell a regex from a division
  // No `<` / `>` / `}`: in JSX those precede `</tag>` and `/>`, never a regex.
  const regexCanStart = () => !prevSignificant || /[(,=:[!&|?{;+\-*%~^]$/.test(prevSignificant) || /\b(?:return|typeof|case|do|else|in|of|void|yield|await)$/.test(prevSignificant);
  const pushWord = () => {
    const m = src.slice(Math.max(0, i - 12), i).match(/[A-Za-z_$][\w$]*$/);
    return m ? m[0] : src[i - 1];
  };

  function readQuoted(q) {
    const startLine = line;
    let s = "";
    i++;
    const start = i;
    while (i < n && src[i] !== q) {
      if (src[i] === "\\") {
        s += src[i + 1] ?? "";
        if (src[i + 1] === "\n") line++;
        i += 2;
        continue;
      }
      if (src[i] === "\n") {
        if (q !== "`") break; // unterminated ' or " string: stop at the line end
        line++;
      }
      s += src[i++];
    }
    out.push({ value: s, line: startLine, start, end: i });
    i++;
  }

  function readTemplate() {
    let startLine = line;
    let s = "";
    i++;
    let start = i;
    while (i < n && src[i] !== "`") {
      if (src[i] === "\\") {
        s += src[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (src[i] === "$" && src[i + 1] === "{") {
        out.push({ value: s, line: startLine, start, end: i });
        s = "";
        i += 2;
        skipExpression();
        startLine = line;
        start = i;
        continue;
      }
      if (src[i] === "\n") line++;
      s += src[i++];
    }
    out.push({ value: s, line: startLine, start, end: i });
    i++;
  }

  function skipExpression() {
    let depth = 1;
    while (i < n && depth > 0) {
      const ch = src[i];
      if (ch === "{") depth++, i++;
      else if (ch === "}") depth--, i++;
      else if (!step()) i++;
    }
  }

  // Consumes one comment / string / regex at i; returns false when src[i] is ordinary code.
  function step() {
    const ch = src[i];
    if (ch === "\n") {
      line++;
      i++;
      return true;
    }
    if (ch === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      return true;
    }
    if (ch === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") line++;
        i++;
      }
      i += 2;
      return true;
    }
    if (ch === "'" || ch === '"') {
      readQuoted(ch);
      prevSignificant = "x";
      return true;
    }
    if (ch === "`") {
      readTemplate();
      prevSignificant = "x";
      return true;
    }
    if (ch === "/" && regexCanStart()) {
      i++;
      let inClass = false;
      while (i < n && src[i] !== "\n") {
        if (src[i] === "\\") i += 2;
        else if (src[i] === "[") inClass = true, i++;
        else if (src[i] === "]") inClass = false, i++;
        else if (src[i] === "/" && !inClass) break;
        else i++;
      }
      i++;
      while (i < n && /[a-z]/.test(src[i])) i++;
      prevSignificant = "x";
      return true;
    }
    return false;
  }

  while (i < n) {
    if (step()) continue;
    const ch = src[i];
    if (!/\s/.test(ch)) {
      i++;
      prevSignificant = /[A-Za-z_$\d]/.test(ch) ? pushWord() : ch;
      continue;
    }
    i++;
  }
  return out;
}

/** @apply contents of a CSS file, with their lines. */
export function extractApply(src) {
  const out = [];
  let offset = 0;
  src.split(/\n/).forEach((l, idx) => {
    const m = l.match(/@apply\s+([^;]+);?/);
    if (m) out.push({ value: m[1], line: idx + 1, start: offset + m.index + m[0].indexOf(m[1]), end: offset + m.index + m[0].indexOf(m[1]) + m[1].length });
    offset += l.length + 1;
  });
  return out;
}

/** Class-like tokens of one string (drops prose: only tokens shaped like utilities survive later checks). */
export const tokensOf = (value) => value.split(/\s+/).filter(Boolean);

/**
 * All colour / size findings of a file: [{ rule, line, token }].
 * `css` selects @apply extraction; everything else is treated as JS/TS.
 */
export function analyse(src, { css = false } = {}) {
  const findings = [];
  const strings = css ? extractApply(src) : extractStrings(src);
  for (const { value, line } of strings) {
    if (!css && isColourLiteral(value)) {
      findings.push({ rule: "literal-colour-value", line, token: value.trim() });
      continue;
    }
    for (const token of tokensOf(value)) {
      if (token.length > 80 || !/^[!\w[\-:&>*.#%/()@,=\]]+$/.test(token)) continue;
      const { utility } = splitToken(token);
      const rule = colourRule(utility) ?? sizeRule(utility);
      if (rule) findings.push({ rule, line, token });
    }
  }
  return findings;
}
