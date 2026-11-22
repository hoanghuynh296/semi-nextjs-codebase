// Brand generator: a few choices (brand.json) → every colour a Semi product needs, checked for WCAG AA.
//
//   validateBrand(brand, { styles })              → { errors, warnings }
//   generateBrand(brand, { tokens, styles, version, params }) → { tokens, css, fonts, report }
//
// What the brand chooses (docs/BRANDS.md): primary, optional secondary, neutral ("tinted" from the primary or a style
// "preset"), the styles it allows, fonts. What is derived: the 50…900 scales (fixed OKLCH lightness per shade, the
// brand colour itself on the nearest shade), the accent / on-accent / accent-fg shades of each theme (the readable shade
// closest to the brand colour), the neutrals of every allowed style. No dependencies; the docs site's brand preview
// runs the same code in the browser. The numbers of the derivation live in ./params.mjs (tried in the Design Lab).
import { PARAMS, mergeParams } from "./params.mjs";
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
/** OKLCH lightness of every shade (params.mjs "ladder"), the same for every brand. */
export const LADDER = PARAMS.ladder;
export { PARAMS, mergeParams };
/** Surfaces a solid button sits on (page, app frame, panel); fields and raised layers are not its background. */
const PAGES = ["color-canvas", "color-app", "color-panel"];
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
/** Semi's status text tokens: fixed per theme (never the brand's), checked against the brand's tinted surfaces. */
const STATUS_FG = { danger: "lỗi", success: "thành công", warning: "cảnh báo", info: "thông tin" };
/** The palette family of each status (how far it may turn: params.mjs "statusTurn" / "statusGap"). */
const STATUS_FAMILY = { danger: "rose", success: "emerald", warning: "amber", info: "sky" };
const STATUS_PARTS = ["fg", "bg", "border", "solid"];

/**
 * Status colours that would blend with the brand (a red primary next to the error red): the status's palette family
 * turns its hue away from the primary, up to params.statusTurn, keeping lightness and chroma (so contrast stays). Returns
 * { [status]: { turn, from, to, dark: { "color-danger-fg": … }, light: { … } } } for the turned statuses only.
 */
function separateStatus(tokens, primaryHex, p = PARAMS) {
  const { h: hue, c } = hexToOklch(primaryHex);
  const out = {};
  if (c < 0.06) return out; // a near-neutral primary does not read as any status
  for (const [status, family] of Object.entries(STATUS_FAMILY)) {
    const base = resolveToken(`var(--color-${family}-500)`, tokens);
    if (!isHex(base)) continue;
    const sh = hexToOklch(base).h;
    const gap = hueDistance(hue, sh);
    if (gap >= p.statusGap) continue;
    // turn away from the primary: the sign that grows the distance
    const away = ((sh - hue + 540) % 360) - 180 >= 0 ? 1 : -1;
    const turn = away * Math.min(p.statusGap - gap, p.statusTurn[status]);
    const shift = (hex) => {
      const o = hexToOklch(hex);
      return oklchToHex({ l: o.l, c: o.c, h: (o.h + turn + 360) % 360 });
    };
    const rewrite = (value) =>
      String(value).replace(new RegExp(`var\\(--color-${family}-(\\d+)\\)`, "g"), (m, shade) => {
        const hex = resolveToken(`var(--color-${family}-${shade})`, tokens);
        return isHex(hex) ? shift(hex) : m;
      });
    const entry = { turn: Math.round(turn), from: base, to: shift(base), dark: {}, light: {} };
    for (const part of STATUS_PARTS) {
      const t = tokens.semantic?.[`color-${status}-${part}`];
      if (!t) continue;
      for (const theme of THEMES) entry[theme][`color-${status}-${part}`] = rewrite(t[theme]);
    }
    out[status] = entry;
  }
  return out;
}

/** Text colour on the main button: "auto" picks the readable shade closest to the brand; "white" / "dark" force it. */
const BUTTON_TEXT = ["auto", "white", "dark"];

/** A token value as hex: "var(--color-rose-400)" is looked up in any tokens.json group. */
function resolveToken(value, tokens) {
  const m = /^var\(--([\w-]+)\)$/.exec(String(value ?? "").trim());
  if (!m) return value;
  for (const g of Object.values(tokens)) if (g && typeof g === "object" && m[1] in g) return resolveToken(typeof g[m[1]] === "string" ? g[m[1]] : g[m[1]].value, tokens);
  return value;
}
/** Alpha of the accent-subtle tint per theme ("color-mix(… accent-fg 14%, transparent)"): accent-fg text on it must read. */
function subtleAlpha(tokens, theme) {
  const m = /(\d+(?:\.\d+)?)%/.exec(tokens.semantic?.["color-accent-subtle"]?.[theme] ?? "");
  return m ? +m[1] / 100 : theme === "dark" ? 0.14 : 0.11;
}
/** Opacity of text-muted in Semi's control-line token per theme ("color-mix(… text-muted 80%, transparent)"), or null. */
function controlLineAlpha(tokens, theme) {
  const m = /(\d+(?:\.\d+)?)%/.exec(tokens.semantic?.["color-control-line"]?.[theme] ?? "");
  return m ? +m[1] / 100 : null;
}

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
  if (brand.semi && !/^([\^~]?\d+\.\d+(\.\d+)?|>=\d+\.\d+(\.\d+)? <\d+\.\d+(\.\d+)?)$/.test(brand.semi)) fail(errors, `semi: "${brand.semi}" phải là dải phiên bản như ">=0.26.0 <1.0.0" (từ minor này đến trước major kế tiếp) hoặc ^0.6.0`);
  validateAccent(brand, errors);
  validateGuide(brand, errors, warnings);
  return { errors, warnings };
}

/** brand.json "accent": { sameInBothThemes?, light?: pin, dark?: pin }, pin = { fill, hover?, on? } (shade 50…900 or hex; on: white | dark | hex). */
function validateAccent(brand, errors) {
  const a = brand.accent;
  if (a === undefined) return;
  if (typeof a !== "object" || a === null) return fail(errors, "accent: phải là object { sameInBothThemes?, light?, dark? }");
  if (a.sameInBothThemes !== undefined && typeof a.sameInBothThemes !== "boolean") fail(errors, "accent.sameInBothThemes: true hoặc false");
  if (a.sameInBothThemes && (a.light || a.dark)) fail(errors, "accent: sameInBothThemes không đi cùng accent.light / accent.dark (chọn một màu chung hoặc ghim từng theme)");
  const ref = (v) => (typeof v === "number" ? SHADES.includes(v) : isHex(v));
  for (const th of THEMES) {
    const pin = a[th];
    if (pin === undefined) continue;
    if (typeof pin !== "object" || pin === null) {
      fail(errors, `accent.${th}: phải là object { fill, hover?, on? }`);
      continue;
    }
    if (!ref(pin.fill)) fail(errors, `accent.${th}.fill: bậc ${SHADES.join("/")} của primary hoặc mã hex`);
    if (pin.hover !== undefined && !ref(pin.hover)) fail(errors, `accent.${th}.hover: bậc ${SHADES.join("/")} của primary hoặc mã hex`);
    if (typeof pin.fill === "string" && pin.hover === undefined) fail(errors, `accent.${th}.hover: bắt buộc khi fill là mã hex`);
    if (pin.on !== undefined && !(pin.on === "white" || pin.on === "dark" || isHex(pin.on))) fail(errors, `accent.${th}.on: white, dark hoặc mã hex`);
  }
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
      const s = b.sample;
      const figure = (f) => f !== undefined && (typeof f !== "object" || f === null || !str(f.label) || !str(f.value));
      if (s !== undefined) {
        if (typeof s !== "object" || s === null) fail(errors, "brief.sample: phải là object { list, items, metric, proof }");
        else {
          if (s.list !== undefined && !str(s.list)) fail(errors, "brief.sample.list: tên danh sách chính của sản phẩm, vd. \"Bản in\"");
          if (s.items !== undefined && (!strList(s.items) || s.items.length < 2 || s.items.length > 5)) fail(errors, "brief.sample.items: 2–5 tên mục thật của sản phẩm, vd. [\"Móc khoá PLA\", \"Giá đỡ điện thoại\"]");
          if (figure(s.metric)) fail(errors, "brief.sample.metric: { label, value }, con số người dùng mở app để xem, vd. { \"label\": \"Bản in hôm nay\", \"value\": \"128\" }");
          if (figure(s.proof)) fail(errors, "brief.sample.proof: { label, value }, bằng chứng cho trang giới thiệu, vd. { \"label\": \"Bản in đã giao\", \"value\": \"12.000+\" }");
        }
      } else warnings.push("Chưa có brief.sample: màn mẫu trong brand book và trang đầu của app mới dùng chữ chung chung. Thêm tên danh sách, vài mục thật và con số chính của sản phẩm");
    }
  }
  const l = brand.logo;
  if (l === undefined) warnings.push("Chưa có logo: brand book và app mới chỉ hiện tên bằng chữ. Đưa logo vào assets/logo.svg rồi chạy set logo=assets/logo.svg");
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
      if (c.buttonText !== undefined && !BUTTON_TEXT.includes(c.buttonText)) fail(errors, `color.buttonText: "${c.buttonText}" phải là ${BUTTON_TEXT.join(", ")}`);
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
      buttonText: c.buttonText ?? "auto",
      secondaryRule: secondaryRole ? SECONDARY_ROLE[secondaryRole] : null,
    },
    imagery: brand.imagery ?? null,
  };
}

/** The shade a brand colour sits on: the one whose ladder lightness is closest to it. */
export function brandStep(hex, p = PARAMS) {
  const { l } = hexToOklch(hex);
  const ladder = p.ladder;
  return SHADES.reduce((best, s) => (Math.abs(ladder[s] - l) < Math.abs(ladder[best] - l) ? s : best), 500);
}

/**
 * 50…900 from one colour: every shade has the ladder's lightness and the colour's hue; the brand colour itself sits on
 * its nearest shade (brandStep), unchanged. Chroma fades towards white and eases off towards black, and is lowered
 * further only where sRGB cannot show it.
 */
export function scale(hex, p = PARAMS) {
  const { l, c, h } = hexToOklch(hex);
  const step = brandStep(hex, p);
  const { lighter, darker, white } = p.chroma;
  const out = {};
  for (const s of SHADES) {
    if (s === step) {
      out[s] = hex.toLowerCase().length === 4 ? oklchToHex({ l, c, h }) : hex.toLowerCase();
      continue;
    }
    const L = p.ladder[s];
    const chroma = L > l ? c * Math.max(0, 1 - (L - l) / (white - l)) ** lighter : c * (1 - darker * Math.min(1, (l - L) / Math.max(0.05, l - 0.2)));
    out[s] = oklchToHex({ l: L, c: chroma, h });
  }
  return out;
}

const DARK_TEXT = "#0c0d0e";
const WHITE = "#ffffff";
/** Shades the per-theme accent is taken from, in order of preference (docs/BRANDS.md "Accent per theme"). */
const ACCENT_RANGE = { light: [600, 700], dark: [500, 400] };
const minContrast = (color, backgrounds) => Math.min(...backgrounds.map((bg) => contrast(color, bg)));

/**
 * The solid fill of a theme (buttons, checked controls): of every shade × text colour that reads at AA, the one closest
 * to the brand colour. When that one blends into the page (< 3:1, e.g. navy on a dark page), a shade within `reach`
 * of the brand that stands out is taken instead; if none does, the brand colour stays and the report says so. Ties go
 * to the theme's usual text (dark text in the dark theme, white in the light theme).
 */
function pickFill(sc, brandHex, theme, surfaces, text = "auto", reach = PARAMS.fillReach) {
  const usual = theme === "dark" ? DARK_TEXT : WHITE;
  const cands = [];
  // color.buttonText forces the text colour (e.g. white on an orange brand: a deeper shade); a theme where no shade
  // reads with it falls back to both.
  const forced = text === "white" ? [WHITE] : text === "dark" ? [DARK_TEXT] : null;
  const ons = forced && SHADES.some((s) => contrast(sc[s], forced[0]) >= AA) ? forced : [DARK_TEXT, WHITE];
  for (const shade of SHADES)
    for (const on of ons) {
      const ratio = contrast(sc[shade], on);
      if (ratio >= AA) cands.push({ shade, on, ratio, de: deltaE(sc[shade], brandHex), page: minContrast(sc[shade], surfaces) });
    }
  if (!cands.length) return { shade: theme === "dark" ? 300 : 800, on: theme === "dark" ? DARK_TEXT : WHITE, de: 1, page: 0 };
  const order = (a, b) => a.de - b.de || (a.on === usual ? -1 : 0) - (b.on === usual ? -1 : 0);
  cands.sort(order);
  const best = cands[0];
  if (best.page >= NON_TEXT) return best;
  return cands.find((c) => c.page >= NON_TEXT && c.de <= best.de + reach) ?? best;
}

/** Hover of a fill: the next shade away from its text colour (lighter under dark text), or the other way when that one no longer reads. */
function pickHover(sc, fill) {
  const i = SHADES.indexOf(fill.shade);
  const away = fill.on === DARK_TEXT ? [i - 1, i + 1] : [i + 1, i - 1];
  for (const j of away) if (j >= 0 && j < SHADES.length && contrast(sc[SHADES[j]], fill.on) >= AA) return SHADES[j];
  return SHADES[Math.min(SHADES.length - 1, Math.max(0, away[0]))];
}

/**
 * Per-theme accent (Apple's system-colour practice: the dark variant lighter and more vivid, the light one deeper).
 * Light: shade 600 (closest to the brand, owner decision on #85), 700 only when 600 fails white text at AA or the 3:1 page rule.
 * Dark: of 400-500, the one closest to the brand colour under the same two rules (ties go to 500, Semi's own default).
 * Text colour: the theme's usual one (white on the light fill, dark text on the dark fill) when it reads, else the other.
 * When no shade of that range works (a very light or very dark brand) the rest of the scale is tried, nearest to the
 * range first, and `wide` says so. Returns { shade, on, ratio, de, page, wide } or null.
 */
function pickThemeFill(sc, brandHex, theme, pages, text = "auto") {
  const usual = theme === "dark" ? DARK_TEXT : WHITE;
  const forced = text === "white" ? [WHITE] : text === "dark" ? [DARK_TEXT] : null;
  const ons = [...(forced && SHADES.some((s) => contrast(sc[s], forced[0]) >= AA) ? forced : [DARK_TEXT, WHITE])].sort((a, b) => (b === usual) - (a === usual));
  const fit = (shades, wide) => {
    const found = [];
    for (const shade of shades) {
      const on = ons.find((o) => contrast(sc[shade], o) >= AA);
      const page = minContrast(sc[shade], pages);
      if (on && page >= NON_TEXT) found.push({ shade, on, ratio: contrast(sc[shade], on), de: deltaE(sc[shade], brandHex), page, wide });
    }
    return found;
  };
  const range = ACCENT_RANGE[theme];
  const inRange = fit(range, false);
  if (inRange.length) return theme === "light" ? inRange[0] : inRange.sort((a, b) => a.de - b.de || b.shade - a.shade)[0];
  const rest = fit(SHADES.filter((s) => !range.includes(s)), true);
  const mid = theme === "light" ? 650 : 450;
  return rest.sort((a, b) => Math.abs(a.shade - mid) - Math.abs(b.shade - mid))[0] ?? null;
}

/** Hover: one step in the theme's direction (deeper in light, lighter in dark); the other way when that no longer reads. */
function pickThemeHover(sc, fill, theme) {
  const i = SHADES.indexOf(fill.shade);
  const dir = theme === "light" ? 1 : -1;
  for (const j of [i + dir, i - dir]) if (j >= 0 && j < SHADES.length && contrast(sc[SHADES[j]], fill.on) >= AA) return SHADES[j];
  return pickHover(sc, fill);
}

/** A pinned value of brand.json accent.<theme>: a shade number of the primary scale or a hex. */
const pinColor = (sc, v) => String(typeof v === "number" ? sc[v] : v).toLowerCase();
const pinOn = (v) => (v === "white" ? WHITE : v === "dark" ? DARK_TEXT : v.toLowerCase());

/**
 * The accent of one theme: pinned in brand.json (accent.light / accent.dark) or derived. Returns
 * { fill, shade, hover, hoverShade, on, de, page, wide } (colours as hex; shade / hoverShade null for a pinned hex).
 */
function accentOf(sc, brandHex, theme, pages, pin, text, reach) {
  if (pin) {
    const fill = pinColor(sc, pin.fill);
    const shade = typeof pin.fill === "number" ? pin.fill : null;
    const usual = theme === "dark" ? [DARK_TEXT, WHITE] : [WHITE, DARK_TEXT];
    const on = pin.on ? pinOn(pin.on) : usual.find((o) => contrast(fill, o) >= AA) ?? usual.reduce((a, b) => (contrast(fill, a) >= contrast(fill, b) ? a : b));
    const hoverShade = typeof pin.hover === "number" ? pin.hover : pin.hover === undefined && shade !== null ? pickThemeHover(sc, { shade, on }, theme) : null;
    const hover = pin.hover === undefined ? sc[hoverShade] : pinColor(sc, pin.hover);
    return { fill, shade, hover, hoverShade, on, de: deltaE(fill, brandHex), page: minContrast(fill, pages), wide: false, pinned: true };
  }
  const f = pickThemeFill(sc, brandHex, theme, pages, text) ?? { ...pickFill(sc, brandHex, theme, pages, text, reach), wide: true };
  const hoverShade = pickThemeHover(sc, f, theme);
  return { fill: sc[f.shade], shade: f.shade, hover: sc[hoverShade], hoverShade, on: f.on, de: f.de, page: f.page, wide: f.wide };
}

/**
 * Accent of both themes. `sameInBothThemes: true` (an explicit brand choice) takes one fill that reads and stands out on
 * the pages of both themes; otherwise each theme has its own (pickThemeFill) unless accent.light / accent.dark pin it.
 */
function accents(sc, brand, pagesBy, reach) {
  const text = brand.color?.buttonText;
  if (brand.accent?.sameInBothThemes) {
    const all = [...pagesBy.dark, ...pagesBy.light];
    const f = pickFill(sc, brand.primary, "dark", all, text, reach);
    const h = pickHover(sc, f);
    const a = { fill: sc[f.shade], shade: f.shade, hover: sc[h], hoverShade: h, on: f.on, de: f.de, page: f.page, wide: false };
    return { dark: a, light: a };
  }
  return Object.fromEntries(THEMES.map((th) => [th, accentOf(sc, brand.primary, th, pagesBy[th], brand.accent?.[th], text, reach)]));
}

/** Errors for an accent that does not switch: light and dark fills equal without accent.sameInBothThemes. */
export function accentErrors(themes, brand) {
  const d = themes?.dark?.["color-accent"];
  const l = themes?.light?.["color-accent"];
  if (d && l && String(d).toLowerCase() === String(l).toLowerCase() && !brand?.accent?.sameInBothThemes)
    return [`accent: màu nút chính giống nhau ở theme sáng và tối (${d}). Theme tối nên sáng và rực hơn, theme sáng sâu hơn; nếu thương hiệu cố ý giữ một màu thì đặt "accent": { "sameInBothThemes": true }`];
  return [];
}

/**
 * Coloured text (accent-fg): the shade closest to the brand colour that reads at AA on every surface and on the
 * accent-subtle tint of itself (selected rows, active pills). The focus ring and selected borders use it too.
 */
function pickText(sc, brandHex, theme, surfaces, pages, subtle) {
  const reads = (s) => minContrast(sc[s], [...surfaces, ...pages.map((bg) => blend(sc[s], bg, subtle))]);
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

/** The control-line edge (text-muted at the token's opacity) against the surfaces an input sits on, worst case. */
function controlEdge(n, alpha) {
  return Math.min(...SURFACES.slice(0, 4).map((k) => contrast(blend(n["color-text-muted"], n[k], alpha), n[k])));
}

/**
 * Nudge muted / body text until it reads at AA on every surface (tinting can cost a little contrast), and muted on
 * until the input edge mixed from it (control-line) reaches 3:1.
 */
function fixText(n, theme, alpha) {
  const surfaces = SURFACES.map((k) => n[k]);
  for (const k of ["color-text-muted", "color-text-body"]) {
    let { l, c, h } = hexToOklch(n[k]);
    const weak = () => surfaces.some((bg) => contrast(n[k], bg) < AA + 0.1) || (k === "color-text-muted" && alpha && controlEdge(n, alpha) < NON_TEXT + 0.05);
    for (let i = 0; i < 40 && weak(); i++) {
      l += theme === "dark" ? 0.01 : -0.01;
      n[k] = oklchToHex({ l, c, h });
    }
  }
  return n;
}

/** Every token of a brand, its CSS and a contrast report. Throws when validateBrand finds errors. */
export function generateBrand(brand, { tokens, styles, version = "", params }) {
  const p = mergeParams(params);
  const { errors, warnings } = validateBrand(brand, { styles });
  if (errors.length) throw Object.assign(new Error(`brand.json không hợp lệ:\n- ${errors.join("\n- ")}`), { errors });
  const allowed = brand.styles.allowed.map((id) => styles.styles.find((s) => s.id === id));
  const primary = scale(brand.primary, p);
  const secondary = brand.secondary ? scale(brand.secondary, p) : null;
  const { h: hue } = hexToOklch(brand.primary);
  const status = separateStatus(tokens, brand.primary, p);

  // Neutrals of every allowed style, both themes.
  const neutrals = {};
  for (const st of allowed) {
    const base = baseNeutrals(st, tokens);
    neutrals[st.id] = {};
    for (const theme of THEMES) {
      const n = { ...base[theme] };
      if (brand.neutral === "tinted") {
        const ch = p.tint[st.id] ?? 0.01;
        const surf = p.surfaceTint[st.id] ?? 0.003;
        for (const k of NEUTRAL_KEYS) {
          const c = SURFACES.includes(k) ? surf : k.startsWith("color-text") ? ch * 0.6 : k.startsWith("color-line") || k === "color-divider" ? ch * 2 : ch;
          n[k] = tint(n[k], hue, c);
        }
      }
      neutrals[st.id][theme] = fixText(n, theme, controlLineAlpha(tokens, theme));
    }
  }

  // Accent shades: chosen against the surfaces of every allowed style.
  const report = [];
  const themes = {};
  const fidelity = {};
  const themeName = { dark: "tối", light: "sáng" };
  const pagesBy = Object.fromEntries(THEMES.map((th) => [th, allowed.flatMap((st) => PAGES.map((k) => neutrals[st.id][th][k]))]));
  const accent = accents(primary, brand, pagesBy, p.fillReach);
  for (const theme of THEMES) {
    const surfaces = allowed.flatMap((st) => SURFACES.map((k) => neutrals[st.id][theme][k]));
    const pages = pagesBy[theme];
    const subtle = subtleAlpha(tokens, theme);
    const fill = accent[theme];
    const label = (shade, hex) => (shade === null ? hex : `primary-${shade}`);
    const fillName = label(fill.shade, fill.fill);
    const hoverName = label(fill.hoverShade, fill.hover);
    const fg = pickText(primary, brand.primary, theme, surfaces, pages, subtle);
    themes[theme] = {
      "color-accent": fill.fill,
      "color-accent-hover": fill.hover,
      "color-on-accent": fill.on,
      "color-accent-fg": primary[fg.shade],
    };
    fidelity[theme] = { fill: fill.shade, text: fg.shade, deltaE: +fill.de.toFixed(3) };
    const t = themeName[theme];
    report.push({ check: `nút chính (${t})`, pair: `chữ ${fill.on} / ${fillName}`, ratio: contrast(fill.on, fill.fill), min: AA });
    report.push({ check: `nút chính khi hover (${t})`, pair: `chữ ${fill.on} / ${hoverName}`, ratio: contrast(fill.on, fill.hover), min: AA });
    report.push({ check: `chữ màu chính (${t})`, pair: `primary-${fg.shade} / nền + nền chọn`, ratio: fg.ratio, min: AA });
    report.push({ check: `viền focus (${t})`, pair: `primary-${fg.shade} / nền`, ratio: minContrast(primary[fg.shade], surfaces), min: NON_TEXT });
    // Soft: a filled control may blend into the page (light brands on white) and still be usable through its text or
    // check mark; reported so the person sees it, never a build failure.
    report.push({ check: `nút tách khỏi nền (${t})`, pair: `${fillName} / nền`, ratio: fill.page, min: NON_TEXT, soft: true });
    if (fill.wide)
      warnings.push(
        `Theme ${t}: không có bậc nào trong ${ACCENT_RANGE[theme].join("/")} vừa đạt chữ 4.5:1 vừa tách khỏi nền 3:1, nút chính dùng ${fillName} (${fill.fill}). ` +
          ([DARK_TEXT, WHITE].some((on) => contrast(brand.primary, on) >= AA) ? "" : "Cả chữ trắng lẫn chữ tối trên màu gốc đều chưa đạt 4.5:1"),
      );
    if (fill.page < NON_TEXT)
      warnings.push(`Theme ${t}: nút màu thương hiệu chỉ tách khỏi nền ${fill.page.toFixed(2)}:1 (< 3:1). Nút vẫn đọc được nhờ chữ, nhưng công tắc, thanh trượt và ô chọn khó thấy hơn`);
    if (secondary) {
      const sfg = pickText(secondary, brand.secondary, theme, surfaces, pages, subtle);
      const sfill = pickFill(secondary, brand.secondary, theme, pages, "auto", p.fillReach);
      themes[theme]["color-secondary-fg"] = secondary[sfg.shade];
      themes[theme]["color-secondary-solid"] = secondary[sfill.shade];
      themes[theme]["color-on-secondary"] = sfill.on;
      report.push({ check: `chữ màu phụ (${t})`, pair: `secondary-${sfg.shade} / nền + nền chọn`, ratio: sfg.ratio, min: AA });
      report.push({ check: `nền màu phụ (${t})`, pair: `chữ ${sfill.on} / secondary-${sfill.shade}`, ratio: contrast(sfill.on, secondary[sfill.shade]), min: AA });
    }
    const alpha = controlLineAlpha(tokens, theme);
    for (const st of allowed) {
      const n = neutrals[st.id][theme];
      const worst = Math.min(...SURFACES.slice(0, 4).map((k) => contrast(n["color-text-muted"], n[k])));
      report.push({ check: `chữ mờ ${st.name} (${t})`, pair: `text-muted / nền`, ratio: worst, min: AA });
      // Edge of inputs, checkboxes, radios and of the chosen segment (SEGMENT_ON): WCAG 1.4.11.
      if (alpha) report.push({ check: `viền ô nhập ${st.name} (${t})`, pair: `control-line / nền`, ratio: controlEdge(n, alpha), min: NON_TEXT });
    }
    // Semi's status text stays the same for every brand; the brand's tinted surfaces must still carry it (the surfaces
    // text sits on: canvas, app, panel, field, like text-muted; raised is a hover / track fill).
    const textSurfaces = allowed.flatMap((st) => SURFACES.slice(0, 4).map((k) => neutrals[st.id][theme][k]));
    for (const [st, label] of Object.entries(STATUS_FG)) {
      const fgHex = status[st]?.[theme]?.[`color-${st}-fg`] ?? resolveToken(tokens.semantic?.[`color-${st}-fg`]?.[theme], tokens);
      if (!isHex(fgHex)) continue;
      report.push({ check: `chữ trạng thái ${label} (${t})`, pair: `${st}-fg / nền`, ratio: minContrast(fgHex, textSurfaces), min: AA });
    }
  }
  for (const r of report) r.ok = r.ratio >= r.min;
  const same = accentErrors(themes, brand);
  if (same.length) throw Object.assign(new Error(`brand.json không hợp lệ:\n- ${same.join("\n- ")}`), { errors: same });
  for (const [st, e] of Object.entries(status)) {
    const name = { danger: "lỗi", success: "thành công", warning: "cảnh báo", info: "thông tin" }[st];
    const left = hueDistance(hue, hexToOklch(e.to).h);
    warnings.push(
      `Màu ${name} được xoay ${Math.abs(e.turn)}° (${e.from} → ${e.to}) để không lẫn với màu chính` +
        (left < p.statusGap - 0.5 ? ` nhưng vẫn chỉ cách ${Math.round(left)}° (giới hạn để giữ nghĩa): trạng thái luôn kèm icon hoặc chữ` : ""),
    );
  }
  if (report.some((r) => !r.ok && !r.soft)) warnings.push("Có cặp màu chưa đạt AA: xem bảng contrast");

  const fonts = resolveFonts(brand, styles);
  const out = {
    name: brand.name,
    package: brand.package,
    semi: brand.semi ?? null,
    styles: brand.styles,
    neutral: brand.neutral,
    primary,
    brandStep: brandStep(brand.primary, p),
    ...(secondary ? { secondary, secondaryStep: brandStep(brand.secondary, p) } : {}),
    themes,
    ...(brand.accent ? { accent: brand.accent } : {}),
    ...(Object.keys(status).length ? { status } : {}),
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
  // Status colours turned away from the primary (separateStatus), same scopes as the accent.
  if (t.status && Object.keys(t.status).length) {
    const sv = (theme) => Object.values(t.status).flatMap((e) => Object.entries(e[theme]).map(([k, v]) => [src(k), v]));
    css += `/* Status, turned away from the primary */\n${block(scopes("dark", [":root"]), sv("dark"))}\n${block(scopes("light"), sv("light"))}\n`;
    css += `@media (prefers-color-scheme: light) {\n${block([`[data-theme="system"]`], sv("light"), "  ")}}\n\n`;
  }
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
