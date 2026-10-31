#!/usr/bin/env node
// semi-lint: design-system lint for Semi apps (rules: docs/DESIGN_SYSTEM.md, "Anti-patterns"). No dependencies.
//
//   npx semi-lint                     # scan the dirs in semi-lint.json
//   npx semi-lint --files a.tsx b.ts  # only these files (agent edit hook); files outside "scan" are ignored
//   npx semi-lint --update-baseline   # after fixing ratchet hits (or when adopting Semi): rewrite the baseline
//   npx semi-lint --json              # machine-readable result (used by the semi-audit skill)
//
// Scans .ts/.tsx/.js/.jsx/.mjs (and @apply in .css). Colour and size rules read class tokens out of every string
// literal (lint/classes.mjs), so className strings, cn() args, constants and template parts are all covered.
//
// HARD rules fail on any hit. RATCHET rules are old debt: each file may not get more hits than recorded in the
// baseline (new files start at 0), so the debt only shrinks.
//
// Config: semi-lint.json in the current directory (all keys optional):
//   {
//     "scan": ["app", "components"],                // dirs (relative to cwd) scanned for .ts/.tsx
//     "baseline": "semi-lint-baseline.json",
//     "skip": { "inline-svg-path": ["components/brand/Logo.tsx"] },   // rule id → path prefixes it ignores
//     "only": { "viewport-grid-cols": ["components/catalog/"] },      // rule id → only these path prefixes
//     "disable": ["loading-text"]                   // rule ids turned off (record why in your app's doc)
//   }
// A rule that the Semi docs add and that can be grepped belongs here too (change it in the semi repo, not per app).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { analyse } from "./classes.mjs";

/** [id, regex, message] */
export const HARD = [
  ["font-weight", /font-(bold|extrabold|black)\b/, "weights are font-medium / font-semibold only"],
  ["tiny-text", /text-\[(8|9|10)px\]/, "minimum text size is text-caption (11px)"],
  ["uppercase-label", /uppercase tracking-(wide|wider|widest)|tracking-(wide|wider|widest) uppercase/, "labels are sentence case"],
  ["native-select", /<select\b/, "use CustomSelect from @semi/ui"],
  ["rounded-md", /\brounded-md\b/, "radius scale: rounded (tiny marks) / lg / xl / 2xl / full"],
  [
    "tw-text-size",
    /\btext-(xs|sm|base|lg|xl)\b/,
    "use the type scale: text-caption 11 · text-label 12 · text-ui 13 · text-ui-lg 14 · text-title 15 · text-title-lg 16, KPI figures text-kpi sm:text-heading (KpiCard), titles text-heading sm:text-display (PageTitle)",
  ],
  ["grey-surface", /bg-gray-(800|900)|border-gray-700/, "use the surface tokens (bg-panel, border-line…)"],
  [
    "legacy-shell-aside",
    /\bw-(56|60|64)\b[^"'\n]*\bborder-r\b|\b-translate-x-full\b/,
    "use AppShell from @semi/ui (floating rounded-2xl bento sidebar + MobileTabBar), not a fixed border-r or hamburger drawer <aside>",
  ],
  [
    "legacy-ui-wrapper",
    /export\s+function\s+(PageHeader|Select|Modal|Input|Textarea|Button|EmptyState)\b/,
    "do not keep a local ui.tsx wrapper: use Button, Input, Textarea, Field, CustomSelect, Modal, EmptyState, PageTitle, SubpageToolbar from @semi/ui",
  ],
  ["gradient", /bg-gradient-|linear-gradient|radial-gradient|from-primary-\d+ to-/, "flat UI: no gradients"],
  [
    "glow",
    /GLOW_(PRIMARY|CARD)|shadow-\[0_0_|shadow-\[[^\]]*rgba\((?!0,\s*0,\s*0)|(?<!backdrop-)\bblur-(lg|xl|2xl|3xl)\b/,
    "flat UI: no glow blobs or coloured glow shadows",
  ],
  ["native-dialog", /window\.(confirm|alert|prompt)\(/, "use confirmDialog() from @semi/ui / a toast"],
  ["native-input", /type="(date|number)"/, "use DatePicker / NumberInput from @semi/ui"],
  ["glyph-icon", /[✓✔✕✖✗✘⚠☑☒]/, 'use <Icon name="close|check|alert" />, not unicode glyphs'],
  [
    "icon-alias",
    /<(?:Icon|IconTile)\b[^>]*\bname=["'](delete|remove|bin|destroy|cancel|x|cross|dismiss|reload|sync|fetch|add|new|create|pencil|modify|rename|duplicate|clone|warning|danger|error|tick|done|success|gear|config|cog|preferences|parameters|adjust|tune|funnel|profile|account|customer|team|members|group|notification|notifications|category|label|badge|cart_item|shop|shopping|price|money|cost|parcel|inventory|fullscreen|maximize|minimize|exit_fullscreen|return|previous|next|forward|signout|sign_out|ai|magic|help|tooltip|confirm|accept|ok|mail|email|message|link|open_link|shutdown|turn_off|turn_on|power_off|scale|decrease|increase|shopping_bag|shopping-bag|shop_bag|credit_card|credit-card|payment|card|invoice|bill|shipping|delivery|delivered|package_check|package-check|discount|voucher|coupon|percentage|storefront|marketplace|balance|verified|official|mall|present|bonus|reward|wishlist|like|favorite|rating|review|rate|sku|scan|barcode_scan|qr|qr_code|qr-code|qrcode|vietqr|cash|money_bill|cod|bank|bank_transfer|bank-transfer|unboxing|package_open|package-open|cancel_order|cancelled_order|package_x|package-x|add_stock|new_order|package_plus|package-plus|order_list|invoice_list|orders|clipboard_list|clipboard-list|address|location|shipping_address|map_pin|map-pin|deal|hot_deal|flash_sale|badge_percent|badge-percent|hot|trending|best_seller|fire|marketing|promotion|campaign|broadcast|loyalty|membership|vip|trophy|calc|calculate|estimate|db|sql|storage|host|backend|mcu|processor|chip|mainboard|debug|issue|commit|git_commit|git-commit|pr|pull_request|pull-request|security|protect|ssl|firewall|token|api_key|secret|access_code|pulse|heartbeat|telemetry|growth|uptrend|trending_up|trending-up|downtrend|trending_down|trending-down|pie|pie_chart|pie-chart|chart_pie|speed|speedometer|temp|temperature|heat|nozzle_temp|bed_temp|spanner|tools|maintenance|repair|jog|jogging|translate|rotate|rotate_cw|rotate-cw|rotate_right|rotate_ccw|rotate-ccw|rotate_left|homing|origin|abl|auto_level|calibrate_bed|measure|measurement|dimension|distance|snap|lay_on_face|lay-on-face|magnetic_bed|eyedropper|color_picker|color-picker|pick_color|primitives|geometry|modifier|negative_volume|support_blocker|zoom_to_fit|center_view|center_model|view_orbit|orbit_camera|3d_orbit|usb_drive|flash_drive|ble|sd_card|sd-card|microsd|emmc|storage_card|hard-drive|motherboard|pcb|circuit-board|wire|wiring|power_backup|lidar|lidar_scan|scan-line|first_layer_scan|safety_alert|shield-alert|door_open|thermal_protection|document|doc|pdf|txt|readme|file_text|file-text|gcode|gcode_file|source_code|file_code|file-code|zip|archive|tar|file_zip|file_archive|file-archive|verified_file|file_check|file-check|new_file|add_file|file_plus|file-plus|excel|csv|spreadsheet|file_excel|file_spreadsheet|file-spreadsheet|new_folder|add_folder|folder_plus|folder-plus|open_folder|folder_open|folder-open|attach|attachment|clip|sound|speaker|volume|volume_2|volume-2|mute|silent|volume_x|volume-x|headset|earphones|microphone|voice|cam|webcam|timelapse|stream|cam_off|webcam_off|video_off|video-off|movie|reel|prev_track|prev_layer|skip_back|skip-back|next_track|next_layer|skip_forward|skip-forward|loop|fast_forward|fast-forward|speed_up|crop_image)["']/,
    "use canonical IconName (e.g. trash for delete, close for cancel/x, refresh for reload, settings for gear, filter for funnel, user for profile, bell for notifications, tag for category/label). See docs/ICONS.md",
  ],
  ["home-button", /name="home"/, "app headers have no Home button: logo + title go home (AppHeader)"],
  ["external-link", /window\.open\(|href=\{?["'`]https?:\/\//, "links to other sites use ExternalLink from @semi/ui"],
  [
    "app-chrome-copy",
    /h-\[34px\] px-4 rounded-lg text-(?:\[12px\]|label) font-semibold|p-1 sm:p-1\.5 rounded-2xl z-20|rounded-2xl p-1 gap-1 select-none shadow-(?:xl|float)/,
    "tool-app headers / canvas controls use @semi/ui/styles (headerPrimary, VIEWPORT_TOOLBAR, VIEWPORT_PILL…), not copies",
  ],
  [
    "card-class-override",
    /<Card\b[^>]*\bclassName=[^>]*(?<![\w-])(?:[a-z-]+:)*(?:bg|shadow)-/,
    "<Card> (@semi/ui) owns its surface: pass padding/layout only, no bg-* or shadow-* (use TONAL_CONTAINER on a plain element for a tinted card).",
  ],
  [
    "viewport-grid-cols",
    /(?<![@\w])(sm|md|lg|xl|2xl):grid-cols-/,
    "card grids beside a sidebar size columns by @container (@xl:grid-cols-…), not viewport breakpoints",
  ],
];
/** Rules that are opt-in: they only run on the path prefixes listed in config "only". */
const OPT_IN = new Set(["viewport-grid-cols"]);

/** [id, regex | null, message]. null = class-token analysis (lint/classes.mjs), counted per hit. */
export const RATCHET = [
  [
    "no-literal-palette",
    null,
    "No physical neutral / white / black colour classes (bg-white, text-slate-900, border-gray-200, divide-zinc-100, from-white, ring-slate-300, dark:bg-slate-800 …). Use semantic tokens: bg-canvas/app/panel/field/raised, text-contrast/body/muted, border-line/line-hover/divider. white/black with an alpha (bg-white/10) stays allowed.",
  ],
  [
    "no-solid-pastel-surfaces",
    null,
    "No solid pastel surfaces (bg-*-50…200, border-*-200, ring-*-100, divide-*-100): they glare in dark mode. Use bg-<hue>-500/10 border-<hue>-500/20 (TONAL_CONTAINER, <Badge tone>) or bg-danger-bg / bg-success-bg …",
  ],
  [
    "no-fixed-tone-text",
    null,
    "No fixed chromatic text shades (text-emerald-400, text-rose-700, dark:text-sky-300, fill-amber-500 …): one shade cannot pass contrast in both themes. Use text-accent-fg, text-danger-fg / success-fg / warning-fg / info-fg or text-tone-<hue>.",
  ],
  ["hex-colour-class", null, "No arbitrary colour values (bg-[#fff], text-[rgb(…)], border-[hsl(…)]): use colour tokens."],
  ["literal-colour-value", null, "No literal CSS colours in code (\"#fff\", \"rgb(…)\" in style props or configs): use var(--color-…) tokens."],
  ["arbitrary-text-size", null, "Use the type scale instead of text-[Npx]: text-caption 11 · label 12 · ui 13 · ui-lg 14 · title 15 · title-lg 16 · kpi 18 · heading-sm 20 · heading 22 · heading-lg 24 · display 26."],
  ["all-caps-label", /\>\s*[A-ZĐẮẰẲẴẶÂẤẦẨẪẬÊẾỀỂỄỆÔỐỒỔỖỘƠỚỜỞỠỢƯỨỪỬỮỰ]{4,}(?:[ .·…]+[A-ZĐ0-9…]+)*\s*</g, "button / label text is sentence case"],
  ["inline-svg-path", /<path\b/g, "add the icon to ICONS in @semi/ui (Icon.tsx) instead of inline <path>"],
  ["thick-stroke", /strokeWidth[=:]\s*\{?"?(2|2\.\d+|3)\b/g, "icon stroke is 1.75"],
  ["font-mono", /\bfont-mono\b/g, "numbers use tabular-nums; mono only for code"],
  ["narrow-container", /max-w-(4xl|5xl|6xl)\b/g, "content uses the full width"],
  ["loading-text", /^(?!.*(label|role="status")).*(Đang tải|Loading\.\.\.)/g, "show a skeleton or a progress bar, not loading text (§13b)"],
];

const DEFAULT_CONFIG = { scan: ["app", "components"], baseline: "semi-lint-baseline.json", skip: {}, only: {}, disable: [] };

export function loadConfig(cwd = process.cwd()) {
  const p = join(cwd, "semi-lint.json");
  const user = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
  return { ...DEFAULT_CONFIG, ...user, _found: existsSync(p) };
}

const toPosix = (p) => p.split(sep).join("/");
const SOURCE_RX = /\.(?:tsx?|jsx?|mjs|css)$/;

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (SOURCE_RX.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

export function filesToScan(cfg, cwd, only) {
  const roots = cfg.scan.map((d) => resolve(cwd, d));
  if (only) {
    return only
      .map((f) => resolve(cwd, f))
      .filter((p) => SOURCE_RX.test(p) && !p.endsWith(".d.ts") && existsSync(p) && roots.some((r) => p === r || p.startsWith(r + sep)));
  }
  return roots.flatMap((r) => walk(r, [])).sort();
}

const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

export function scan(paths, cfg, cwd) {
  const disabled = new Set(cfg.disable || []);
  const skip = cfg.skip || {};
  const onlyMap = cfg.only || {};
  const hard = [];
  const counts = Object.fromEntries(RATCHET.map(([id]) => [id, {}]));
  const lines = Object.fromEntries(RATCHET.map(([id]) => [id, {}])); // rule → file → first hit lines (for messages)
  const skipped = (id, name) => disabled.has(id) || (skip[id] || []).some((s) => name.startsWith(s));
  const add = (id, name, line) => {
    counts[id][name] = (counts[id][name] || 0) + 1;
    (lines[id][name] ||= []).length < 5 && lines[id][name].push(line);
  };
  for (const p of paths) {
    const name = toPosix(relative(cwd, p));
    const src = readFileSync(p, "utf8");
    const css = p.endsWith(".css");
    for (const f of analyse(src, { css })) if (!skipped(f.rule, name)) add(f.rule, name, f.line);
    if (css) continue;
    src.split(/\r?\n/).forEach((raw, i) => {
      if (!raw.trim() || isComment(raw)) return;
      for (const [id, rx, msg] of HARD) {
        if (skipped(id, name)) continue;
        if (OPT_IN.has(id) && !(onlyMap[id] || []).some((s) => name.startsWith(s))) continue;
        if (!OPT_IN.has(id) && onlyMap[id] && !onlyMap[id].some((s) => name.startsWith(s))) continue;
        if (rx.test(raw)) hard.push({ file: name, line: i + 1, rule: id, message: msg, text: raw.trim().slice(0, 140) });
      }
      for (const [id, rx] of RATCHET) {
        if (!rx || skipped(id, name)) continue;
        rx.lastIndex = 0;
        const c = (raw.match(rx) || []).length;
        for (let k = 0; k < c; k++) add(id, name, i + 1);
      }
    });
  }
  return { hard, counts, lines };
}

function sortedCounts(counts) {
  const out = {};
  for (const id of Object.keys(counts).sort()) {
    out[id] = {};
    for (const f of Object.keys(counts[id]).sort()) out[id][f] = counts[id][f];
  }
  return out;
}

function main(argv) {
  const args = { files: null, update: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--files") {
      args.files = [];
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) args.files.push(argv[++i]);
    } else if (a === "--update-baseline") args.update = true;
    else if (a === "--json") args.json = true;
    else if (a === "-h" || a === "--help") {
      console.log("usage: semi-lint [--files f1 f2 …] [--update-baseline] [--json]");
      return 0;
    } else {
      console.error(`semi-lint: unknown argument ${a}`);
      return 2;
    }
  }
  const cwd = process.cwd();
  const cfg = loadConfig(cwd);
  const paths = filesToScan(cfg, cwd, args.files);
  const { hard, counts, lines } = scan(paths, cfg, cwd);
  const baselinePath = resolve(cwd, cfg.baseline);

  if (args.update) {
    if (args.files) {
      console.error("--update-baseline scans everything; drop --files");
      return 1;
    }
    writeFileSync(baselinePath, JSON.stringify(sortedCounts(counts), null, 1) + "\n");
    const n = Object.values(counts).reduce((s, v) => s + Object.values(v).reduce((a, b) => a + b, 0), 0);
    if (!args.json) console.log(`baseline written: ${n} ratchet hits`);
  }

  const base = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
  const msgs = Object.fromEntries(RATCHET.map(([id, , m]) => [id, m]));
  const grown = [];
  for (const [id, perFile] of Object.entries(counts)) {
    for (const [file, c] of Object.entries(perFile).sort()) {
      const allowed = base[id]?.[file] ?? 0;
      if (c > allowed) grown.push({ file, rule: id, hits: c, baseline: allowed, lines: lines[id][file], message: msgs[id] });
    }
  }
  const total = Object.values(counts).reduce((s, v) => s + Object.values(v).reduce((a, b) => a + b, 0), 0);
  const known = Object.values(base).reduce((s, v) => s + Object.values(v).reduce((a, b) => a + b, 0), 0);

  if (args.json) {
    console.log(JSON.stringify({ files: paths.length, hard, grown, ratchet: sortedCounts(counts), ratchetTotal: total, baselineTotal: known }, null, 1));
    return hard.length || grown.length ? 1 : 0;
  }
  for (const h of hard) console.log(`${h.file}:${h.line}: [${h.rule}] ${h.message}\n    ${h.text}`);
  for (const g of grown) console.log(`${g.file}: [${g.rule}] ${g.hits} hits (lines ${g.lines.join(", ")}${g.hits > g.lines.length ? ", …" : ""}), baseline ${g.baseline}: ${g.message}`);
  if (hard.length || grown.length) {
    console.log(
      `\nsemi-lint: ${hard.length} hard violation(s), ${grown.length} file(s) over the ratchet baseline ` +
        "(rules: node_modules/@semi/ui/docs/DESIGN_SYSTEM.md, Anti-patterns)",
    );
    return 1;
  }
  if (!args.files) {
    const hint = total < known ? " (run --update-baseline to lock in the fixes)" : "";
    const where = cfg._found ? "" : " [no semi-lint.json: default scan app/ components/]";
    console.log(`semi-lint: clean, ${paths.length} files (${total} known ratchet hits left${hint})${where}`);
  }
  return 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]).replace(/\\/g, "/").match(/semi-lint(\.mjs)?$/);
if (isMain) process.exit(main(process.argv.slice(2)));
