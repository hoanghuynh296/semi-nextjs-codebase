// Brand generator: a few choices (brand.json) → every colour a Semi product needs, checked for WCAG AA.
//
//   validateBrand(brand, { styles })              → { errors, warnings }
//   generateBrand(brand, { tokens, styles, version }) → { tokens, css, fonts, report }
//
// What the brand chooses (docs/BRANDS.md): primary, optional secondary, neutral ("tinted" from the primary or a style
// "preset"), the styles it allows, fonts. What is derived: the 50…900 scales (OKLCH, same hue), the accent / on-accent /
// accent-fg shades of each theme (the first shade that reaches 4.5:1), the neutrals of every allowed style. No
// dependencies; Storybook's brand preview runs the same code in the browser.
import { contrast, hexToOklch, hueDistance, isHex, oklchToHex, parseColor, rgbToOklch } from "./color.mjs";

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
/** Semantic keys a brand's neutrals set (tokens/tokens.json "semantic"). */
export const NEUTRAL_KEYS = [
  "color-canvas", "color-app", "color-panel", "color-field", "color-raised",
  "color-text-contrast", "color-text-body", "color-text-muted",
  "color-line", "color-line-hover", "color-divider",
];
const SURFACES = ["color-canvas", "color-app", "color-panel", "color-field", "color-raised"];
const THEMES = ["dark", "light"];
const AA = 4.5;
/**
 * How much of the primary's hue each style's tinted neutrals take (OKLCH chroma). Surfaces (canvas, app, panel, field,
 * raised) take very little: large areas tinted at 0.01 read as a colour cast, while popular systems keep backgrounds
 * near 0–0.003 (Tailwind slate-50 ≈ 0.003, Radix slate-1 ≈ 0.002, shadcn Neutral 0). Text and lines carry more.
 */
const TINT = { flat: 0.01, soft: 0.016, sharp: 0.005 };
const SURFACE_TINT = { flat: 0.003, soft: 0.004, sharp: 0.002 };
/** Fonts known to work with next/font/google; weight is only needed for fonts without a variable version. */
export const FONTS = {
  Geist: {},
  Inter: {},
  "Plus Jakarta Sans": {},
  "Space Grotesk": {},
  Manrope: {},
  "DM Sans": {},
  Nunito: {},
  Lexend: {},
  Montserrat: {},
  "Montserrat Alternates": { weight: ["600", "700"] },
  "Be Vietnam Pro": { weight: ["400", "500", "600", "700"] },
};
const STATUS_HUES = { success: 155, danger: 15 };

const fail = (errors, msg) => errors.push(msg);

/** Problems with a brand.json, before anything is generated. errors stop the build; warnings go into the report. */
export function validateBrand(brand, { styles }) {
  const errors = [];
  const warnings = [];
  const ids = styles.styles.map((s) => s.id);
  if (!brand || typeof brand !== "object") return { errors: ["brand.json không phải một object JSON"], warnings };
  if (!brand.name) fail(errors, "name: thiếu tên thương hiệu");
  if (!/^(@[a-z0-9-]+\/)?[a-z0-9-]+$/.test(brand.package || "")) fail(errors, `package: "${brand.package ?? ""}" không phải tên npm hợp lệ (vd. @3dnoobs/brand)`);
  for (const key of ["primary", "secondary"]) {
    const v = brand[key];
    if (v == null && key === "secondary") continue;
    if (!isHex(v)) {
      fail(errors, `${key}: "${v ?? ""}" phải là mã hex (#00AE42)`);
      continue;
    }
    const { c } = hexToOklch(v);
    if (c < 0.04) fail(errors, `${key}: ${v} gần như xám (độ đậm ${c.toFixed(3)} < 0.04); chọn màu có sắc rõ hơn`);
  }
  if (!["tinted", "preset"].includes(brand.neutral)) fail(errors, `neutral: "${brand.neutral ?? ""}" phải là "tinted" hoặc "preset"`);
  const allowed = brand.styles?.allowed ?? [];
  if (!allowed.length) fail(errors, "styles.allowed: cần ít nhất một style");
  for (const s of allowed) if (!ids.includes(s)) fail(errors, `styles.allowed: "${s}" không có; chọn trong ${ids.join(", ")}`);
  if (!allowed.includes(brand.styles?.default)) fail(errors, `styles.default: "${brand.styles?.default ?? ""}" phải nằm trong styles.allowed`);
  if (brand.palettes) warnings.push("palettes đã bỏ (v0.14.0): xoá khỏi brand.json; neutral \"preset\" dùng màu trung tính của chính style");
  for (const role of ["sans", "display"]) {
    const f = brand.fonts?.[role];
    const family = typeof f === "string" ? f : f?.family;
    if (!family) fail(errors, `fonts.${role}: thiếu tên font`);
    else if (!FONTS[family] && !(typeof f === "object" && f.weight))
      warnings.push(`fonts.${role}: "${family}" không nằm trong danh sách đã kiểm tra; nếu font không có bản variable, thêm "weight": ["400", "600"]`);
  }
  if (brand.semi && !/^[\^~]?\d+\.\d+(\.\d+)?$/.test(brand.semi)) fail(errors, `semi: "${brand.semi}" phải là dải phiên bản như ^0.6.0`);
  return { errors, warnings };
}

/** 50…900 from one colour: 500 is the colour itself, lighter / darker shades keep its hue in OKLCH. */
export function scale(hex) {
  const { l, c, h } = hexToOklch(hex);
  const up = { 400: 0.24, 300: 0.48, 200: 0.7, 100: 0.86, 50: 0.94 };
  const down = { 600: 0.22, 700: 0.44, 800: 0.65, 900: 0.84 };
  const out = {};
  for (const s of SHADES) {
    if (s === 500) out[s] = hex.toLowerCase().length === 4 ? oklchToHex({ l, c, h }) : hex.toLowerCase();
    else if (up[s]) out[s] = oklchToHex({ l: l + (0.975 - l) * up[s], c: c * (1 - up[s]) ** 0.9, h });
    else out[s] = oklchToHex({ l: l - (l - 0.24) * down[s], c: c * (1 - down[s] * 0.3), h });
  }
  return out;
}

const DARK_TEXT = "#0c0d0e";
const WHITE = "#ffffff";

/**
 * The accent fill of a theme: the preferred text colour first (dark text on a light-ish accent in the dark theme, white
 * on a deeper accent in the light theme, as Semi's own green; dark text in both for a very light brand colour), walking
 * away from 500; the other text colour only when no shade works with the preferred one.
 */
function pickFill(sc, theme) {
  // A very light brand colour (yellow, lime) keeps its own fill with dark text in the light theme too.
  const light = hexToOklch(sc[500]).l >= 0.8;
  const tries =
    theme === "dark" || light
      ? [[DARK_TEXT, [500, 400, 300, 200]], [WHITE, [500, 600, 700]]]
      : [[WHITE, [500, 600, 700, 800]], [DARK_TEXT, [500, 400, 300]]];
  for (const [on, order] of tries) for (const shade of order) if (contrast(sc[shade], on) >= AA) return { shade, on };
  return { shade: theme === "dark" ? 300 : 800, on: theme === "dark" ? DARK_TEXT : WHITE };
}

/** First shade (in order) that reads at AA on every surface; null when none does. */
const pickText = (sc, order, surfaces) => order.find((s) => surfaces.every((bg) => contrast(sc[s], bg) >= AA)) ?? null;

/** Opaque version of a neutral (rgba lines are composited on the panel) for contrast checks. */
function flatten(value, panel) {
  const c = parseColor(value);
  if (!c || c.a >= 1) return value;
  const p = parseColor(panel);
  const mix = (k) => Math.round((c[k] * c.a + p[k] * (1 - c.a)) * 255).toString(16).padStart(2, "0");
  return `#${mix("r")}${mix("g")}${mix("b")}`;
}

/** Re-hue one neutral (hex or rgba) towards `hue`, keeping its lightness and alpha. */
function tint(value, hue, chroma) {
  const c = parseColor(value);
  if (!c) return value;
  const { l } = rgbToOklch(c);
  const hex = oklchToHex({ l, c: chroma, h: hue });
  if (c.a >= 1) return hex;
  const p = parseColor(hex);
  return `rgba(${Math.round(p.r * 255)}, ${Math.round(p.g * 255)}, ${Math.round(p.b * 255)}, ${+c.a.toFixed(3)})`;
}

/** The neutrals a style starts from: its own (semantic in tokens/styles/<id>.json), else the shared ones of tokens.json. */
function baseNeutrals(style, tokens) {
  const out = { dark: {}, light: {} };
  for (const k of NEUTRAL_KEYS) {
    const v = style.semantic?.[k] ?? tokens.semantic[k];
    out.dark[k] = v.dark;
    out.light[k] = v.light;
  }
  return out;
}

/** Nudge muted / body text until it reads at AA on every surface (tinting can cost a little contrast). */
function fixText(n, theme) {
  const surfaces = SURFACES.map((k) => n[k]);
  for (const k of ["color-text-muted", "color-text-body"]) {
    let { l, c, h } = hexToOklch(n[k]);
    for (let i = 0; i < 40 && surfaces.some((bg) => contrast(n[k], bg) < AA + 0.1); i++) {
      l += theme === "dark" ? 0.01 : -0.01;
      n[k] = oklchToHex({ l, c, h });
    }
  }
  return n;
}

/** Every token of a brand, its CSS and a contrast report. Throws when validateBrand finds errors. */
export function generateBrand(brand, { tokens, styles, version = "" }) {
  const { errors, warnings } = validateBrand(brand, { styles });
  if (errors.length) throw Object.assign(new Error(`brand.json không hợp lệ:\n- ${errors.join("\n- ")}`), { errors });
  const allowed = brand.styles.allowed.map((id) => styles.styles.find((s) => s.id === id));
  const primary = scale(brand.primary);
  const secondary = brand.secondary ? scale(brand.secondary) : null;
  const { h: hue } = hexToOklch(brand.primary);

  // Neutrals of every allowed style, both themes.
  const neutrals = {};
  for (const st of allowed) {
    const base = baseNeutrals(st, tokens);
    neutrals[st.id] = {};
    for (const theme of THEMES) {
      const n = { ...base[theme] };
      if (brand.neutral === "tinted") {
        const ch = TINT[st.id] ?? 0.01;
        const surf = SURFACE_TINT[st.id] ?? 0.003;
        for (const k of NEUTRAL_KEYS) {
          const c = SURFACES.includes(k) ? surf : k.startsWith("color-text") ? ch * 0.6 : k.startsWith("color-line") || k === "color-divider" ? ch * 2 : ch;
          n[k] = tint(n[k], hue, c);
        }
      }
      neutrals[st.id][theme] = fixText(n, theme);
    }
  }

  // Accent shades: chosen against the surfaces of every allowed style.
  const report = [];
  const themes = {};
  for (const theme of THEMES) {
    const surfaces = allowed.flatMap((st) => SURFACES.map((k) => neutrals[st.id][theme][k]));
    const fill = pickFill(primary, theme);
    const darker = (s) => SHADES[Math.min(SHADES.length - 1, SHADES.indexOf(s) + 1)];
    const lighter = (s) => SHADES[Math.max(0, SHADES.indexOf(s) - 1)];
    const hover = fill.on === DARK_TEXT ? lighter(fill.shade) : darker(fill.shade);
    const fgOrder = theme === "dark" ? [400, 300, 200, 100, 50] : [600, 700, 800, 900];
    const fg = pickText(primary, fgOrder, surfaces) ?? (theme === "dark" ? 50 : 900);
    themes[theme] = {
      "color-accent": primary[fill.shade],
      "color-accent-hover": primary[hover],
      "color-on-accent": fill.on,
      "color-accent-fg": primary[fg],
    };
    report.push({ check: `nút chính (${theme})`, pair: `${fill.on} / primary-${fill.shade}`, ratio: contrast(fill.on, primary[fill.shade]) });
    report.push({ check: `chữ màu chính (${theme})`, pair: `primary-${fg} / nền ${theme}`, ratio: Math.min(...surfaces.map((bg) => contrast(primary[fg], bg))) });
    if (secondary) {
      const sfg = pickText(secondary, fgOrder, surfaces) ?? (theme === "dark" ? 50 : 900);
      themes[theme]["color-secondary-fg"] = secondary[sfg];
      report.push({ check: `chữ màu phụ (${theme})`, pair: `secondary-${sfg} / nền ${theme}`, ratio: Math.min(...surfaces.map((bg) => contrast(secondary[sfg], bg))) });
    }
    for (const st of allowed) {
      const n = neutrals[st.id][theme];
      const worst = Math.min(...SURFACES.slice(0, 4).map((k) => contrast(n["color-text-muted"], n[k])));
      report.push({ check: `chữ mờ ${st.name} (${theme})`, pair: `text-muted / nền`, ratio: worst });
    }
  }
  for (const r of report) r.ok = r.ratio >= AA;
  for (const [status, h] of Object.entries(STATUS_HUES))
    if (hueDistance(hue, h) < 25)
      warnings.push(`Màu chính gần màu ${status === "success" ? "thành công (xanh lá)" : "lỗi (đỏ)"} của Semi: trạng thái luôn kèm icon hoặc chữ, đừng chỉ dựa vào màu`);
  if (report.some((r) => !r.ok)) warnings.push("Có cặp màu chưa đạt AA: xem bảng contrast");

  const fonts = resolveFonts(brand, styles);
  const out = {
    name: brand.name,
    package: brand.package,
    semi: brand.semi ?? null,
    styles: brand.styles,
    neutral: brand.neutral,
    primary,
    ...(secondary ? { secondary } : {}),
    themes,
    neutrals,
    fonts,
  };
  return { tokens: out, css: brandCss(out, version), fonts, report, warnings };
}

/** Font entries for next/font: { role, family, nextFont, variable, weight? } (variables match the style fonts). */
export function resolveFonts(brand, styles) {
  const known = Object.fromEntries(styles.styles.flatMap((s) => s.fonts ?? []).map((f) => [f.family, f]));
  const seen = new Map();
  for (const role of ["sans", "display"]) {
    const f = brand.fonts[role];
    const family = typeof f === "string" ? f : f.family;
    if (seen.has(family)) {
      seen.get(family).roles.push(role);
      continue;
    }
    const k = known[family];
    const weight = (typeof f === "object" && f.weight) || FONTS[family]?.weight || k?.weight;
    seen.set(family, {
      roles: [role],
      family,
      nextFont: family.replace(/ /g, "_"),
      variable: k?.variable ?? `--font-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      ...(weight ? { weight } : {}),
    });
  }
  return [...seen.values()];
}

const src = (key) => `--semi-${key.replace(/^color-/, "")}`;
const block = (selectors, vars, pad = "") => `${pad}${selectors.join(`,\n${pad}`)} {\n${vars.map(([k, v]) => `${pad}  ${k}: ${v};`).join("\n")}\n${pad}}\n`;

/**
 * The brand's CSS: imported after @semi/ui/tokens.css, so it wins over the Semi defaults at equal specificity.
 * runtime: plain CSS for a page that is already built (Storybook's brand preview): :root instead of @theme, and the
 * font variables next/font would set (`loadedFonts` lists the variables the page already defines).
 * @param {any} t
 * @param {string} version
 * @param {{ runtime?: boolean, loadedFonts?: string[] }} [options]
 */
export function brandCss(t, version, { runtime = false, loadedFonts = [] } = {}) {
  const family = (role) => {
    const f = t.fonts.find((x) => x.roles.includes(role));
    return `var(${f.variable}), "${f.family}"`;
  };
  let css = `/* GENERATED by semi-brand from brand.json — do not edit. ${t.name} (${t.package})${version ? ` · @semi/ui ${version}` : ""}\n   Import after @semi/ui/tokens.css. docs: node_modules/@semi/ui/docs/BRANDS.md */\n`;
  css += `${runtime ? ":root" : "@theme"} {\n  --color-primary: ${t.primary[500]};\n${SHADES.map((s) => `  --color-primary-${s}: ${t.primary[s]};`).join("\n")}\n`;
  if (t.secondary) css += `  --color-secondary: ${t.secondary[500]};\n${SHADES.map((s) => `  --color-secondary-${s}: ${t.secondary[s]};`).join("\n")}\n`;
  if (runtime) for (const f of t.fonts) if (!loadedFonts.includes(f.variable)) css += `  ${f.variable}: "${f.family}";\n`;
  css += "}\n\n";
  if (t.secondary) css += `${runtime ? ":root" : "@theme inline"} {\n  --color-secondary-fg: var(--semi-secondary-fg);\n}\n\n`;
  css += block([":root"], [["--font-sans-family", family("sans")], ["--font-display-family", family("display")]]) + "\n";
  // Accent: every style, every theme scope (the same selectors Semi's own theme tokens use).
  const scopes = (theme, extra = []) => [
    ...extra,
    `[data-theme="${theme}"]`,
    ...(theme === "dark" ? [`[data-theme="system"]`] : []),
  ];
  const vars = (theme) => Object.entries(t.themes[theme]).map(([k, v]) => [src(k), v]);
  css += `/* Accent */\n${block(scopes("dark", [":root"]), vars("dark"))}\n${block(scopes("light"), vars("light"))}\n`;
  css += `@media (prefers-color-scheme: light) {\n${block([`[data-theme="system"]`], vars("light"), "  ")}}\n\n`;
  // Neutrals per allowed style. The default style (Flat) also applies without data-style.
  for (const [sid, themes] of Object.entries(t.neutrals)) {
    const sel = (theme) => [
      ...(sid === "flat" ? [`[data-theme="${theme}"]`] : []),
      `[data-style="${sid}"][data-theme="${theme}"]`,
      `[data-style="${sid}"] [data-theme="${theme}"]`,
    ];
    const withSystem = (theme) => (theme === "dark" ? [...sel("dark"), ...sel("system")] : sel("light"));
    const nv = (theme) => NEUTRAL_KEYS.map((k) => [src(k), themes[theme][k]]);
    css += `/* Neutrals: ${sid} */\n${block(withSystem("dark"), nv("dark"))}\n${block(withSystem("light"), nv("light"))}\n`;
    css += `@media (prefers-color-scheme: light) {\n${block(sel("system"), nv("light"), "  ")}}\n\n`;
  }
  return css;
}
