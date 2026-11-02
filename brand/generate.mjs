// Brand generator: a few choices (brand.json) → every colour a Semi product needs, checked for WCAG AA.
//
//   validateBrand(brand, { styles })              → { errors, warnings }
//   generateBrand(brand, { tokens, styles, version }) → { tokens, css, fonts, report }
//
// What the brand chooses (docs/BRANDS.md): primary, optional secondary, neutral ("tinted" from the primary or a style
// "preset"), the styles it allows, fonts. What is derived: the 50…900 scales (fixed OKLCH lightness per shade, the
// brand colour itself on the nearest shade), the accent / on-accent / accent-fg shades of each theme (the readable shade
// closest to the brand colour), the neutrals of every allowed style. No dependencies; the docs site's brand preview
// runs the same code in the browser.
import { blend, contrast, deltaE, hexToOklch, hueDistance, isHex, oklchToHex, parseColor, rgbToOklch } from "./color.mjs";

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
/** WCAG 1.4.11: focus rings, selected borders and control fills must reach 3:1 against the surface. */
const NON_TEXT = 3;
/**
 * OKLCH lightness of every shade, the same for every brand (close to Tailwind v4 / Radix steps), so primary-200 means
 * the same thing in every brand and very dark or very light brand colours no longer squash half the scale together.
 */
export const LADDER = { 50: 0.975, 100: 0.945, 200: 0.89, 300: 0.815, 400: 0.725, 500: 0.635, 600: 0.55, 700: 0.47, 800: 0.39, 900: 0.31 };
/** How far (OKLab ΔE) the button may move from the brand colour to stand out from the page (3:1) instead of blending in. */
const FILL_REACH = 0.2;
/** Alpha of the accent-subtle tint per theme (tokens.json): accent-fg text on it (selected option, active page) must read. */
const SUBTLE = { dark: 0.14, light: 0.11 };
/** Surfaces a solid button sits on (page, app frame, panel); fields and raised layers are not its background. */
const PAGES = ["color-canvas", "color-app", "color-panel"];
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
  validateGuide(brand, errors, warnings);
  return { errors, warnings };
}

// ── Guideline: what a brand designer writes besides colours and fonts (all optional; defaults below) ──────────────
/** Tones a brand can speak in, with the rules an agent follows when it writes UI text. */
export const TONES = {
  friendly: {
    label: "Thân thiện",
    rules: ["Nói chuyện trực tiếp với người dùng, câu ngắn, ấm áp", "Được dùng câu cảm ơn ngắn sau một việc lớn (đặt hàng, tạo xong)", "Không đùa trong thông báo lỗi"],
  },
  neutral: {
    label: "Trung tính",
    rules: ["Ngắn, rõ, đúng sự việc", "Không cảm thán, không đùa", "Thuật ngữ nhất quán: một khái niệm, một từ"],
  },
  formal: {
    label: "Trang trọng",
    rules: ["Lịch sự, câu đầy đủ chủ ngữ", "Không viết tắt, không tiếng lóng, không emoji", "Xưng hô nhất quán trên mọi màn hình"],
  },
};
/** Rules every Semi brand shares (DESIGN_SYSTEM.md: sentence case, minimal text, no loading text). */
export const MICROCOPY = [
  "Nút: động từ + đối tượng, tối đa 3 từ, viết hoa chữ đầu (Lưu, Tạo đơn hàng), không \"OK\" / \"Xác nhận\" chung chung",
  "Lỗi: chuyện gì xảy ra + cách sửa, không đổ lỗi cho người dùng, không mã lỗi trần",
  "Trạng thái trống: vì sao trống + một hành động để bắt đầu",
  "Không viết \"Đang tải…\": dùng skeleton hoặc thanh tiến trình",
  "Không phụ đề dưới tiêu đề trang; nhãn ngắn, icon đi trước chữ",
];
const ACCENT_USE = {
  restrained: { label: "Tiết chế", mix: { neutral: 80, surface: 15, accent: 5 }, rule: "Màu chính chỉ cho hành động chính (một nút chính mỗi vùng), mục đang chọn, link và focus. Nền màu chính diện rộng: không." },
  balanced: { label: "Cân bằng", mix: { neutral: 70, surface: 20, accent: 10 }, rule: "Như tiết chế, thêm nền nhạt bg-accent-subtle cho khối nổi bật (banner, thẻ khuyến nghị), tối đa một khối mỗi màn hình." },
  expressive: { label: "Phóng khoáng", mix: { neutral: 55, surface: 25, accent: 20 }, rule: "Được dùng nền bg-accent cho hero / banner và icon lớn màu chính; vẫn chỉ một nút chính mỗi vùng." },
};
const SECONDARY_ROLE = {
  highlight: "điểm nhấn: badge \"Mới\", ngôi sao, số nổi bật (bg-secondary-solid + text-on-secondary, text-secondary-fg)",
  badge: "nhãn và badge phân loại (bg-secondary-solid + text-on-secondary)",
  illustration: "minh hoạ và biểu đồ trang trí (secondary-*), không cho chữ hay nút",
};
const str = (v) => typeof v === "string" && v.trim().length > 0;
const strList = (v) => Array.isArray(v) && v.every(str);

function validateGuide(brand, errors, warnings) {
  const b = brand.brief;
  if (b !== undefined) {
    if (typeof b !== "object" || b === null) fail(errors, "brief: phải là object { product, audience, personality, tagline }");
    else {
      for (const k of ["audience", "product"]) if (b[k] !== undefined && !str(b[k])) fail(errors, `brief.${k}: phải là chữ`);
      if (b.tagline !== undefined && (!str(b.tagline) || b.tagline.length > 90)) fail(errors, "brief.tagline: một câu ngắn, tối đa 90 ký tự");
      if (b.personality !== undefined && (!strList(b.personality) || b.personality.length > 5)) fail(errors, "brief.personality: 1–5 tính từ, vd. [\"thân thiện\", \"chính xác\"]");
    }
  }
  const l = brand.logo;
  if (l !== undefined) {
    if (typeof l !== "object" || l === null) fail(errors, "logo: phải là object { full, fullDark?, mark?, clearspace?, minWidth? }");
    else {
      if (!str(l.full)) fail(errors, "logo.full: đường dẫn file logo trong repo brand, vd. assets/logo.svg");
      for (const k of ["full", "fullDark", "mark"]) if (l[k] !== undefined && !/\.(svg|png|webp)$/i.test(String(l[k]))) fail(errors, `logo.${k}: cần file .svg, .png hoặc .webp`);
      if (l.clearspace !== undefined && !(typeof l.clearspace === "number" && l.clearspace >= 0 && l.clearspace <= 2)) fail(errors, "logo.clearspace: số từ 0 đến 2 (bội của chiều cao logo)");
      if (l.minWidth !== undefined && !(Number.isInteger(l.minWidth) && l.minWidth >= 16)) fail(errors, "logo.minWidth: số px nguyên ≥ 16");
      if (str(l.full) && !/\.svg$/i.test(l.full)) warnings.push("logo.full: nên dùng SVG để logo nét ở mọi cỡ");
    }
  }
  const v = brand.voice;
  if (v !== undefined) {
    if (typeof v !== "object" || v === null) fail(errors, "voice: phải là object { tone, address, we, emoji, do, dont, examples }");
    else {
      if (v.tone !== undefined && !TONES[v.tone]) fail(errors, `voice.tone: "${v.tone}" phải là ${Object.keys(TONES).join(", ")}`);
      for (const k of ["address", "we"]) if (v[k] !== undefined && !str(v[k])) fail(errors, `voice.${k}: phải là chữ (vd. "bạn", "chúng tôi")`);
      if (v.emoji !== undefined && typeof v.emoji !== "boolean") fail(errors, "voice.emoji: true hoặc false");
      for (const k of ["do", "dont"]) if (v[k] !== undefined && !strList(v[k])) fail(errors, `voice.${k}: danh sách câu`);
      if (v.examples !== undefined) {
        if (typeof v.examples !== "object" || v.examples === null) fail(errors, "voice.examples: object { button, success, error, empty }");
        else for (const [k, x] of Object.entries(v.examples)) if (!str(x) && !strList(x)) fail(errors, `voice.examples.${k}: chữ hoặc danh sách chữ`);
      }
    }
  }
  const c = brand.color;
  if (c !== undefined) {
    if (typeof c !== "object" || c === null) fail(errors, "color: phải là object { accent, secondaryRole }");
    else {
      if (c.accent !== undefined && !ACCENT_USE[c.accent]) fail(errors, `color.accent: "${c.accent}" phải là ${Object.keys(ACCENT_USE).join(", ")}`);
      if (c.secondaryRole !== undefined && !SECONDARY_ROLE[c.secondaryRole]) fail(errors, `color.secondaryRole: "${c.secondaryRole}" phải là ${Object.keys(SECONDARY_ROLE).join(", ")}`);
      if (c.secondaryRole && !brand.secondary) warnings.push("color.secondaryRole chỉ dùng khi có màu phụ");
    }
  }
  if (brand.imagery !== undefined && !str(brand.imagery)) fail(errors, "imagery: một đoạn mô tả ảnh / minh hoạ");
  // Density and type scale belong to each product (semi-lint.json, /semi-new-app), not to the brand. The 0.17 draft
  // keys typography / motif are gone: the style sets title weight and figure font.
  if (brand.density !== undefined) warnings.push("density: mật độ là lựa chọn của từng sản phẩm (dashboard gọn, web bán hàng thoáng), không phải của thương hiệu; bỏ khỏi brand.json, chọn khi tạo app (/semi-new-app)");
  if (brand.typography !== undefined) warnings.push("typography: không còn dùng (cỡ chữ là của từng sản phẩm, độ đậm tiêu đề theo style); bỏ khỏi brand.json");
  if (brand.motif !== undefined) warnings.push("motif: không còn dùng; bỏ khỏi brand.json");
  if (!brand.voice) warnings.push("Chưa có giọng văn (voice): agent sẽ viết chữ theo mặc định trung tính. Thêm voice để sản phẩm nói đúng giọng thương hiệu");
}

/**
 * How much of a screen each colour role takes, in % (the 60-30-10 idea, by accent use): neutrals (canvas, text),
 * surfaces (panels, fields), accent (buttons, links, selection) and, with a secondary colour, a share of the accent.
 */
function colorMix(accent, secondary) {
  const m = { ...ACCENT_USE[accent].mix };
  if (secondary) {
    m.secondary = Math.max(2, Math.round(m.accent * 0.3));
    m.accent -= m.secondary;
  }
  return m;
}

/** The guideline with defaults filled in: what BRAND.md, AGENTS.brand.md, the preview and agents read. */
export function resolveGuide(brand) {
  const v = brand.voice ?? {};
  const tone = v.tone ?? "neutral";
  const c = brand.color ?? {};
  const accent = c.accent ?? "restrained";
  const secondaryRole = brand.secondary ? (c.secondaryRole ?? "highlight") : null;
  return {
    brief: brand.brief ?? null,
    logo: brand.logo ? { clearspace: 0.5, minWidth: 80, ...brand.logo } : null,
    voice: {
      tone,
      toneLabel: TONES[tone].label,
      address: v.address ?? "bạn",
      we: v.we ?? brand.name,
      emoji: v.emoji ?? false,
      rules: [...TONES[tone].rules, ...MICROCOPY],
      do: v.do ?? [],
      dont: v.dont ?? [],
      examples: v.examples ?? {},
      custom: Boolean(brand.voice),
    },
    color: {
      accent,
      accentLabel: ACCENT_USE[accent].label,
      accentRule: ACCENT_USE[accent].rule,
      mix: colorMix(accent, Boolean(brand.secondary)),
      secondaryRole,
      secondaryRule: secondaryRole ? SECONDARY_ROLE[secondaryRole] : null,
    },
    imagery: brand.imagery ?? null,
  };
}

/** The shade a brand colour sits on: the one whose ladder lightness is closest to it. */
export function brandStep(hex) {
  const { l } = hexToOklch(hex);
  return SHADES.reduce((best, s) => (Math.abs(LADDER[s] - l) < Math.abs(LADDER[best] - l) ? s : best), 500);
}

/**
 * 50…900 from one colour: every shade has the ladder's lightness and the colour's hue; the brand colour itself sits on
 * its nearest shade (brandStep), unchanged. Chroma fades towards white and eases off towards black, and is lowered
 * further only where sRGB cannot show it.
 */
export function scale(hex) {
  const { l, c, h } = hexToOklch(hex);
  const step = brandStep(hex);
  const out = {};
  for (const s of SHADES) {
    if (s === step) {
      out[s] = hex.toLowerCase().length === 4 ? oklchToHex({ l, c, h }) : hex.toLowerCase();
      continue;
    }
    const L = LADDER[s];
    const chroma = L > l ? c * (1 - (L - l) / (0.99 - l)) ** 1.1 : c * (1 - 0.35 * Math.min(1, (l - L) / Math.max(0.05, l - 0.2)));
    out[s] = oklchToHex({ l: L, c: chroma, h });
  }
  return out;
}

const DARK_TEXT = "#0c0d0e";
const WHITE = "#ffffff";
const minContrast = (color, backgrounds) => Math.min(...backgrounds.map((bg) => contrast(color, bg)));

/**
 * The solid fill of a theme (buttons, checked controls): of every shade × text colour that reads at AA, the one closest
 * to the brand colour. When that one blends into the page (< 3:1, e.g. navy on a dark page), a shade within FILL_REACH
 * of the brand that stands out is taken instead; if none does, the brand colour stays and the report says so. Ties go
 * to the theme's usual text (dark text in the dark theme, white in the light theme).
 */
function pickFill(sc, brandHex, theme, surfaces) {
  const usual = theme === "dark" ? DARK_TEXT : WHITE;
  const cands = [];
  for (const shade of SHADES)
    for (const on of [DARK_TEXT, WHITE]) {
      const ratio = contrast(sc[shade], on);
      if (ratio >= AA) cands.push({ shade, on, ratio, de: deltaE(sc[shade], brandHex), page: minContrast(sc[shade], surfaces) });
    }
  if (!cands.length) return { shade: theme === "dark" ? 300 : 800, on: theme === "dark" ? DARK_TEXT : WHITE, de: 1, page: 0 };
  const order = (a, b) => a.de - b.de || (a.on === usual ? -1 : 0) - (b.on === usual ? -1 : 0);
  cands.sort(order);
  const best = cands[0];
  if (best.page >= NON_TEXT) return best;
  return cands.find((c) => c.page >= NON_TEXT && c.de <= best.de + FILL_REACH) ?? best;
}

/** Hover of a fill: the next shade away from its text colour (lighter under dark text), or the other way when that one no longer reads. */
function pickHover(sc, fill) {
  const i = SHADES.indexOf(fill.shade);
  const away = fill.on === DARK_TEXT ? [i - 1, i + 1] : [i + 1, i - 1];
  for (const j of away) if (j >= 0 && j < SHADES.length && contrast(sc[SHADES[j]], fill.on) >= AA) return SHADES[j];
  return SHADES[Math.min(SHADES.length - 1, Math.max(0, away[0]))];
}

/**
 * Coloured text (accent-fg): the shade closest to the brand colour that reads at AA on every surface and on the
 * accent-subtle tint of itself (selected rows, active pills). The focus ring and selected borders use it too.
 */
function pickText(sc, brandHex, theme, surfaces, pages) {
  const reads = (s) => minContrast(sc[s], [...surfaces, ...pages.map((bg) => blend(sc[s], bg, SUBTLE[theme]))]);
  const ok = SHADES.filter((s) => reads(s) >= AA).sort((a, b) => deltaE(sc[a], brandHex) - deltaE(sc[b], brandHex));
  const shade = ok[0] ?? (theme === "dark" ? 50 : 900);
  return { shade, ratio: reads(shade) };
}

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
  const fidelity = {};
  const themeName = { dark: "tối", light: "sáng" };
  for (const theme of THEMES) {
    const surfaces = allowed.flatMap((st) => SURFACES.map((k) => neutrals[st.id][theme][k]));
    const pages = allowed.flatMap((st) => PAGES.map((k) => neutrals[st.id][theme][k]));
    const fill = pickFill(primary, brand.primary, theme, pages);
    const hover = pickHover(primary, fill);
    const fg = pickText(primary, brand.primary, theme, surfaces, pages);
    themes[theme] = {
      "color-accent": primary[fill.shade],
      "color-accent-hover": primary[hover],
      "color-on-accent": fill.on,
      "color-accent-fg": primary[fg.shade],
    };
    fidelity[theme] = { fill: fill.shade, text: fg.shade, deltaE: +fill.de.toFixed(3) };
    const t = themeName[theme];
    report.push({ check: `nút chính (${t})`, pair: `chữ ${fill.on} / primary-${fill.shade}`, ratio: contrast(fill.on, primary[fill.shade]), min: AA });
    report.push({ check: `nút chính khi hover (${t})`, pair: `chữ ${fill.on} / primary-${hover}`, ratio: contrast(fill.on, primary[hover]), min: AA });
    report.push({ check: `chữ màu chính (${t})`, pair: `primary-${fg.shade} / nền + nền chọn`, ratio: fg.ratio, min: AA });
    report.push({ check: `viền focus (${t})`, pair: `primary-${fg.shade} / nền`, ratio: minContrast(primary[fg.shade], surfaces), min: NON_TEXT });
    // Soft: a filled control may blend into the page (light brands on white) and still be usable through its text or
    // check mark; reported so the person sees it, never a build failure.
    report.push({ check: `nút tách khỏi nền (${t})`, pair: `primary-${fill.shade} / nền`, ratio: fill.page, min: NON_TEXT, soft: true });
    if (fill.de > 0.08)
      warnings.push(
        `Theme ${t}: nút chính dùng primary-${fill.shade} (${primary[fill.shade]}) thay vì đúng màu thương hiệu ${brand.primary} (ΔE ${fill.de.toFixed(2)}), ` +
          ([DARK_TEXT, WHITE].some((on) => contrast(brand.primary, on) >= AA)
            ? "để nút tách khỏi nền (màu gốc gần như trùng với nền trang)"
            : "vì cả chữ trắng lẫn chữ tối trên màu gốc đều chưa đạt 4.5:1"),
      );
    if (fill.page < NON_TEXT)
      warnings.push(`Theme ${t}: nút màu thương hiệu chỉ tách khỏi nền ${fill.page.toFixed(2)}:1 (< 3:1). Nút vẫn đọc được nhờ chữ, nhưng công tắc, thanh trượt và ô chọn khó thấy hơn`);
    if (secondary) {
      const sfg = pickText(secondary, brand.secondary, theme, surfaces, pages);
      const sfill = pickFill(secondary, brand.secondary, theme, pages);
      themes[theme]["color-secondary-fg"] = secondary[sfg.shade];
      themes[theme]["color-secondary-solid"] = secondary[sfill.shade];
      themes[theme]["color-on-secondary"] = sfill.on;
      report.push({ check: `chữ màu phụ (${t})`, pair: `secondary-${sfg.shade} / nền + nền chọn`, ratio: sfg.ratio, min: AA });
      report.push({ check: `nền màu phụ (${t})`, pair: `chữ ${sfill.on} / secondary-${sfill.shade}`, ratio: contrast(sfill.on, secondary[sfill.shade]), min: AA });
    }
    for (const st of allowed) {
      const n = neutrals[st.id][theme];
      const worst = Math.min(...SURFACES.slice(0, 4).map((k) => contrast(n["color-text-muted"], n[k])));
      report.push({ check: `chữ mờ ${st.name} (${t})`, pair: `text-muted / nền`, ratio: worst, min: AA });
    }
  }
  for (const r of report) r.ok = r.ratio >= r.min;
  for (const [status, h] of Object.entries(STATUS_HUES))
    if (hueDistance(hue, h) < 25)
      warnings.push(`Màu chính gần màu ${status === "success" ? "thành công (xanh lá)" : "lỗi (đỏ)"} của Semi: trạng thái luôn kèm icon hoặc chữ, đừng chỉ dựa vào màu`);
  if (report.some((r) => !r.ok && !r.soft)) warnings.push("Có cặp màu chưa đạt AA: xem bảng contrast");

  const fonts = resolveFonts(brand, styles);
  const out = {
    name: brand.name,
    package: brand.package,
    semi: brand.semi ?? null,
    styles: brand.styles,
    neutral: brand.neutral,
    primary,
    brandStep: brandStep(brand.primary),
    ...(secondary ? { secondary, secondaryStep: brandStep(brand.secondary) } : {}),
    themes,
    fidelity,
    neutrals,
    guide: resolveGuide(brand),
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
  css += `${runtime ? ":root" : "@theme"} {\n  --color-primary: ${t.primary[t.brandStep ?? 500]};\n${SHADES.map((s) => `  --color-primary-${s}: ${t.primary[s]};`).join("\n")}\n`;
  if (t.secondary) css += `  --color-secondary: ${t.secondary[t.secondaryStep ?? 500]};\n${SHADES.map((s) => `  --color-secondary-${s}: ${t.secondary[s]};`).join("\n")}\n`;
  if (runtime) for (const f of t.fonts) if (!loadedFonts.includes(f.variable)) css += `  ${f.variable}: "${f.family}";\n`;
  css += "}\n\n";
  if (t.secondary)
    css += `${runtime ? ":root" : "@theme inline"} {\n  --color-secondary-fg: var(--semi-secondary-fg);\n  --color-secondary-solid: var(--semi-secondary-solid);\n  --color-on-secondary: var(--semi-on-secondary);\n}\n\n`;
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
