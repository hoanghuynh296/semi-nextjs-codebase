// Brand generator (1.0): brand.json → the brand's fills, its fonts and its guideline, checked for WCAG AA.
//
//   validateBrand(brand)                              → { errors, warnings }
//   generateBrand(brand, { tokens, version, params }) → { tokens, css, fonts, report, warnings }
//
// What the brand chooses (docs/BRANDS.md): primary (required) and secondary (optional), each a colour with an optional
// text colour on it; fonts.sans and an optional fonts.display; logo; voice. What is derived: for each fill the text
// colour on it (white, near-black or black: the first that reaches 4.5:1, unless brand.json names one that does) and a
// hover that keeps it. Nothing else: surfaces, text, lines, focus and status colours are Semi's own, the same for every
// brand (tokens/tokens.json), and the brand colour is only for the main buttons and a few attention marks. No
// dependencies; the docs site's brand preview runs the same code in the browser. The one number lives in ./params.mjs.
import { PARAMS, mergeParams } from "./params.mjs";
import { contrast, hexToOklch, isHex, oklchToHex } from "./color.mjs";
// Shipped in the package (package.json files): the same AA decision as the token build (the New tag's text).
import { newTagText } from "../scripts/token-css.mjs";

export { PARAMS, mergeParams };
const THEMES = ["dark", "light"];
const AA = 4.5;
/** A filled button should stand out from the page (WCAG 1.4.11 3:1); reported, never a failure (its label carries it). */
const NON_TEXT = 3;
/** Surfaces a main button sits on (Semi's neutrals, the same for every brand). */
const PAGES = ["color-canvas", "color-app", "color-panel"];
/** Text colours tried on a fill, in order: white, Semi's near-black, black (one of the last two always reaches 4.5:1 when white does not). */
export const ON_COLORS = ["#ffffff", "#0c0d0e", "#000000"];
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
  "Montserrat Alternates": { weight: ["400", "500", "600", "700"] }, // headings 400 / 500 since 1.0
  "Be Vietnam Pro": { weight: ["400", "500", "600", "700"] },
};
/**
 * Fields of a brand.json before 1.0 that no longer do anything: ignored, with this warning (the kit still builds).
 * key = a path in brand.json, value = what it did.
 */
export const REMOVED_FIELDS = {
  neutral: "chọn màu trung tính (xám ngả màu chính / xám trung tính / của style). Từ 1.0 mặt nền và chữ là xám trung tính của Semi, giống nhau cho mọi thương hiệu",
  primaryStyle: "nút chính màu thương hiệu hay đảo màu (đen / trắng). Từ 1.0 nút chính luôn là màu chính; nút đảo màu là variant của Button",
  styles: "các style được dùng (Flat / Soft / Sharp). Từ 1.0 Semi chỉ có một style",
  accent: "ghim sắc độ nút chính / chữ màu chính theo theme. Từ 1.0 nút chính là đúng màu primary, chữ trên nó tự chọn (hoặc primary.on)",
  palettes: "bảng màu riêng (đã bỏ từ 0.14.0)",
  "color.accent": "mức dùng màu chính (tiết chế / cân bằng / phóng khoáng). Từ 1.0 màu thương hiệu chỉ cho nút chính và vài dấu hiệu chú ý, cho mọi thương hiệu",
  "color.buttonText": "chữ trên nút chính (auto / white / dark). Từ 1.0: primary.on / secondary.on",
  "color.secondaryRole": "vai trò của màu phụ (điểm nhấn / badge / minh hoạ). Từ 1.0 màu phụ chỉ cho nút chính thứ hai",
  "fonts.figure": "font số KPI. Từ 1.0 số dùng font giao diện",
};
const at = (o, path) => path.split(".").reduce((v, k) => (v && typeof v === "object" ? v[k] : undefined), o);

/** A brand colour field: "#rrggbb" or { color: "#rrggbb", on?: "#rrggbb" } → { color, on } (strings as given). */
export function colorField(v) {
  if (v == null) return null;
  if (typeof v === "string") return { color: v, on: undefined };
  if (typeof v === "object") return { color: v.color, on: v.on };
  return { color: v, on: undefined };
}

const fail = (errors, msg) => errors.push(msg);

/** Problems with a brand.json, before anything is generated. errors stop the build; warnings go into the report. */
export function validateBrand(brand) {
  const errors = [];
  const warnings = [];
  if (!brand || typeof brand !== "object") return { errors: ["brand.json không phải một object JSON"], warnings };
  if (!brand.name) fail(errors, "name: thiếu tên thương hiệu");
  if (!/^(@[a-z0-9-]+\/)?[a-z0-9-]+$/.test(brand.package || "")) fail(errors, `package: "${brand.package ?? ""}" không phải tên npm hợp lệ (vd. @3dnoobs/brand)`);
  for (const key of ["primary", "secondary"]) {
    const f = colorField(brand[key]);
    if (!f && key === "secondary") continue;
    if (!f || !isHex(f.color)) {
      fail(errors, `${key}: "${f?.color ?? ""}" phải là mã hex (#00AE42) hoặc { "color": "#00AE42", "on": "#ffffff" }`);
      continue;
    }
    if (f.on !== undefined) {
      if (!isHex(f.on)) fail(errors, `${key}.on: "${f.on}" phải là mã hex (màu chữ trên ${key})`);
      else if (contrast(f.on, f.color) < AA) fail(errors, `${key}.on: chữ ${f.on} trên ${f.color} chỉ đạt ${contrast(f.on, f.color).toFixed(2)}:1 (< 4.5:1); bỏ "on" để tự chọn`);
    }
  }
  for (const [path, what] of Object.entries(REMOVED_FIELDS))
    if (at(brand, path) !== undefined) warnings.push(`${path}: không còn dùng từ Semi 1.0 (trước đây: ${what}); bỏ khỏi brand.json`);
  for (const role of ["sans", "display"]) {
    const f = brand.fonts?.[role];
    if (f === undefined && role === "display") continue;
    const family = typeof f === "string" ? f : f?.family;
    if (!family) fail(errors, `fonts.${role}: thiếu tên font`);
    else if (!FONTS[family] && !(typeof f === "object" && f.weight))
      warnings.push(`fonts.${role}: "${family}" không nằm trong danh sách đã kiểm tra; nếu font không có bản variable, thêm "weight": ["400", "500"]`);
  }
  if (brand.semi && !/^([\^~]?\d+\.\d+(\.\d+)?|>=\d+\.\d+(\.\d+)? <\d+\.\d+(\.\d+)?)$/.test(brand.semi)) fail(errors, `semi: "${brand.semi}" phải là dải phiên bản như ">=1.0.0 <2.0.0" (từ minor này đến trước major kế tiếp) hoặc ^1.0.0`);
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
  if (brand.imagery !== undefined && !str(brand.imagery)) fail(errors, "imagery: một đoạn mô tả ảnh / minh hoạ");
  // Density and type scale belong to each product (semi-lint.json, /semi-new-app), not to the brand. The 0.17 draft
  // keys typography / motif are gone.
  if (brand.density !== undefined) warnings.push("density: mật độ là lựa chọn của từng sản phẩm (dashboard gọn, web bán hàng thoáng), không phải của thương hiệu; bỏ khỏi brand.json, chọn khi tạo app (/semi-new-app)");
  if (brand.typography !== undefined) warnings.push("typography: không còn dùng (cỡ chữ là của từng sản phẩm, độ đậm tiêu đề do Semi quyết định); bỏ khỏi brand.json");
  if (brand.motif !== undefined) warnings.push("motif: không còn dùng; bỏ khỏi brand.json");
  if (!brand.voice) warnings.push("Chưa có giọng văn (voice): agent sẽ viết chữ theo mặc định trung tính. Thêm voice để sản phẩm nói đúng giọng thương hiệu");
}

/** What the brand colour is for, the same for every brand (docs/BRANDS.md, docs/TOKENS.md). */
const COLOR_RULE =
  "Màu chính chỉ cho nút chính của một trang, một hộp thoại hoặc nút chính của thanh điều hướng (bg-primary + text-on-primary, tối đa một nút tô màu mỗi trang / hộp thoại), badge đếm cần chú ý, nhãn “Mới” và gạch chân tab lớn đang chọn. Mọi thứ khác (nút thường, mục đang chọn, link, focus, trạng thái) là màu trung tính hoặc màu trạng thái của Semi.";
const SECONDARY_RULE = "nút chính thứ hai (bg-secondary + text-on-secondary), không cho chữ, nền hay trang trí";

/** The guideline with defaults filled in: what BRAND.md, AGENTS.brand.md, the preview and agents read. */
export function resolveGuide(brand) {
  const v = brand.voice ?? {};
  const tone = v.tone ?? "neutral";
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
    color: { rule: COLOR_RULE, secondaryRule: brand.secondary ? SECONDARY_RULE : null },
    imagery: brand.imagery ?? null,
  };
}

/** The text colour on a fill: `on` when given (validated), else the first of ON_COLORS that reaches 4.5:1 (else the best). */
export function pickOn(fill, on) {
  if (on) return on.toLowerCase();
  const ok = ON_COLORS.find((c) => contrast(c, fill) >= AA);
  return ok ?? ON_COLORS.reduce((a, b) => (contrast(b, fill) > contrast(a, fill) ? b : a));
}

/**
 * Hover of a fill: `step` OKLCH lightness away from its text colour (darker under white text, lighter under dark text),
 * so the text keeps (and gains) contrast; same hue and chroma.
 */
export function hoverOf(fill, on, step = PARAMS.hoverStep) {
  const o = hexToOklch(fill);
  const lighter = hexToOklch(on).l < o.l;
  const l = Math.min(0.99, Math.max(0.02, o.l + (lighter ? step : -step)));
  return oklchToHex({ l, c: o.c, h: o.h }).toLowerCase();
}

/** One brand fill: { fill, hover, on } from a brand.json colour field. */
export function brandFill(field, p = PARAMS) {
  const fill = field.color.toLowerCase();
  const on = pickOn(fill, field.on);
  return { fill, hover: hoverOf(fill, on, p.hoverStep), on };
}

/** A surface of tokens.json "semantic" as hex in one theme (Semi's neutrals are plain hex). */
const surface = (tokens, key, theme) => tokens?.semantic?.[key]?.[theme];

/**
 * Every token of a brand, its CSS and a contrast report. Throws when validateBrand finds errors.
 * @param {any} brand brand.json
 * @param {{ tokens?: any, version?: string, params?: any }} [options] tokens: tokens/tokens.json (Semi's surfaces for the report)
 */
export function generateBrand(brand, { tokens, version = "", params } = {}) {
  const p = mergeParams(params);
  const { errors, warnings } = validateBrand(brand);
  if (errors.length) throw Object.assign(new Error(`brand.json không hợp lệ:\n- ${errors.join("\n- ")}`), { errors });
  const primary = brandFill(colorField(brand.primary), p);
  const secondary = brand.secondary ? brandFill(colorField(brand.secondary), p) : null;
  const report = [];
  const themeName = { dark: "tối", light: "sáng" };
  for (const [name, label, f] of [["primary", "màu chính", primary], ["secondary", "màu phụ", secondary]]) {
    if (!f) continue;
    report.push({ check: `chữ trên nút ${label}`, pair: `${f.on} / ${name} ${f.fill}`, ratio: contrast(f.on, f.fill), min: AA });
    report.push({ check: `chữ trên nút ${label} khi hover`, pair: `${f.on} / ${name}-hover ${f.hover}`, ratio: contrast(f.on, f.hover), min: AA });
    for (const theme of THEMES) {
      const pages = PAGES.map((k) => surface(tokens, k, theme)).filter(isHex);
      if (!pages.length) continue;
      const ratio = Math.min(...pages.map((bg) => contrast(f.fill, bg)));
      report.push({ check: `nút ${label} tách khỏi nền (${themeName[theme]})`, pair: `${name} / canvas, app, panel`, ratio, min: NON_TEXT, soft: true });
    }
  }
  for (const r of report) r.ok = r.ratio >= r.min;
  for (const r of report)
    if (!r.ok && r.soft) warnings.push(`${r.check}: chỉ ${r.ratio.toFixed(2)}:1 (< 3:1). Nút vẫn đọc được nhờ chữ trên nó, nhưng khó thấy hơn trên nền`);
  if (report.some((r) => !r.ok && !r.soft)) warnings.push("Có cặp màu chưa đạt AA: xem bảng contrast");

  // The "Mới" / "New" tag: the primary at 18% behind primary text, or the strong text where the primary is not AA on it.
  const newTag = tokens?.semantic ? Object.fromEntries(THEMES.map((th) => [th, newTagText(tokens, primary.fill, th)])) : null;
  const fonts = resolveFonts(brand, tokens);
  const out = {
    name: brand.name,
    package: brand.package,
    semi: brand.semi ?? null,
    primary,
    secondary,
    newTag,
    guide: resolveGuide(brand),
    fonts,
  };
  return { tokens: out, css: brandCss(out, version), fonts, report, warnings };
}

/**
 * Font entries for next/font: { roles, family, nextFont, variable, weight? }. A family Semi already loads keeps Semi's
 * variable (tokens.json shape.$fonts: Geist → --font-geist). Without fonts.display the display face is the UI sans.
 */
export function resolveFonts(brand, tokens) {
  const known = Object.fromEntries((tokens?.shape?.$fonts ?? []).map((f) => [f.family, f]));
  const seen = new Map();
  for (const role of ["sans", "display"]) {
    const f = brand.fonts?.[role];
    if (f === undefined) continue;
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

const block = (selectors, vars, pad = "") => `${pad}${selectors.join(`,\n${pad}`)} {\n${vars.map(([k, v]) => `${pad}  ${k}: ${v};`).join("\n")}\n${pad}}\n`;

/**
 * The brand's CSS: imported after @semi/ui/tokens.css. The fills are the same in both themes, set on every theme scope
 * Semi uses (:root, [data-theme], .dark, .light), so they win over Semi's defaults (later at equal specificity, also over
 * its prefers-color-scheme block). runtime: for a page that is already built (the docs site's brand preview): also the
 * font variables next/font would set (`loadedFonts` lists the variables the page already defines).
 * @param {any} t
 * @param {string} version
 * @param {{ runtime?: boolean, loadedFonts?: string[] }} [options]
 */
export function brandCss(t, version, { runtime = false, loadedFonts = [] } = {}) {
  const family = (role) => {
    const f = t.fonts.find((x) => x.roles.includes(role));
    return f ? `var(${f.variable}), "${f.family}"` : null;
  };
  const sec = t.secondary ?? t.primary;
  let css = `/* GENERATED by semi-brand from brand.json — do not edit. ${t.name} (${t.package})${version ? ` · @semi/ui ${version}` : ""}\n   Import after @semi/ui/tokens.css. docs: node_modules/@semi/ui/docs/BRANDS.md */\n`;
  css += `/* Brand fills: main buttons, attention badges, "New" tags, the active big-tab underline (docs/TOKENS.md)${t.secondary ? "" : "; no secondary: it is the primary"} */\n`;
  css += block([":root", "[data-theme]", ".dark", ".light"], [
    ["--semi-primary", t.primary.fill],
    ["--semi-primary-hover", t.primary.hover],
    ["--semi-on-primary", t.primary.on],
    ["--semi-secondary", sec.fill],
    ["--semi-secondary-hover", sec.hover],
    ["--semi-on-secondary", sec.on],
    ...(t.newTag ? [["--semi-new-tag-text-dark", t.newTag.dark], ["--semi-new-tag-text-light", t.newTag.light]] : []),
  ]) + "\n";
  const fontVars = [["--font-sans-family", family("sans")], ["--font-display-family", family("display")]].filter(([, v]) => v);
  if (runtime) for (const f of t.fonts) if (!loadedFonts.includes(f.variable)) fontVars.push([f.variable, `"${f.family}"`]);
  css += `/* Fonts${family("display") ? "" : " (no fonts.display: titles use the UI sans)"} */\n` + block([":root"], fontVars);
  return css;
}
