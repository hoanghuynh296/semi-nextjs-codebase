#!/usr/bin/env node
// semi-lint: design-system lint for Semi apps (rules: docs/DESIGN_SYSTEM.md, "Anti-patterns"). No dependencies.
//
//   npx semi-lint                     # scan the dirs in semi-lint.json
//   npx semi-lint --files a.tsx b.ts  # only these files (agent edit hook); files outside "scan" are ignored
//   npx semi-lint --update-baseline   # after fixing ratchet hits (or when adopting Semi): rewrite the baseline
//   npx semi-lint --json              # machine-readable result (used by the semi-check skill)
//
// Scans .ts/.tsx/.js/.jsx/.mjs (and @apply in .css). Colour and size rules read class tokens out of every string
// literal (lint/classes.mjs), so className strings, cn() args, constants and template parts are all covered.
//
// HARD rules fail on any hit. RATCHET rules are old debt: each file may not get more hits than recorded in the
// baseline (new files start at 0), so the debt only shrinks. WARN rules (the form kit) only print a warning: they never
// fail the run and are not in the baseline, until a major release makes them rules (`disable` / `skip` work as for the others).
//
// Config: semi-lint.json in the current directory (all keys optional):
//   {
//     "scan": ["app", "components"],                // dirs (relative to cwd) scanned for .ts/.tsx
//     "baseline": "semi-lint-baseline.json",
//     "skip": { "inline-svg-path": ["components/brand/Logo.tsx"] },   // rule id → path prefixes it ignores
//     "skip": { "literal-colour-value": { "lib/scenePalette.ts": "data colours: 3D scene" } },
//                                                     // illustration / data colours: path → reason (CONTENT_RULES only;
//                                                     // the /semi-check audit lists each file with its reason)
//     "ignore": ["src/generated"],                  // path prefixes not scanned at all (generated files)
//     "only": { "viewport-grid-cols": ["components/catalog/"] },      // rule id → only these path prefixes
//     "disable": ["loading-text"],                  // rule ids turned off (record why in your app's doc)
//     "keep": { "tables": "reports need dense tables" }, // /semi-check structural checks the team chose to keep
//                                                     // (reason string = whole app, array = path prefixes)
//     "brand": "@3dnoobs/brand",                   // the app's brand kit (docs/BRANDS.md): turns on brand-override
//     "style": "soft",                             // the app's style (docs/STYLES.md), = <html data-style> in the layout
//     "density": "compact", "typeScale": "contrast" // the product's look (DESIGN_SYSTEM.md §19), = <html data-density / data-type-scale>
//   }
// A rule that the Semi docs add and that can be grepped belongs here too (change it in the semi repo, not per app).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { analyse } from "./classes.mjs";

/** [id, regex, message] */
export const HARD = [
  ["font-weight", /font-(bold|extrabold|black)\b/, "weights are font-medium / font-semibold only"],
  ["tiny-text", /text-\[(8|9|10)px\]/, "minimum text size is text-caption (11px)"],
  ["uppercase-label", /uppercase tracking-(wide|wider|widest)|tracking-(wide|wider|widest) uppercase/, "labels are sentence case"],
  ["native-select", /<select\b/, "use CustomSelect from @semi/ui"],
  [
    "tw-text-size",
    /\btext-(xs|sm|base|lg|xl)\b/,
    "use the type scale: text-caption 11 · text-label 12 · text-ui 14 · text-ui-lg 15 (compact 13 · 14) · text-title 15 · text-title-lg 16, KPI figures text-figure sm:text-heading (KpiCard), titles text-heading sm:text-display (PageTitle)",
  ],
  ["grey-surface", /bg-gray-(800|900)|border-gray-700/, "use the surface tokens (bg-panel, border-line…)"],
  [
    "legacy-shell-aside",
    /\bw-(56|60|64)\b[^"'\n]*\bborder-r\b|\b-translate-x-full\b/,
    "use AppShell from @semi/ui (floating rounded-panel bento sidebar, icon rail, phone drawer), not a fixed border-r or hand-made drawer <aside>",
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
    /<(?:Icon|IconTile)\b[^>]*\bname=["'](delete|remove|bin|destroy|cancel|x|cross|dismiss|reload|sync|fetch|add|new|create|pencil|modify|rename|duplicate|clone|warning|danger|error|tick|done|success|gear|config|cog|preferences|parameters|adjust|tune|funnel|profile|account|customer|team|members|group|notification|notifications|category|label|badge|cart_item|shop|shopping|price|money|cost|parcel|inventory|fullscreen|maximize|minimize|exit_fullscreen|return|previous|next|forward|signout|sign_out|ai|magic|help|tooltip|confirm|accept|ok|email|envelope|incoming|message|link|open_link|shutdown|turn_off|turn_on|power_off|scale|decrease|increase|shopping_bag|shopping-bag|shop_bag|credit_card|credit-card|payment|card|invoice|bill|shipping|delivery|delivered|package_check|package-check|discount|voucher|coupon|percentage|storefront|marketplace|balance|verified|official|mall|present|bonus|reward|wishlist|like|favorite|rating|review|rate|sku|scan|barcode_scan|qr|qr_code|qr-code|qrcode|vietqr|cash|money_bill|cod|bank|bank_transfer|bank-transfer|unboxing|package_open|package-open|cancel_order|cancelled_order|package_x|package-x|add_stock|new_order|package_plus|package-plus|order_list|invoice_list|orders|clipboard_list|clipboard-list|address|location|shipping_address|map_pin|map-pin|deal|hot_deal|flash_sale|badge_percent|badge-percent|hot|trending|best_seller|fire|marketing|promotion|campaign|broadcast|loyalty|membership|vip|trophy|calc|calculate|estimate|db|sql|storage|host|backend|mcu|processor|chip|mainboard|debug|issue|commit|git_commit|git-commit|pr|pull_request|pull-request|security|protect|ssl|firewall|token|api_key|secret|access_code|pulse|heartbeat|telemetry|growth|uptrend|trending_up|trending-up|downtrend|trending_down|trending-down|pie|pie_chart|pie-chart|chart_pie|speed|speedometer|temp|temperature|heat|nozzle_temp|bed_temp|spanner|tools|maintenance|repair|jog|jogging|translate|rotate|rotate_cw|rotate-cw|rotate_right|rotate_ccw|rotate-ccw|rotate_left|homing|origin|abl|auto_level|calibrate_bed|measure|measurement|dimension|distance|snap|lay_on_face|lay-on-face|magnetic_bed|eyedropper|color_picker|color-picker|pick_color|primitives|geometry|modifier|negative_volume|support_blocker|zoom_to_fit|center_view|center_model|view_orbit|orbit_camera|3d_orbit|usb_drive|flash_drive|ble|sd_card|sd-card|microsd|emmc|storage_card|hard-drive|motherboard|pcb|circuit-board|wire|wiring|power_backup|lidar|lidar_scan|scan-line|first_layer_scan|safety_alert|shield-alert|door_open|thermal_protection|document|doc|pdf|txt|readme|file_text|file-text|gcode|gcode_file|source_code|file_code|file-code|zip|archive|tar|file_zip|file_archive|file-archive|verified_file|file_check|file-check|new_file|add_file|file_plus|file-plus|excel|csv|spreadsheet|file_excel|file_spreadsheet|file-spreadsheet|new_folder|add_folder|folder_plus|folder-plus|open_folder|folder_open|folder-open|attach|attachment|clip|sound|speaker|volume|volume_2|volume-2|mute|silent|volume_x|volume-x|headset|earphones|microphone|voice|cam|webcam|timelapse|stream|cam_off|webcam_off|video_off|video-off|movie|reel|prev_track|prev_layer|skip_back|skip-back|next_track|next_layer|skip_forward|skip-forward|loop|fast_forward|fast-forward|speed_up|crop_image|repeat_action|erase|clear_paint|view_reset|iso|home_view|flip|mirror|swap_side|flip_side|flipSide|shopee_mall|shopee_vn|shopeepay|lazada_vn|lazmall|tikivn|tikinow|sendo_vn|senmall|tiktok_shop|douyin|cho_tot|chotot_vn|momo_pay|momo_wallet|vi_momo|zalo_pay|zalopay_wallet|vnpay_qr|vnpayqr|vn_pay|viettel_money|viettelpay|giao_hang_tiet_kiem|giaohangtietkiem|giao_hang_nhanh|giaohangnhanh|ghn_express|viettel_post|vtpost|vietnam_post|buudien|grab_food|grab_express|grab_mart|be_group|be_delivery|bedelivery|befood|zalo_app|zalo_chat|fpt_telecom|fpt_shop|thegioididong|dienmayxanh|bachhoaxanh|mwg)["']/,
    "use canonical IconName (e.g. trash for delete, close for cancel/x, refresh for reload, settings for gear, filter for funnel, user for profile, bell for notifications, tag for category/label). See docs/ICONS.md",
  ],
  ["home-button", /name="home"/, "app headers have no Home button: logo + title go home (AppHeader)"],
  // An external href on anything but <ExternalLink> (which is the fix, so it must not be flagged).
  ["external-link", /window\.open\(|<(?!ExternalLink\b)[A-Za-z][\w.]*\b[^>]*\bhref=\{?["'`]https?:\/\//, "links to other sites use ExternalLink from @semi/ui"],
  [
    "app-chrome-copy",
    /h-(?:\[34px\]|control) px-4 rounded-(?:lg|control) text-(?:\[12px\]|label) font-semibold|p-1 sm:p-1\.5 rounded-(?:2xl|panel) z-20|rounded-(?:2xl|panel) p-1 gap-1 select-none shadow-(?:xl|float)/,
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
/** CSS rule of apps that use a brand kit ("brand" in semi-lint.json): the brand alone sets these variables. */
export const BRAND_OVERRIDE = [
  "brand-override",
  /(?:^|[\s;{])--(?:color-(?:primary|secondary|accent|on-accent)[\w-]*|semi-[\w-]+|brand-[\w-]+|density-spacing|spacing|font-(?:sans|display|figure|weight-title)(?:-family)?)\s*:/,
  "this app uses a brand kit: its colours, fonts and Semi tokens come only from the brand, density and type scale from semi-lint.json (change them in the brand repo with /semi-brand)",
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
    "No solid pastel surfaces (bg-*-50…200, border-*-200, ring-*-100, divide-*-100): they glare in dark mode. A status (error, success, warning, info) is bg-danger-bg border-danger-border text-danger-fg (and success / warning / info), never a hue tint; a category tint is <Badge tone> or TONAL_CONTAINER. / bg-success-bg …",
  ],
  [
    "no-fixed-tone-text",
    null,
    "No fixed chromatic text shades (text-emerald-400, text-rose-700, dark:text-sky-300, fill-amber-500 …): one shade cannot pass contrast in both themes. Use text-accent-fg, text-danger-fg / success-fg / warning-fg / info-fg or text-tone-<hue>.",
  ],
  [
    "accent-state-token",
    null,
    "Accent states use themed tokens, not the brand scale: ring-focus (focus ring), border-focus (focused field), bg-accent-subtle / bg-accent-subtle-hover (selected or hover tint), border-accent-line (selected border), bg-accent (fill). primary-N/alpha is not checked in either theme and disappears for light brands.",
  ],
  [
    "primary-fill",
    null,
    "Fills and borders use the themed accent tokens, not the brand scale: bg-accent hover:bg-accent-hover text-on-accent (main action, \"on\" mark), border-accent-line (selected) / border-focus (focused). The brand colour is one step of primary-*, so bg-primary-500 turns pale or wrong with a brand kit; primary-* is for charts and illustrations (\"skip\" those files).",
  ],
  ["hex-colour-class", null, "No arbitrary colour values (bg-[#fff], text-[rgb(…)], border-[hsl(…)]): use colour tokens."],
  ["literal-colour-value", null, "No literal CSS colours in code (\"#fff\", \"rgb(…)\" in style props or configs): use var(--color-…) tokens."],
  ["radius-token", null, "Radii are style tokens: rounded-chip (marks, checkboxes, inline code) · rounded-control (buttons, inputs, tiles, rows) · rounded-card · rounded-panel (hero, modal, drawer, sidebar), plus rounded-full / rounded-none. Not rounded / rounded-lg / rounded-xl / rounded-[Npx]: those do not follow the app's style."],
  ["arbitrary-text-size", null, "Use the type scale instead of text-[Npx]: text-caption 11 · label 12 · ui 14 · ui-lg 15 · title 15 · title-lg 16 · figure 18 · heading-sm 20 · heading 22 · heading-lg 24 · display 26."],
  [
    "card-padding",
    /(?:<Card\b[^>]*?\bclassName=[^>]*?|\$\{CARD(?:_HOVER)?\}[^`]*?|\bcn\(\s*CARD(?:_HOVER)?\b[^)]*?|\brounded-card\b[^"'`\n]*?)(?<![\w-])p-(?:0\.5|1|1\.5|2|2\.5)(?![\w.])|(?<![\w-])p-(?:0\.5|1|1\.5|2|2\.5)(?![\w.])(?=[^"'`\n]*\brounded-card\b)/g,
    "A card is never tighter than p-card (16px at regular density): text against the edge of a box reads as a bug. <Card> pads itself; on CARD / CARD_HOVER or any rounded-card box use p-card (sm:p-panel for a roomy one), or padding=\"none\" / p-0 for media that runs to the edge.",
  ],
  ["all-caps-label", /\>\s*[A-ZĐẮẰẲẴẶÂẤẦẨẪẬÊẾỀỂỄỆÔỐỒỔỖỘƠỚỜỞỠỢƯỨỪỬỮỰ]{4,}(?:[ .·…]+[A-ZĐ0-9…]+)*\s*</g, "button / label text is sentence case"],
  ["inline-svg-path", /<path\b/g, "add the icon to ICONS in @semi/ui (Icon.tsx) instead of inline <path>"],
  ["thick-stroke", /strokeWidth[=:]\s*\{?"?(2|2\.\d+|3)\b/g, "icon stroke is 1.75"],
  ["font-mono", /\bfont-mono\b/g, "numbers use tabular-nums; mono only for code"],
  ["narrow-container", /max-w-(4xl|5xl|6xl)\b/g, "page content uses the full width; only a paragraph keeps a reading measure (max-w-3xl) and dialogs / drawers keep their own max width"],
  ["loading-text", /(Đang tải|Loading\.\.\.)/g, "show a skeleton or a progress bar, not loading text (§13b); a step label of a progress bar or a role=\"status\" line is fine"],
  // Re-created components and escape hatches (0.30.0). Class-token rules (null) live in lint/classes.mjs tokenRule.
  [
    "raw-control",
    /<(?:button|input|textarea|table)\b/g,
    "Compose @semi/ui instead of re-creating a control: Button / IconButton (BTN_* only on a Link), Input / Textarea / NumberInput / SearchInput in a Field, Checkbox / Switch / RadioGroup, DataTable. A hidden <input type=\"file\"> (FileDrop) is fine.",
  ],
  [
    "foreign-ui",
    /\bfrom\s+["'](?:lucide-react|react-icons(?:\/[\w-]+)?|@radix-ui\/[\w/-]+|@mui\/[\w/-]+|@headlessui\/react|@heroicons\/[\w/-]+|@chakra-ui\/[\w/-]+|antd(?:\/[\w/-]+)?|@mantine\/[\w/-]+|@tabler\/icons-react|react-bootstrap|@nextui-org\/[\w/-]+|@heroui\/[\w/-]+|@\/components\/ui\/[\w-]+)["']/g,
    "One UI kit: components from @semi/ui, icons from <Icon name> (docs/ICONS.md). A missing component or icon goes upstream with /semi-propose, not another library or a shadcn components/ui copy.",
  ],
  [
    "local-primitive",
    /\bexport\s+(?:default\s+)?(?:function|const)\s+(?:Card|Badge|Chip|Tabs|Table|Tooltip|Dialog|Drawer|Spinner|Avatar|Switch|Checkbox|Toggle|Alert|Toast|Dropdown|Popover|Pagination|Breadcrumb|Progress|Skeleton|SearchInput|DatePicker|Combobox|IconButton)\b/g,
    "Do not define your own copy of a Semi primitive: import it from @semi/ui (a product component with its own name, e.g. OrderCard, composes them).",
  ],
  [
    "inline-style-value",
    /\bstyle=\{\{[^}]*\b(?:color|background(?:Color)?|border(?:Top|Right|Bottom|Left)?Color|fontSize|fontWeight|lineHeight|boxShadow|borderRadius)\s*:/g,
    "No colours, type or radii in style={{}}: use token classes (text-*, bg-*, rounded-*). Sizes from data (width: `${p}%`) are fine; data colours (charts) are a per-file skip with a reason.",
  ],
  [
    "click-target",
    /\bonClick=/g,
    "Something clickable is a <button> (Button / IconButton) or a link: a <div onClick> cannot be reached or used from a keyboard. A backdrop that only closes is role=\"presentation\".",
  ],
  [
    "focus-hidden",
    /(?<![\w:-])outline-none\b/g,
    "outline-none hides the focus indicator: keep FOCUS_RING (or focus-visible:ring-2 focus-visible:ring-focus; a field: focus:border-focus focus:ring-1 focus:ring-focus) on the same element.",
  ],
  ["emoji-icon", /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}]/gu, "Icons are <Icon name> (docs/ICONS.md), not emoji. A brand whose voice allows emoji in copy disables this rule in semi-lint.json."],
  [
    "custom-overlay",
    /\bfixed\s+inset-0\b(?=[^"'`\n]*\bbg-(?:black|overlay)\b)|\bbg-(?:black|overlay)\b(?=[^"'`\n]*\bfixed\s+inset-0\b)/g,
    "A full-screen layer with a backdrop is Modal, Drawer, confirmDialog or Sheet from @semi/ui: they trap focus, close on Escape and lock scroll.",
  ],
  ["custom-spinner", /\banimate-spin\b/g, "Work in progress is <Spinner> (or Button loading, Skeleton, Progress), not a hand-made spinning border."],
  ["arbitrary-value", null, "No arbitrary spacing, z-index, tracking or opacity (p-[13px], gap-[7px], z-[9999], bg-panel/[0.05], bg-[var(--semi-…)]): use the spacing roles (p-card, gap-stack…), the z-* layers, the token classes. Widths, heights and grid templates may be arbitrary."],
  ["tw-shadow", null, "Flat UI: no shadow-sm…2xl. Cards take shadow-card (the style sets it), popovers shadow-overlay, floating controls shadow-float."],
  ["text-case", null, "Labels and buttons are sentence case: no uppercase class."],
  ["leading-override", null, "Every text size carries its line height (1.5 body, 1.25 titles): no leading-* except leading-tight on a multi-line title or leading-none in a one-line control."],
  ["css-raw-value", null, "Stylesheets use tokens too: no colour literals (#fff, rgb(), hsl(), oklch()), border-radius or font-size values in CSS. Use var(--color-…), the radius and text tokens, or utility classes."],
  [
    "decorative-icon-tones",
    null,
    "One decorative colour per card (iconTone green, sky, violet… in one file) is the generic AI look (§19): keep KPI and card icons neutral and give a colour only when it means a status.",
  ],
  // Shell structure (issues #23, #24): file-level checks, see shellHits().
  [
    "app-shell-in-page",
    null,
    "AppShell renders once in a layout.tsx (root or route group), never from a page.tsx or a component a page imports: a per-page shell remounts the sidebar on every click (see examples/app-shell/layout.tsx).",
  ],
  [
    "shell-gate",
    null,
    "Do not gate AppShell behind a full-page skeleton: content loading belongs inside the shell (a route loading.tsx or Suspense), and the boot / session check before the layout is known uses BootLoader once in the layout (§13b).",
  ],
  [
    "shell-nav-href",
    null,
    "Sidebar items that route between pages use href (next/link), not onSelect + router.push / router.replace: links prefetch, open in a new tab and keep the shell mounted.",
  ],
  [
    "boot-loader-place",
    null,
    "BootLoader is only for the boot / session gate in a layout, before the shell exists. Inside the shell (a page, a loading.tsx, AppShell content) show the content's shape with skeletons (§13b).",
  ],
];
/** Rules whose `skip` may name files with a reason ({ path: reason }): illustration and data colours, not UI chrome. */
export const CONTENT_RULES = ["literal-colour-value", "inline-svg-path", "no-literal-palette", "inline-style-value"];

/** The opening tag a hit sits in (back to its `<`, at most 4 lines up), or the line itself when there is none. */
function tagAround(lines, i) {
  const text = lines.slice(Math.max(0, i - 4), i + 1).join("\n");
  const at = text.search(/<[A-Za-z][\w.]*[^<]*$/);
  return at < 0 ? lines[i] : text.slice(at);
}
/** The whole opening tag a hit sits in: from its `<` (up to 4 lines up) to its closing `>` (up to 8 lines down). */
function tagAt(lines, i) {
  const head = tagAround(lines, i);
  const rest = lines.slice(i + 1, i + 9).join("\n");
  if (/>/.test(head.slice(1))) return head;
  const end = rest.search(/\/?>/);
  return end < 0 ? head + "\n" + rest : head + "\n" + rest.slice(0, end + 2);
}
/** True when an element matching `open` (group 1 = its tag) opened in the 6 lines before the hit and is not closed yet. */
function insideElement(lines, i, open) {
  const text = lines.slice(Math.max(0, i - 6), i + 1).join("\n");
  const opens = [...text.matchAll(open)];
  if (!opens.length) return false;
  const last = opens[opens.length - 1];
  return !text.slice(last.index).includes(`</${last[1]}>`);
}
/**
 * Places where a ratchet regex hit follows the rule (issue #16): what a line-based check can see reliably.
 * (lines, i) → true when the hit on line i is allowed.
 */
const ALLOWED_IN = {
  // A step label of a progress API (Progress label, run.show("…", { fraction })) or a status line is not loading text.
  "loading-text": (lines, i) =>
    /label|\b(?:fraction|value)\b\s*[=:,}]|role=["'](?:status|progressbar)["']/.test(lines[i]) ||
    /role=["'](?:status|progressbar)["']|<Progress\b/.test(tagAround(lines, i)) ||
    insideElement(lines, i, /<([A-Za-z][\w.]*)\b[^>]*role=["'](?:status|progressbar)["']/g),
  // A dialog or drawer has a max width by design.
  "narrow-container": (lines, i) => /\b(?:MODAL_PANEL|MODAL_[A-Z_]*)\b|<(?:Modal|Drawer)\b|role=["'](?:dialog|alertdialog)["']/.test(lines[i] + "\n" + tagAround(lines, i)),
  // A hidden native input behind a Semi control (FileDrop's file picker, a form's hidden value).
  // A hidden or colour input Semi has no control for, or a raw element styled by a Semi class constant (HEADER_ICON_BTN,
  // headerPrimary(), BTN_* on a native button inside AppHeader): that is composing Semi, not re-creating it.
  "raw-control": (lines, i) => {
    const tag = lines[i] + " " + tagAt(lines, i);
    return /<input\b[^>]*\btype=["'](?:file|hidden|color)["']|<input\b[^>]*\bsr-only\b/.test(tag) || /className=\{[^}]*\b(?:[A-Z][A-Z0-9]*_[A-Z0-9_]+|headerPrimary\()/.test(tag);
  },
  // A component (capitalised) owns its semantics; a native element is fine with a role or tabIndex, or as a backdrop.
  "click-target": (lines, i) => {
    const NATIVE = /^<(?:div|span|li|td|tr|th|img|section|article|p|header|footer|main|ul|ol|label|svg|i|figure)\b/;
    const ok = (tag) => !NATIVE.test(tag) || /\brole=|\btabIndex=|\baria-hidden\b/.test(tag);
    // Each onClick on the line belongs to the tag opened last before it on that line; a line without one continues
    // a tag opened above.
    const line = lines[i];
    for (const m of line.matchAll(/\bonClick=/g)) {
      const open = line.slice(0, m.index).search(/<[A-Za-z][\w.]*[^<]*$/);
      const next = line.indexOf("<", m.index);
      const tag = open < 0 ? tagAt(lines, i) : line.slice(open, next < 0 ? undefined : next);
      if (!ok(tag)) return false;
    }
    return true;
  },
  // Focus shown another way on the same element, or not focusable from the keyboard at all (tabIndex -1).
  "focus-hidden": (lines, i) =>
    /focus(?:-visible|-within)?:(?!outline-none)|FOCUS_RING|tabIndex=\{?["']?-1|placeholder:|<(?:input|textarea)\b/.test(lines[i] + "\n" + tagAt(lines, i)),
  // Floating menus and lists (their rows carry the padding) and field frames (focus-within) are not cards.
  "card-padding": (lines, i) => /shadow-overlay|z-popover|role=["'](?:menu|listbox|tree)["']|focus-within:|<(?:FileTree|Menu|Command)\b/.test(lines[i] + "\n" + tagAround(lines, i)),
  // The spinning icon of RefreshButton / Spinner itself.
  "custom-spinner": (lines, i) => /<(?:Icon|Spinner)\b/.test(tagAround(lines, i)) || /\bname=["']?(?:refresh|loader)/.test(lines[i]),
  // Short acronyms and product codes in caps are not shouting (HTTP, JSON, HTML, HTTPS, VND).
  "all-caps-label": (lines, i) => {
    const words = lines[i].match(/[A-ZĐẮẰẲẴẶÂẤẦẨẪẬÊẾỀỂỄỆÔỐỒỔỖỘƠỚỜỞỠỢƯỨỪỬỮỰ]{4,}/g) || [];
    return words.length > 0 && words.every((w) => ACRONYMS.has(w));
  },
  // Mono is for code: <code>, <pre>, code editors (textarea, contentEditable), CodeBlock, Terminal.
  "font-mono": (lines, i) =>
    /<(?:code|pre|textarea|CodeBlock|Terminal)\b|contentEditable/.test(tagAround(lines, i)) ||
    insideElement(lines, i, /<(code|pre|CodeBlock|Terminal)\b/g),
};

const ACRONYMS = new Set(["HTTP", "HTTPS", "JSON", "HTML", "JPEG", "WEBP", "YAML", "TOML", "UUID", "OAUTH", "SAML", "GRPC", "WASM", "NFPA", "ISBN", "IBAN", "SWIFT", "GDPR", "VNPAY", "MOMO", "ZALO", "VIETQR", "NAPAS", "VND", "USDT", "NULL", "TODO"]);

/** Colour literals, radii and font sizes written straight into a stylesheet (css-raw-value). */
const CSS_RAW = /(?:#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\()|\b(?:border-radius|font-size)\s*:\s*\d/;

/** Distinct iconTone values in one file from which the colours read as decoration, not meaning. */
const DECORATIVE_TONES = 3;

/** Warnings of the form kit (§9b): [id, message]. They print, never fail, and stay out of the baseline until a major release. */
export const WARN = [
  ["form-no-guard", "A form on a page loses typed work when the page is left: call useUnsavedGuard(dirty) (@semi/ui) and keep <FormActions> at the end of the form. A form in a Modal or Drawer is exempt."],
  ["action-order", "Huỷ comes before Lưu / Tạo: right-aligned, ghost Huỷ then the primary, with a destructive action alone on the left. Use <FormActions>."],
  ["toast-for-validation", "A field problem is told under the field (<Field error>), with an Alert summary above FormActions for several, not in a toast that disappears. A toast is for the result of an action."],
  ["field-input-mode", "An email, phone, URL, password, search or money field sets its phone keyboard and autofill: <Field kind=\"email|tel|number|money|url|search|password\">."],
  ["local-toast", "One toast API (§14c): use toast / toast.success|error|warning|info|undo|promise from @semi/ui, not a toast library or an app-level wrapper. Its extras (action, duration, promise, undo) are already in Semi's toast."],
  // The patterns of the #94 study (C-031 / C-032, #107): warnings until 1.0 (C-021).
  [
    "no-spinner-in-list",
    "A list, grid or table that is loading shows its own shape (§13b, L16): DataTable / List `loading`, SkeletonRows, SkeletonGrid or the shaped skeletons (#106), not a Spinner or \"Đang tải\" text in place of the rows. A Spinner stays inside the button or field that runs its own action.",
  ],
  ["filter-chip-wrap", "Filter chips are one line (L4, C-026): FilterChipRow + useFilterParams from @semi/ui (it scrolls sideways and keeps the state in the URL), not hand-made chip buttons in a flex-wrap that grows to several rows."],
  ["raw-pill-button", "A round icon button is <Button iconOnly shape=\"round\" icon aria-label> from @semi/ui (it keeps the focus ring, the title and the hit area), not a hand-made rounded-full button with a tint / field fill."],
  ["detail-overlay-url", "A DetailOverlay is driven by the URL (L9): const { openId, open, close } = useDetailParam(); open={openId !== null} onClose={close}, so the record has a link, Back closes it and the list keeps its scroll."],
  ["overline-place", "text-overline (C-032) is for section labels only: a sidebar / drawer group, a palette group, a mega menu column, a workspace panel section. Never a button, link, field label, title, badge, table head or a sentence: those are sentence case in their own type style."],
];
/** Hard rules that read a whole JSX tag: [id, message]. */
export const TAG_HARD = [["card-hover-actions-touch", "<CardActions> needs a label (\"Thao tác với <tên>\"): on a touch screen the ⋯ is the only control, and the label is its name."]];
const TOAST_LIB = /\bfrom\s+["'](?:sonner|react-hot-toast|react-toastify|react-toast-notifications|notistack|@radix-ui\/react-toast)["']/g;
// an import clause has no quote or semicolon, so a match cannot run on into the next statement
const TOAST_LOCAL_IMPORT = /\bimport\s+[^;'"]*?\bfrom\s+["'](?!@semi\/ui["']|(?:\.\.\/)+src\/Toast["'])[^"']*[\/@.](?:use)?[Tt]oasts?(?:Store|Context|Provider|Helpers?|Utils?)?["']/g;
const TOAST_WRAPPER = /\bexport\s+(?:default\s+)?(?:async\s+)?(?:const|function|let)\s+(?:toast|notify|useToast|showToast|showNotification)\b/g;
const TOAST_REEXPORT = /\bexport\s*\{[^}'"]*\btoast\b[^}'"]*\}\s*from\s*["']/g;
const SAVE_WORDS = "Lưu|Tạo|Save|Create|Gửi|Thêm";
const CANCEL_WORDS = "Huỷ|Hủy|Cancel";
const ACTION_ORDER = new RegExp(`>\\s*(?:${SAVE_WORDS})[^<{]*</(?:Button|button)>\\s*<(?:Button|button)\\b[^>]*>\\s*(?:${CANCEL_WORDS})\\s*<`, "g");
const VALIDATION_TEXT = /(?<!\p{L})(?:bắt buộc|không hợp lệ|không được để trống|vui lòng nhập|nhập (?:đủ|đúng|lại)|invalid|is required|required field)(?!\p{L})/iu;
const KIND_LABEL = /(?<![\p{L}])(?:e-?mail|điện thoại|sđt|phone|website|url|đường dẫn|mật khẩu|password|tìm kiếm|số tiền|giá bán|giá|price|amount)(?![\p{L}])/iu;
const lineOf = (src, index) => src.slice(0, index).split("\n").length;

/** Warnings [rule, line] of the form kit for one source file. */
export function warnHits(src) {
  const out = [];
  const rows = src.split(/\r?\n/);
  const code = rows.map((r) => (isComment(r) ? "" : r)).join("\n"); // same line numbers, comments blank
  // form-no-guard: a page form (not a modal's or a popover's) without useUnsavedGuard
  const form = /<FormActions\b|<form\b/.exec(code);
  if (form && /<(?:Field|Input|Textarea)\b/.test(code) && !/\buseUnsavedGuard\b/.test(code) && !/<(?:Modal|Drawer|Popover)\b|placement=["']modal["']/.test(code)) out.push(["form-no-guard", lineOf(code, form.index)]);
  // action-order: the primary before Huỷ in one row
  for (const m of code.matchAll(ACTION_ORDER)) out.push(["action-order", lineOf(code, m.index)]);
  // local-toast: a toast library, an import of an app-level toast module, or an exported wrapper around Semi's toast
  const semiToast = /\bimport\s+[^;'"]*\btoast\b[^;'"]*\bfrom\s+["']@semi\/ui["']/.test(code);
  for (const re of semiToast ? [TOAST_LIB, TOAST_LOCAL_IMPORT, TOAST_REEXPORT, TOAST_WRAPPER] : [TOAST_LIB, TOAST_LOCAL_IMPORT, TOAST_REEXPORT]) for (const m of code.matchAll(re)) out.push(["local-toast", lineOf(code, m.index)]);
  rows.forEach((raw, i) => {
    if (!raw.trim() || isComment(raw)) return;
    // toast-for-validation: a toast whose text is about a missing / invalid field
    const call = /\btoast(?:\.\w+)?\(\s*\{([^}]*)\}/.exec(rows.slice(i, i + 4).join("\n"));
    if (/\btoast(?:\.\w+)?\(/.test(raw) && call && [...call[1].matchAll(/(["'`])((?:(?!\1).)*)\1/g)].some((m) => VALIDATION_TEXT.test(m[2]))) out.push(["toast-for-validation", i + 1]);
    // field-input-mode (a): a <Field> labelled like an email, phone, URL, password or money field without kind
    if (/<Field\b/.test(raw)) {
      const tag = tagAt(rows, i);
      const label = /\blabel=(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/.exec(tag);
      if (label && KIND_LABEL.test(label[1] ?? label[2] ?? label[3] ?? "") && !/\bkind=/.test(tag)) out.push(["field-input-mode", i + 1]);
    }
    // field-input-mode (b): <Input type="email|tel|url|search|password"> without inputMode, in a file that sets no kind
    if (/<Input\b/.test(raw) && !/\bkind=/.test(src)) {
      const tag = tagAt(rows, i);
      if (/\btype=["'](?:email|tel|url|search|password)["']/.test(tag) && !/\binputMode=/.test(tag)) out.push(["field-input-mode", i + 1]);
    }
  });
  return [...out, ...patternHits(code)];
}

// ---- The #94 patterns (#107): lists that load, filter chips, round icon buttons, DetailOverlay, text-overline ----

/** Elements still open at the end of `text` (innermost last): [{ name, attrs }]. A tag whose attributes hold `=>` is
 * read up to the arrow, which is enough to know its name and its className. */
function openStack(text) {
  const stack = [];
  for (const m of text.matchAll(/<(\/?)([A-Za-z][\w.]*)\b([^<>]*?)(\/?)>/g)) {
    const [, close, name, attrs, self] = m;
    if (close) {
      const at = stack.map((e) => e.name).lastIndexOf(name);
      if (at >= 0) stack.length = at;
    } else if (!self) stack.push({ name, attrs });
  }
  return stack;
}
const LIST_TAGS = new Set(["ul", "ol", "tbody", "TBody", "DataTable", "ItemGroup", "List"]);
const LIST_ATTRS = /\brole=["'](?:list|grid|rowgroup|listbox|feed)["']|(?<![\w-])(?:[\w@\[\]():-]*:)?grid-cols-|(?<![\w-])divide-y\b/;
const isList = (e) => LIST_TAGS.has(e.name) || LIST_ATTRS.test(e.attrs);
/** A control that runs its own action: a Spinner inside it is the allowed use (§13b). */
const OWN_ACTION = /^(?:button|Button|SplitButton|Input|SearchInput|SearchPill|Field|NumberInput|Textarea)$/;
const LOADING_MARK = /<Spinner\b|Đang tải|Loading\.\.\./g;
/** The text right after a loading mark renders a list: the other branch of a ternary (`? <Spinner/> : rows.map(…)`). */
const LIST_BRANCH = /^[^?;]*?:\s*\(?\s*(?:<(?:ul|ol|tbody|TBody|DataTable|ItemGroup|List|Table)\b|[\w.?!]+\.map\(|<[A-Za-z][\w.]*\b[^>]*?(?:grid-cols-|divide-y\b|role=["'](?:list|grid)["']))/;
/** A list rendered anywhere in the file (for an early `if (loading) return <Spinner />`). */
const RENDERS_LIST = /<(?:ul|ol|tbody|TBody|DataTable|ItemGroup|List)\b|\.map\(\s*\(?[\w{}, ]*\)?\s*=>\s*\(?\s*<|grid-cols-/;

/** The value of a JSX attribute in a tag text: the string, or the {expression} (balanced braces), or null. */
function attrValue(tag, name) {
  const m = new RegExp(`\\b${name}=`).exec(tag);
  if (!m) return null;
  const rest = tag.slice(m.index + m[0].length);
  if (/^["']/.test(rest)) return rest.slice(1, rest.indexOf(rest[0], 1));
  if (rest[0] !== "{") return null;
  let depth = 0;
  for (let k = 0; k < rest.length; k++) {
    if (rest[k] === "{") depth++;
    else if (rest[k] === "}" && --depth === 0) return rest.slice(1, k);
  }
  return rest.slice(1);
}

const ROUND_FILL = /(?<![\w-])(?:[\w-]+:)*bg-(?:tint|field|raised|card(?:-field)?|panel(?:-\d)?|app|canvas|(?:black|white)\/\d+)(?![\w-])/;
/** Square size of an icon button (28px and up; a radio dot or a slider thumb is smaller): size-N, w-N with h-N of
 * the same N, aspect-square with a width, or the control size. */
const isSquare = (cls) => {
  const big = (n) => n === "control" || Number(n) >= 7;
  for (const m of cls.matchAll(/(?<![\w:-])size-(\d+(?:\.\d+)?|control)(?![\w-])/g)) if (big(m[1])) return true;
  for (const m of cls.matchAll(/(?<![\w:-])w-(\d+(?:\.\d+)?|control)(?![\w-])/g)) {
    if (big(m[1]) && (/(?<![\w-])aspect-square(?![\w-])/.test(cls) || new RegExp(`(?<![\\w:-])h-${m[1].replace(".", "\\.")}(?![\\w-])`).test(cls))) return true;
  }
  return false;
};
const INTERACTIVE_CLS = /(?<![\w-])(?:hover:bg-|cursor-pointer|focus-visible:)/;
const CLICKABLE_TAG = /^<(?:button|Button|a|Link)\b|\bonClick=/;
/** Tags text-overline must never style (C-032): controls, links, field labels, titles, badges, table heads. */
const OVERLINE_DENY = /^(?:button|Button|a|Link|label|Label|Badge|Chip|h1|PageTitle|input|Input|Field|th|TH|Tab|Tabs|TextTabs|Pills|Toggle|summary|Kbd|legend)$/;

/** Warnings [rule, line] of the #94 patterns in one source file (comments already blanked). */
export function patternHits(code) {
  const out = [];
  const rows = code.split("\n");
  const offsets = [];
  rows.reduce((at, r, i) => ((offsets[i] = at), at + r.length + 1), 0);
  const seen = new Set();
  const push = (rule, line) => {
    if (seen.has(rule + ":" + line)) return;
    seen.add(rule + ":" + line);
    out.push([rule, line]);
  };

  // no-spinner-in-list: a Spinner / loading text inside a list, as the other branch of a list, or as an early return
  // of a component that renders a list.
  for (const m of code.matchAll(LOADING_MARK)) {
    const line = lineOf(code, m.index);
    if (/<(?:DataTable|List)\b(?:[^<>]|=>)*\b\w+=\{\s*\(?\s*$/.test(code.slice(Math.max(0, m.index - 600), m.index))) {
      push("no-spinner-in-list", line); // <DataTable empty={<Spinner />}>
      continue;
    }
    const stack = openStack(code.slice(Math.max(0, offsets[Math.max(0, line - 40)]), m.index));
    const own = stack.findLastIndex((e) => OWN_ACTION.test(e.name));
    const list = stack.findLastIndex(isList);
    if (own > list) continue; // the spinner of a button inside a row
    const before = code.slice(Math.max(0, m.index - 200), m.index);
    const inList = list >= 0;
    const branch = /\?\s*\(?\s*(?:<[A-Za-z][\w.]*\b[^<>]*>\s*)*$/.test(before) && LIST_BRANCH.test(code.slice(m.index, m.index + 600).replace(/^<Spinner\b[^>]*\/>|^[^<]*/, ""));
    const early = /\breturn\s*\(?\s*(?:<[A-Za-z][\w.]*\b[^<>]*>\s*)*$/.test(before) && /\bif\s*\([^)]*\b(?:loading|isLoading|pending|isPending|fetching)\b/i.test(before) && RENDERS_LIST.test(code.slice(m.index));
    if (inList || branch || early) push("no-spinner-in-list", line);
  }

  // filter-chip-wrap: an element with flex-wrap whose children are clickable chip-like buttons.
  for (const m of code.matchAll(/<([A-Za-z][\w.]*)\b[^<>]*?(?<![\w-])flex-wrap(?![\w-])/g)) {
    const name = m[1];
    if (name === "FilterChipRow") continue;
    const rest = code.slice(m.index, m.index + 3000);
    // cut at the element's own close (depth of the same tag name)
    let depth = 0;
    let end = rest.length;
    for (const t of rest.matchAll(new RegExp(`<(/?)${name.replace(".", "\\.")}\\b[^<>]*?(/?)>`, "g"))) {
      if (t[1]) depth--;
      else if (!t[2]) depth++;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    const body = rest.slice(0, end);
    const chips = [...body.matchAll(/<(button|Button|Chip)\b([^<>]*?(?:=>[^<>]*?)*)>/g)].filter(
      ([, tag, attrs]) => (tag === "Chip" || /rounded-full/.test(attrs)) && /\bonClick=|\baria-pressed=|\bselected=|\bactive=|\bonRemove=/.test(attrs),
    );
    // Semi's Chip also picks values in a form (materials, tags): it counts only where the code is about filtering.
    const filtering = /filter|lọc/i.test(body);
    const counted = chips.filter(([, tag]) => tag !== "Chip" || filtering);
    const looped = /\.map\(/.test(body);
    if (counted.length >= 2 || (counted.length === 1 && looped)) {
      if (filtering || /aria-pressed|selected|active|toggle/i.test(body)) push("filter-chip-wrap", lineOf(code, m.index));
    }
  }

  // raw-pill-button: a string of classes that draws a round, filled, square, clickable button.
  for (const m of code.matchAll(/(["'`])((?:(?!\1)[^\n\\]|\\.)*?(?<![\w-])rounded-full(?![\w-])(?:(?!\1)[^\n\\]|\\.)*)\1/g)) {
    const cls = m[2];
    if (!ROUND_FILL.test(cls) || !isSquare(cls)) continue;
    const line = lineOf(code, m.index);
    const tag = tagAround(rows, line - 1);
    if (/^<(?:Avatar|Button)\b/.test(tag)) continue; // Button: see below
    if (INTERACTIVE_CLS.test(cls) || CLICKABLE_TAG.test(tag)) push("raw-pill-button", line);
  }
  // …and a Button made round by className instead of shape="round".
  for (const m of code.matchAll(/<Button\b/g)) {
    const line = lineOf(code, m.index);
    const tag = tagAt(rows, line - 1);
    if (/\biconOnly\b/.test(tag) && /(?<![\w-])!?rounded-full(?![\w-])/.test(attrValue(tag, "className") ?? "")) push("raw-pill-button", line);
  }

  // detail-overlay-url: DetailOverlay whose open does not come from the URL.
  const urlDriven = /\buseDetailParam\s*\(|\buseSearchParams\s*\(|\bsearchParams\b|\buseFilterParams\s*\(|\bopenDetail\s*\(/.test(code);
  for (const m of code.matchAll(/<DetailOverlay\b/g)) {
    if (urlDriven) break;
    const line = lineOf(code, m.index);
    const tag = tagAt(rows, line - 1);
    if (/\{\s*\.\.\./.test(tag)) continue;
    const open = (attrValue(tag, "open") ?? "").trim();
    // a wrapper that passes its own `open` prop on: the page that renders the wrapper is checked instead
    const prop = /^[A-Za-z_$][\w$]*$/.test(open) && new RegExp(`(?:function\\s*\\w*\\s*\\(|=\\s*\\()\\s*\\{[^}]*\\b${open}\\b[^}]*\\}`).test(code);
    const fromProps = /^props\./.test(open);
    if (!prop && !fromProps) push("detail-overlay-url", line);
  }

  // overline-place: text-overline on a control, link, field label, title, badge, table head or a long text.
  for (const m of code.matchAll(/(?<![\w-])text-overline(?![\w-])/g)) {
    const line = lineOf(code, m.index);
    const tag = tagAround(rows, line - 1);
    const name = /^<([A-Za-z][\w.]*)/.exec(tag)?.[1];
    if (!name) continue; // a class constant: where it lands is not visible here
    const text = /^[^>]*>([^<{]*)/.exec(rows.slice(line - 1, line + 2).join(" ").slice(rows[line - 1].indexOf("<" + name)))?.[1]?.trim() ?? "";
    if (OVERLINE_DENY.test(name) || text.length > 40) push("overline-place", line);
  }
  return out;
}

/** Hard hits [rule, line, text] that read a whole JSX tag (TAG_HARD). */
export function tagHardHits(src) {
  const rows = src.split(/\r?\n/).map((r) => (isComment(r) ? "" : r));
  const code = rows.join("\n");
  const out = [];
  for (const m of code.matchAll(/<CardActions\b/g)) {
    const line = lineOf(code, m.index);
    const tag = tagAt(rows, line - 1);
    if (!/\blabel=/.test(tag) && !/\{\s*\.\.\./.test(tag)) out.push(["card-hover-actions-touch", line, rows[line - 1].trim().slice(0, 140)]);
  }
  return out;
}

const DEFAULT_CONFIG = { scan: ["app", "components"], baseline: "semi-lint-baseline.json", skip: {}, only: {}, disable: [] };

export function loadConfig(cwd = process.cwd()) {
  const p = join(cwd, "semi-lint.json");
  const user = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
  return { ...DEFAULT_CONFIG, ...user, _found: existsSync(p) };
}

/** Mistakes in semi-lint.json that would silently skip a rule: a reason object on another rule, an empty reason. */
export function configErrors(cfg) {
  const errors = [];
  for (const [id, v] of Object.entries(cfg.skip || {})) {
    if (Array.isArray(v)) continue;
    if (!v || typeof v !== "object") errors.push(`skip.${id}: an array of path prefixes, or { "path": "reason" }`);
    else if (!CONTENT_RULES.includes(id)) errors.push(`skip.${id}: a reason per path is only for ${CONTENT_RULES.join(", ")}; use an array`);
    else for (const [path, reason] of Object.entries(v)) if (typeof reason !== "string" || !reason.trim()) errors.push(`skip.${id}."${path}": give the reason (illustration: …, data colours: …)`);
  }
  return errors;
}

/** Files skipped with a reason (illustration / data colours): [{ rule, path, reason }], for the audit. */
export function skipReasons(cfg) {
  return Object.entries(cfg.skip || {}).flatMap(([rule, v]) =>
    v && !Array.isArray(v) && typeof v === "object" ? Object.entries(v).map(([path, reason]) => ({ rule, path, reason: String(reason) })) : [],
  );
}

/** Path prefixes a rule skips, from either form of `skip`. */
const skipPaths = (v) => (!v ? [] : Array.isArray(v) ? v : Object.keys(v));
/** Whether semi-lint.json skips `rule` for the file `name` (relative to the app, posix). */
export const isSkipped = (cfg, rule, name) => skipPaths(cfg.skip?.[rule]).some((s) => name.startsWith(s));

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
  const ignored = (cfg.ignore || []).map((d) => resolve(cwd, d));
  const kept = (p) => !ignored.some((i) => p === i || p.startsWith(i + sep));
  if (only) {
    return only
      .map((f) => resolve(cwd, f))
      .filter((p) => SOURCE_RX.test(p) && !p.endsWith(".d.ts") && existsSync(p) && roots.some((r) => p === r || p.startsWith(r + sep)) && kept(p));
  }
  return roots.flatMap((r) => walk(r, [])).filter(kept).sort();
}

const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

// ---- Shell structure (issues #23, #24) ----
const RENDERS_SHELL = /<AppShell\b/;
const routeFile = (p, kind) => new RegExp(`(?:^|[\\\\/])${kind}\\.(?:tsx|jsx|ts|js)$`).test(p);
const lineAt = (src, index) => src.slice(0, index).split("\n").length;
const IMPORT_RX = /^\s*import\s[^;]*?\bfrom\s*["']([^"']+)["']/gm;
const EXTS = [".tsx", ".ts", ".jsx", ".js"];

/** The local file an import specifier points at (relative or the "@/" alias at the app root or src/), or null. */
function resolveImport(spec, from, cwd) {
  const bases = spec.startsWith(".") ? [resolve(dirname(from), spec)] : spec.startsWith("@/") ? [resolve(cwd, spec.slice(2)), resolve(cwd, "src", spec.slice(2))] : [];
  for (const b of bases) {
    for (const c of [b, ...EXTS.map((e) => b + e), ...EXTS.map((e) => join(b, "index" + e))]) {
      if (existsSync(c) && statSync(c).isFile()) return c;
    }
  }
  return null;
}

/** Ratchet hits [rule, line] of the shell-structure rules for one source file. */
export function shellHits(p, src, cwd) {
  const out = [];
  const shell = RENDERS_SHELL.test(src);
  // app-shell-in-page: a page renders AppShell itself, or imports a (non-layout) module that does.
  if (routeFile(p, "page")) {
    if (shell) out.push(["app-shell-in-page", lineAt(src, src.search(RENDERS_SHELL))]);
    else {
      for (const m of src.matchAll(IMPORT_RX)) {
        const target = resolveImport(m[1], p, cwd);
        if (target && !routeFile(target, "layout") && RENDERS_SHELL.test(readFileSync(target, "utf8"))) out.push(["app-shell-in-page", lineAt(src, m.index + m[0].search(/\S/))]);
      }
    }
  }
  if (shell) {
    // shell-gate: an early return of a page-sized placeholder in the file that renders AppShell.
    for (const m of src.matchAll(/\breturn\s*\(?\s*<(PageSkeleton|Skeleton\w*|Loading)\b/g)) out.push(["shell-gate", lineAt(src, m.index)]);
    // shell-nav-href: AppShell onSelect that routes (inline arrow, or a named handler in the same file).
    for (const m of src.matchAll(/<AppShell\b[^>]*?\bonSelect=\{/g)) {
      const at = m.index + m[0].length;
      const body = src.slice(at, at + 400);
      const named = /^\s*(\w+)\s*\}/.exec(body);
      const routes = named
        ? new RegExp(`(?:function\\s+${named[1]}\\b|\\b${named[1]}\\s*=)[\\s\\S]{0,400}?\\brouter\\.(?:push|replace)\\(`).test(src)
        : /^[^}]*\brouter\.(?:push|replace)\(/.test(body);
      if (routes) out.push(["shell-nav-href", lineAt(src, src.indexOf("onSelect=", m.index))]);
    }
  }
  // boot-loader-place: BootLoader in a page / loading file, or inside <AppShell>…</AppShell>.
  const inRoute = routeFile(p, "page") || routeFile(p, "loading");
  for (const m of src.matchAll(/<BootLoader\b/g)) {
    const before = src.slice(0, m.index);
    const open = before.lastIndexOf("<AppShell");
    const insideShell = open >= 0 && !before.slice(open).includes("</AppShell>") && src.indexOf("</AppShell>", m.index) >= 0;
    if (inRoute || insideShell) out.push(["boot-loader-place", lineAt(src, m.index)]);
  }
  return out;
}

export function scan(paths, cfg, cwd) {
  const disabled = new Set(cfg.disable || []);
  const skip = cfg.skip || {};
  const onlyMap = cfg.only || {};
  const hard = [];
  const counts = Object.fromEntries(RATCHET.map(([id]) => [id, {}]));
  const lines = Object.fromEntries(RATCHET.map(([id]) => [id, {}])); // rule → file → first hit lines (for messages)
  const warnings = []; // form-kit warnings { file, line, rule, message }: print only
  const hits = []; // every ratchet hit { file, line, rule, token? } (the audit lists them all)
  const skipped = (id, name) => disabled.has(id) || skipPaths(skip[id]).some((s) => name.startsWith(s));
  const add = (id, name, line, token) => {
    hits.push({ file: name, line, rule: id, ...(token ? { token } : {}) });
    counts[id][name] = (counts[id][name] || 0) + 1;
    (lines[id][name] ||= []).length < 5 && lines[id][name].push(line);
  };
  for (const p of paths) {
    const name = toPosix(relative(cwd, p));
    const src = readFileSync(p, "utf8");
    const css = p.endsWith(".css");
    for (const f of analyse(src, { css })) if (!skipped(f.rule, name)) add(f.rule, name, f.line, f.token);
    if (css && cfg.brand && !skipped(BRAND_OVERRIDE[0], name)) {
      src.split(/\r?\n/).forEach((raw, i) => {
        if (BRAND_OVERRIDE[1].test(raw)) hard.push({ file: name, line: i + 1, rule: BRAND_OVERRIDE[0], message: BRAND_OVERRIDE[2], text: raw.trim().slice(0, 140) });
      });
    }
    if (css && !skipped("css-raw-value", name)) {
      src.split(/\r?\n/).forEach((raw, i) => {
        if (!raw.trim() || isComment(raw) || /^\s*@import\b/.test(raw)) return;
        if (CSS_RAW.test(raw.replace(/\/\*.*?\*\//g, ""))) add("css-raw-value", name, i + 1);
      });
    }
    if (css) continue;
    if (!skipped("decorative-icon-tones", name)) {
      const tones = [...src.matchAll(/\biconTone=["'{]+(\w+)/g)];
      if (new Set(tones.map((m) => m[1])).size >= DECORATIVE_TONES) add("decorative-icon-tones", name, src.slice(0, tones[0].index).split("\n").length);
    }
    for (const [id, line] of shellHits(p, src, cwd)) if (!skipped(id, name)) add(id, name, line);
    for (const [id, line] of warnHits(src)) if (!skipped(id, name)) warnings.push({ file: name, line, rule: id, message: WARN.find(([w]) => w === id)[1] });
    for (const [id, line, text] of tagHardHits(src)) if (!skipped(id, name)) hard.push({ file: name, line, rule: id, message: TAG_HARD.find(([h]) => h === id)[1], text });
    const rows = src.split(/\r?\n/);
    rows.forEach((raw, i) => {
      if (!raw.trim() || isComment(raw)) return;
      for (const [id, rx, msg] of HARD) {
        if (skipped(id, name)) continue;
        if (OPT_IN.has(id) && !(onlyMap[id] || []).some((s) => name.startsWith(s))) continue;
        if (!OPT_IN.has(id) && onlyMap[id] && !onlyMap[id].some((s) => name.startsWith(s))) continue;
        if (rx.test(raw)) hard.push({ file: name, line: i + 1, rule: id, message: msg, text: raw.trim().slice(0, 140) });
      }
      for (const [id, rx] of RATCHET) {
        if (!rx || skipped(id, name)) continue;
        if (ALLOWED_IN[id]?.(rows, i)) continue;
        rx.lastIndex = 0;
        const c = (raw.match(rx) || []).length;
        for (let k = 0; k < c; k++) add(id, name, i + 1);
      }
    });
  }
  return { hard, counts, lines, hits, warnings };
}

function sortedCounts(counts) {
  const out = {};
  for (const id of Object.keys(counts).sort()) {
    out[id] = {};
    for (const f of Object.keys(counts[id]).sort()) out[id][f] = counts[id][f];
  }
  return out;
}

/**
 * --ci: what the baseline and the skips added against the base branch (SEMI_LINT_BASE, default origin/main). Both may
 * only shrink, except in a change that upgrades @semi/ui (new rules land as debt with /semi-sync). [] when git or the
 * base is not there (a first commit, a shallow clone without the base).
 */
export function configGrowth(cwd, cfg, baseline) {
  const git = (args) => spawnSync("git", args, { cwd, encoding: "utf8" });
  const ref = process.env.SEMI_LINT_BASE || "origin/main";
  if (git(["rev-parse", "--verify", "--quiet", ref]).status !== 0) return [];
  const prefix = git(["rev-parse", "--show-prefix"]).stdout.trim();
  const atBase = (file) => {
    const r = git(["show", `${ref}:${prefix}${file}`]);
    return r.status === 0 ? r.stdout : null;
  };
  const semiSpec = (txt) => {
    try {
      const p = JSON.parse(txt);
      return p.dependencies?.["@semi/ui"] ?? p.devDependencies?.["@semi/ui"] ?? null;
    } catch {
      return null;
    }
  };
  const pkgNow = existsSync(join(cwd, "package.json")) ? readFileSync(join(cwd, "package.json"), "utf8") : "{}";
  const pkgBase = atBase("package.json");
  if (pkgBase && semiSpec(pkgBase) !== semiSpec(pkgNow)) return []; // a Semi upgrade: new rules may add debt
  const out = [];
  const baseTxt = atBase(cfg.baseline);
  if (baseTxt) {
    const was = JSON.parse(baseTxt);
    for (const [id, perFile] of Object.entries(baseline))
      for (const [file, c] of Object.entries(perFile)) if (c > (was[id]?.[file] ?? 0)) out.push(`${cfg.baseline}: ${id} in ${file} grew ${was[id]?.[file] ?? 0} → ${c} (fix the code; the baseline only shrinks)`);
  }
  const cfgTxt = atBase("semi-lint.json");
  if (cfgTxt) {
    const was = JSON.parse(cfgTxt);
    const paths = (v) => (!v ? [] : Array.isArray(v) ? v : Object.keys(v));
    const warn = new Set(WARN.map(([id]) => id)); // warning tier: turning one off is not growth
    for (const [id, v] of Object.entries(cfg.skip || {}))
      for (const p of warn.has(id) ? [] : paths(v)) if (!paths(was.skip?.[id]).includes(p)) out.push(`semi-lint.json: new skip ${id} → ${p} (needs the user's OK; put the reason in the pull request)`);
    for (const id of cfg.disable || []) if (!warn.has(id) && !(was.disable || []).includes(id)) out.push(`semi-lint.json: rule ${id} newly disabled (needs the user's OK)`);
  }
  return out;
}

function main(argv) {
  const args = { files: null, update: false, acceptNew: false, ci: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--files") {
      args.files = [];
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) args.files.push(argv[++i]);
    } else if (a === "--update-baseline") args.update = true;
    else if (a === "--accept-new") args.acceptNew = true;
    else if (a === "--ci") args.ci = true;
    else if (a === "--json") args.json = true;
    else if (a === "-h" || a === "--help") {
      console.log(
        "usage: semi-lint [--files f1 f2 …] [--update-baseline [--accept-new]] [--ci] [--json]\n" +
          "  --update-baseline  lower the baseline to what is left (it never grows)\n" +
          "  --accept-new       with --update-baseline: also record new hits (after a Semi upgrade, or with the user's OK)\n" +
          "  --ci               also fail when the baseline or a skip grew against the base branch (SEMI_LINT_BASE, default origin/main)",
      );
      return 0;
    } else {
      console.error(`semi-lint: unknown argument ${a}`);
      return 2;
    }
  }
  const cwd = process.cwd();
  const cfg = loadConfig(cwd);
  const errors = configErrors(cfg);
  if (errors.length) {
    console.error(`semi-lint.json:\n${errors.map((e) => `  ${e}`).join("\n")}`);
    return 2;
  }
  const paths = filesToScan(cfg, cwd, args.files);
  const { hard, counts, lines, warnings } = scan(paths, cfg, cwd);
  const baselinePath = resolve(cwd, cfg.baseline);

  if (args.update) {
    if (args.files) {
      console.error("--update-baseline scans everything; drop --files");
      return 1;
    }
    // The baseline only shrinks: a hit it did not know is fixed, not recorded. A new rule after a Semi upgrade, or debt
    // the user accepted, needs --accept-new; the first baseline (adopting Semi) records everything.
    const old = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : null;
    let next = counts;
    let refused = 0;
    if (old && !args.acceptNew) {
      next = {};
      for (const [id, perFile] of Object.entries(counts)) {
        next[id] = {};
        for (const [file, c] of Object.entries(perFile)) {
          const keep = Math.min(c, old[id]?.[file] ?? 0);
          if (keep) next[id][file] = keep;
          refused += c - keep;
        }
      }
    }
    writeFileSync(baselinePath, JSON.stringify(sortedCounts(next), null, 1) + "\n");
    const n = Object.values(next).reduce((s, v) => s + Object.values(v).reduce((a, b) => a + b, 0), 0);
    if (!args.json) console.log(`baseline written: ${n} ratchet hits`);
    if (refused && !args.json)
      console.log(`semi-lint: ${refused} new hit(s) not added to the baseline: fix them (or, after a Semi upgrade or with the user's OK, --update-baseline --accept-new)`);
  }

  const base = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
  const grownConfig = args.ci ? configGrowth(cwd, cfg, base) : [];
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
    console.log(JSON.stringify({ files: paths.length, hard, grown, grownConfig, warnings, ratchet: sortedCounts(counts), ratchetTotal: total, baselineTotal: known }, null, 1));
    return hard.length || grown.length || grownConfig.length ? 1 : 0;
  }
  for (const g of grownConfig) console.log(`semi-lint --ci: ${g}`);
  for (const w of warnings) console.log(`${w.file}:${w.line}: warning [${w.rule}] ${w.message}`);
  for (const h of hard) console.log(`${h.file}:${h.line}: [${h.rule}] ${h.message}\n    ${h.text}`);
  for (const g of grown) console.log(`${g.file}: [${g.rule}] ${g.hits} hits (lines ${g.lines.join(", ")}${g.hits > g.lines.length ? ", …" : ""}), baseline ${g.baseline}: ${g.message}`);
  if (hard.length || grown.length || grownConfig.length) {
    console.log(
      `\nsemi-lint: ${hard.length} hard violation(s), ${grown.length} file(s) over the ratchet baseline ` +
        "(rules: node_modules/@semi/ui/docs/DESIGN_SYSTEM.md, Anti-patterns)",
    );
    return 1;
  }
  if (!args.files) {
    const hint = total < known ? " (run --update-baseline to lock in the fixes)" : "";
    const where = cfg._found ? "" : " [no semi-lint.json: default scan app/ components/]";
    const warned = warnings.length ? `, ${warnings.length} warning(s)` : "";
    console.log(`semi-lint: clean, ${paths.length} files (${total} known ratchet hits left${hint}${warned})${where}`);
  }
  return 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]).replace(/\\/g, "/").match(/semi-lint(\.mjs)?$/);
if (isMain) process.exit(main(process.argv.slice(2)));
