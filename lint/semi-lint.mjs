#!/usr/bin/env node
// semi-lint: design-system lint for Semi apps (rules: docs/DESIGN_SYSTEM.md, "Anti-patterns"). No dependencies.
//
//   npx semi-lint                     # scan the dirs in semi-lint.json
//   npx semi-lint --files a.tsx b.ts  # only these files (agent edit hook); files outside "scan" are ignored
//   npx semi-lint --update-baseline   # after fixing ratchet hits (or when adopting Semi): rewrite the baseline
//   npx semi-lint --json              # machine-readable result (used by the semi-audit skill)
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

/** [id, regex, message] */
export const HARD = [
  ["font-weight", /font-(bold|extrabold|black)\b/, "weights are font-medium / font-semibold only"],
  ["tiny-text", /text-\[(8|9|10)px\]/, "minimum text size is text-[11px]"],
  ["uppercase-label", /uppercase tracking-(wide|wider|widest)|tracking-(wide|wider|widest) uppercase/, "labels are sentence case"],
  ["native-select", /<select\b/, "use CustomSelect from @semi/ui"],
  ["rounded-md", /\brounded-md\b/, "radius scale: rounded (tiny marks) / lg / xl / 2xl / full"],
  [
    "tw-text-size",
    /\btext-(xs|sm|base|lg|xl)\b/,
    "use explicit px sizes: body/UI text-[11px]…[15px], KPI figures KpiCard (text-[18px] sm:text-[22px]), titles PageTitle (text-[22px] sm:text-[26px])",
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
    "do not keep a local ui.tsx wrapper; use PageTitle, SubpageToolbar, CustomSelect, Modal, FIELD_INPUT, BTN_*, EMPTY from @semi/ui",
  ],
  [
    "input-bg-field",
    /\bh-(8|9|10)\b[^"'\n]*\bbg-field\b|\bbg-field\b[^"'\n]*\bplaceholder:/,
    "inputs/textareas use FIELD_INPUT / FIELD_TEXTAREA (bg-white/[0.05]), never bg-field (invisible inside bg-field modals)",
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
    /<(?:Icon|IconTile)\b[^>]*\bname=["'](delete|remove|bin|destroy|cancel|x|cross|dismiss|reload|sync|fetch|add|new|create|pencil|modify|rename|duplicate|clone|warning|danger|error|tick|done|success|gear|config|cog|preferences|parameters|adjust|tune|funnel|profile|account|customer|team|members|group|notification|notifications|category|label|badge|cart_item|shop|shopping|price|money|cost|package|parcel|inventory|fullscreen|maximize|minimize|exit_fullscreen|return|previous|next|forward|signout|sign_out|ai|magic|help|tooltip|confirm|accept|ok|mail|email|message|link|open_link|shutdown|turn_off|turn_on|power_off|scale|decrease|increase|shopping_bag|shopping-bag|shop_bag|credit_card|credit-card|payment|card|invoice|bill|shipping|delivery|delivered|package_check|package-check|discount|voucher|coupon|percentage|storefront|marketplace|balance|db|sql|storage|host|backend|mcu|processor|chip|mainboard|debug|issue|commit|git_commit|git-commit|pr|pull_request|pull-request|security|protect|ssl|firewall|token|api_key|secret|access_code|pulse|heartbeat|telemetry|growth|uptrend|trending_up|trending-up|downtrend|trending_down|trending-down|pie|pie_chart|pie-chart|chart_pie|speed|speedometer)["']/,
    "use canonical IconName (e.g. trash for delete, close for cancel/x, refresh for reload, settings for gear, filter for funnel, user for profile, bell for notifications, tag for category/label). See docs/ICONS.md",
  ],
  ["home-button", /name="home"/, "app headers have no Home button: logo + title go home (AppHeader)"],
  ["external-link", /window\.open\(|href=\{?["'`]https?:\/\//, "links to other sites use ExternalLink from @semi/ui"],
  [
    "app-chrome-copy",
    /h-\[34px\] px-4 rounded-lg text-\[12px\] font-semibold|p-1 sm:p-1\.5 rounded-2xl z-20|rounded-2xl p-1 gap-1 select-none shadow-xl/,
    "tool-app headers / canvas controls use @semi/ui/styles (headerPrimary, VIEWPORT_TOOLBAR, VIEWPORT_PILL…), not copies",
  ],
  [
    "viewport-grid-cols",
    /(?<![@\w])(sm|md|lg|xl|2xl):grid-cols-/,
    "card grids beside a sidebar size columns by @container (@xl:grid-cols-…), not viewport breakpoints",
  ],
];
/** Rules that are opt-in: they only run on the path prefixes listed in config "only". */
const OPT_IN = new Set(["viewport-grid-cols"]);

export const RATCHET = [
  ["all-caps-label", /\>\s*[A-ZĐẮẰẲẴẶÂẤẦẨẪẬÊẾỀỂỄỆÔỐỒỔỖỘƠỚỜỞỠỢƯỨỪỬỮỰ]{4,}(?:[ .·…]+[A-ZĐ0-9…]+)*\s*</g, "button / label text is sentence case"],
  ["inline-svg-path", /<path\b/g, "add the icon to ICONS in @semi/ui (Icon.tsx) instead of inline <path>"],
  ["thick-stroke", /strokeWidth[=:]\s*\{?"?(2|2\.\d+|3)\b/g, "icon stroke is 1.75"],
  ["font-mono", /\bfont-mono\b/g, "numbers use tabular-nums; mono only for code"],
  ["hex-colour-class", /(bg|text|border)-\[#/g, "use colour tokens"],
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

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

export function filesToScan(cfg, cwd, only) {
  const roots = cfg.scan.map((d) => resolve(cwd, d));
  if (only) {
    return only
      .map((f) => resolve(cwd, f))
      .filter((p) => /\.tsx?$/.test(p) && existsSync(p) && roots.some((r) => p === r || p.startsWith(r + sep)));
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
  for (const p of paths) {
    const name = toPosix(relative(cwd, p));
    const lines = readFileSync(p, "utf8").split(/\r?\n/);
    lines.forEach((raw, i) => {
      if (!raw.trim() || isComment(raw)) return;
      for (const [id, rx, msg] of HARD) {
        if (disabled.has(id)) continue;
        if ((skip[id] || []).some((s) => name.startsWith(s))) continue;
        if (OPT_IN.has(id) && !(onlyMap[id] || []).some((s) => name.startsWith(s))) continue;
        if (!OPT_IN.has(id) && onlyMap[id] && !onlyMap[id].some((s) => name.startsWith(s))) continue;
        if (rx.test(raw)) hard.push({ file: name, line: i + 1, rule: id, message: msg, text: raw.trim().slice(0, 140) });
      }
      for (const [id, rx] of RATCHET) {
        if (disabled.has(id)) continue;
        if ((skip[id] || []).some((s) => name.startsWith(s))) continue;
        rx.lastIndex = 0;
        const c = (raw.match(rx) || []).length;
        if (c) counts[id][name] = (counts[id][name] || 0) + c;
      }
    });
  }
  return { hard, counts };
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
  const { hard, counts } = scan(paths, cfg, cwd);
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
      if (c > allowed) grown.push({ file, rule: id, hits: c, baseline: allowed, message: msgs[id] });
    }
  }
  const total = Object.values(counts).reduce((s, v) => s + Object.values(v).reduce((a, b) => a + b, 0), 0);
  const known = Object.values(base).reduce((s, v) => s + Object.values(v).reduce((a, b) => a + b, 0), 0);

  if (args.json) {
    console.log(JSON.stringify({ files: paths.length, hard, grown, ratchet: sortedCounts(counts), ratchetTotal: total, baselineTotal: known }, null, 1));
    return hard.length || grown.length ? 1 : 0;
  }
  for (const h of hard) console.log(`${h.file}:${h.line}: [${h.rule}] ${h.message}\n    ${h.text}`);
  for (const g of grown) console.log(`${g.file}: [${g.rule}] ${g.hits} hits, baseline ${g.baseline}: ${g.message}`);
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
