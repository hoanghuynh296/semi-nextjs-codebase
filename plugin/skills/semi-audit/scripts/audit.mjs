#!/usr/bin/env node
// /semi-audit static & structural analyzer for existing web projects (including multi-app monorepos). Zero external deps.
// It changes no source file: it prints a short summary and writes every issue to semi-audit.md, which /semi-fix works
// from (deleted again once an audit finds nothing).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { HARD, RATCHET, loadConfig, scan as runSemiLintScan } from "./vendor/semi-lint.mjs";
import { analyse } from "./vendor/classes.mjs";
import { detectMode, migrateSource } from "./vendor/codemod.mjs";

export const REPORT_FILE = "semi-audit.md";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_TOKENS_PATH = resolve(__dirname, "../../../../tokens/tokens.json");
const VENDOR_TOKENS_PATH = resolve(__dirname, "./vendor/tokens.json");
const TOKENS_PATH = existsSync(REPO_TOKENS_PATH) ? REPO_TOKENS_PATH : VENDOR_TOKENS_PATH;
const TOKENS = existsSync(TOKENS_PATH) ? JSON.parse(readFileSync(TOKENS_PATH, "utf8")) : { color: {} };

function hexToRgb(hex) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const PALETTE = [];
for (const [group, entries] of Object.entries(TOKENS)) {
  if (group.startsWith("$") || typeof entries !== "object" || !entries) continue;
  for (const [name, raw] of Object.entries(entries)) {
    const hex = typeof raw === "string" ? raw : (raw?.dark || raw?.value);
    if (typeof hex === "string" && hex.startsWith("#")) {
      const rgb = hexToRgb(hex);
      if (rgb) PALETTE.push({ name: name.replace(/^color-/, ""), hex, rgb });
    }
  }
}

function nearestToken(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb || !PALETTE.length) return null;
  let best = null;
  let bestDist = Infinity;
  for (const entry of PALETTE) {
    const d =
      (rgb[0] - entry.rgb[0]) ** 2 +
      (rgb[1] - entry.rgb[1]) ** 2 +
      (rgb[2] - entry.rgb[2]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = entry;
    }
  }
  return best ? { token: best.name, tokenHex: best.hex, distance: Math.round(Math.sqrt(bestDist)) } : null;
}

const SEMI_COMPONENT_MAP = [
  { pattern: /^(appshell|dashboardlayout|shell)$/i, semi: "AppShell (@semi/ui)" },
  { pattern: /^(mobiletabbar|bottomnav|bottombar)$/i, semi: "MobileTabBar (@semi/ui)" },
  { pattern: /^(pagetitle|pageheader|pagetabstitle)$/i, semi: "PageTitle / PageTabsTitle (@semi/ui)" },
  { pattern: /^(subpagetoolbar|toolbar|filterbar)$/i, semi: "SubpageToolbar (@semi/ui)" },
  { pattern: /^(kpicard|kpi|statcard|metriccard)$/i, semi: "KpiCard (@semi/ui)" },
  { pattern: /^(modal|dialog)$/i, semi: "Modal (@semi/ui)" },
  { pattern: /^(ui|primitives)$/i, semi: "Direct @semi/ui + @semi/ui/styles imports (remove wrapper barrel)" },
  { pattern: /^(icon|icons|svgicon|appicon)$/i, semi: "Icon / IconTile (@semi/ui)" },
  { pattern: /^(chip|tag|filterchip)$/i, semi: "Chip (@semi/ui)" },
  { pattern: /^(pill|pills|segmented|tabs|tabbar)$/i, semi: "Pills (@semi/ui)" },
  { pattern: /^(select|customselect|dropdown)$/i, semi: "CustomSelect (@semi/ui)" },
  { pattern: /^(combobox|customcombobox|autocomplete)$/i, semi: "CustomCombobox (@semi/ui)" },
  { pattern: /^(numberinput|numericinput|stepper)$/i, semi: "NumberInput (@semi/ui)" },
  { pattern: /^(numpad|numpadpopup)$/i, semi: "NumPadPopup (@semi/ui)" },
  { pattern: /^(datepicker|dateinput|calendar)$/i, semi: "DatePicker (@semi/ui)" },
  { pattern: /^(search|searchinput|searchbar|searchbox)$/i, semi: "SearchInput (@semi/ui)" },
  { pattern: /^(pagination|pager)$/i, semi: "Pagination (@semi/ui)" },
  { pattern: /^(sidepanel|sidebar|drawer)$/i, semi: "SidePanel / AppShell (@semi/ui)" },
  { pattern: /^(skeleton|shimmer|loading|loader|spinner)$/i, semi: "Skeleton / PageSkeleton (@semi/ui)" },
  { pattern: /^(refreshbutton|reloadbutton)$/i, semi: "RefreshButton (@semi/ui)" },
  { pattern: /^(pageactions|headeractions|toolbaractions)$/i, semi: "PageActions (@semi/ui)" },
  { pattern: /^(appheader|header|navbar|topbar)$/i, semi: "AppHeader (@semi/ui)" },
  { pattern: /^(confirm|confirmdialog|confirmmodal|alertdialog)$/i, semi: "confirmDialog + ConfirmHost (@semi/ui)" },
  { pattern: /^(externallink|outlink)$/i, semi: "ExternalLink (@semi/ui)" },
  { pattern: /^(markdown|mdrenderer)$/i, semi: "Markdown (@semi/ui)" },
  { pattern: /^(button|btn|iconbutton)$/i, semi: "BTN_PRIMARY / BTN_SECONDARY / BTN_DANGER (@semi/ui/styles)" },
  { pattern: /^(card|panel|surface)$/i, semi: "CARD / CARD_HOVER (@semi/ui/styles)" },
];

const UI_LIBS = [
  ["@mui/material", "Material UI (MUI)"],
  ["antd", "Ant Design"],
  ["@chakra-ui/react", "Chakra UI"],
  ["@mantine/core", "Mantine"],
  ["@radix-ui/react-dialog", "Radix UI / shadcn"],
  ["@headlessui/react", "Headless UI"],
  ["styled-components", "styled-components"],
  ["@emotion/react", "Emotion CSS-in-JS"],
  ["lucide-react", "lucide-react icons"],
  ["@heroicons/react", "Heroicons"],
  ["react-icons", "react-icons"],
];

function walkCode(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".next", "out", "dist", "build", ".git", "venv", ".venv"].includes(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkCode(p, out);
    else if (/\.(tsx?|jsx?|mjs|css)$/.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

/** Discover all Next.js / React frontend packages under rawCwd (up to depth 4). */
export function discoverFrontendApps(rawCwd = process.cwd()) {
  const root = resolve(rawCwd);
  const found = [];

  function search(dir, depth) {
    if (depth > 4 || !existsSync(dir)) return;
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.next || deps.react) {
          found.push(dir);
          return; // don't recurse inside an app's own subdirs
        }
      } catch {
        // ignore
      }
    }
    for (const name of readdirSync(dir)) {
      if (["node_modules", ".next", "out", "dist", "build", ".git", "venv", ".venv", "backend"].includes(name) || name.startsWith(".")) {
        continue;
      }
      const sub = join(dir, name);
      try {
        if (statSync(sub).isDirectory()) search(sub, depth + 1);
      } catch {
        // ignore
      }
    }
  }

  search(root, 0);
  return found;
}

/** The dirs and files the audit reads in one app (semi-lint.json "scan" when present). */
export function scanTargets(cwd) {
  const cfg = loadConfig(cwd);
  const dirs = cfg._found
    ? cfg.scan.filter((d) => existsSync(join(cwd, d)))
    : ["src/app", "src/components", "src/pages", "src/modules", "app", "components", "pages", "modules"].filter(
        (d, idx, arr) => existsSync(join(cwd, d)) && !arr.slice(0, idx).some((prev) => d.startsWith(prev + "/")),
      );
  const files = [...new Set((dirs.length ? dirs.map((d) => join(cwd, d)) : [cwd]).flatMap((d) => walkCode(d, [])))].sort();
  return { cfg, scanDirs: dirs, files };
}

/** Hash of everything the audit reads, so /semi-fix can tell whether semi-audit.md is still current. */
export function fingerprint(cwd) {
  const h = createHash("sha1");
  for (const f of ["package.json", "semi-lint.json", ...scanTargets(cwd).files.map((p) => relative(cwd, p))]) {
    const p = join(cwd, f);
    if (existsSync(p)) h.update(f).update("\0").update(readFileSync(p)).update("\0");
  }
  return h.digest("hex").slice(0, 16);
}

export function auditSingleApp(cwd) {
  const pkgPath = join(cwd, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const nextVersion = deps.next || null;
  const reactVersion = deps.react || null;
  const twVersion = deps.tailwindcss || null;
  const isTailwindV4 = twVersion ? /^[\^~]?4/.test(twVersion) || twVersion === "latest" : false;
  const hasSemiUi = Boolean(deps["@semi/ui"]);

  const detectedLibs = UI_LIBS.filter(([k]) => Boolean(deps[k])).map(([k, label]) => ({ pkg: k, label, version: deps[k] }));
  if (existsSync(join(cwd, "components.json"))) {
    detectedLibs.push({ pkg: "components.json", label: "shadcn/ui", version: "local" });
  }

  const { cfg: lintCfg, scanDirs, files: allFiles } = scanTargets(cwd);
  const tsFiles = allFiles.filter((f) => /\.(tsx?|jsx?|mjs)$/.test(f));
  const pageFiles = tsFiles.filter((f) => /(?:^|\/)page\.tsx$/.test(f.split(sep).join("/")));

  const hexCounts = new Map();
  const physicalCounts = new Map();
  let totalPhysical = 0;
  const semanticCounts = new Map();
  let totalSemantic = 0;
  // Literal colours come from the same class-token analysis semi-lint runs (vendor/classes.mjs), so they never disagree.
  const inventoryFiles = [];
  const SEMANTIC_RX = /\b((?:bg|from|via|to)-(?:canvas|app|panel|field|raised|accent|accent-hover|overlay|(?:danger|success|warning|info)-(?:bg|border|solid))|text-(?:contrast|body|muted|on-accent|accent-fg|danger-fg|success-fg|warning-fg|info-fg|tone-[a-z]+)|(?:border|divide)-(?:line|divider|line-hover))\b/g;

  const CHROMATIC_TONAL_RX = /\b(?:(?:hover:|active:)?(?:bg|border)|divide|ring|text)-(amber|yellow|orange|red|rose|pink|fuchsia|purple|violet|indigo|blue|sky|cyan|teal|emerald|green)-(?:50|100|200|300|600|700|800|900)\b/g;
  const tonalCounts = new Map();
  let totalTonal = 0;
  const tonalFilesByColor = new Map();

  let vnStringHits = 0;
  let enStringHits = 0;
  const importUsage = new Map();

  // Structural checks
  let usesAppShell = false;
  let legacySidebarFile = null;
  let toolbarPagesCount = 0;
  let paginationPagesCount = 0;
  let usesKpiCard = false;
  let customKpiCardFile = null;
  const wrapperFiles = [];
  const tablePages = [];
  const pagesWithoutToolbar = [];
  const sources = [];

  for (const file of allFiles) {
    const text = readFileSync(file, "utf8");
    const rel = relative(cwd, file).split(sep).join("/");
    sources.push({ rel, src: text, css: file.endsWith(".css") });
    const hexMatches = text.match(/#[0-9a-fA-F]{6}\b/g) || [];
    for (const h of hexMatches) {
      const upper = h.toUpperCase();
      hexCounts.set(upper, (hexCounts.get(upper) || 0) + 1);
    }
    const findings = analyse(text, { css: file.endsWith(".css") });
    for (const f of findings) {
      if (f.rule !== "no-literal-palette") continue;
      physicalCounts.set(f.token, (physicalCounts.get(f.token) || 0) + 1);
      totalPhysical++;
    }
    const byRule = {};
    for (const f of findings) byRule[f.rule] = (byRule[f.rule] || 0) + 1;
    const semanticHere = (text.match(SEMANTIC_RX) || []).length;
    if (findings.length || semanticHere) inventoryFiles.push({ file: rel, findings: byRule, total: findings.length, semantic: semanticHere });
    const semMatches = text.match(SEMANTIC_RX) || [];
    for (const s of semMatches) {
      semanticCounts.set(s, (semanticCounts.get(s) || 0) + 1);
      totalSemantic++;
    }
    for (const match of text.matchAll(CHROMATIC_TONAL_RX)) {
      const t = match[0];
      const color = match[1];
      tonalCounts.set(t, (tonalCounts.get(t) || 0) + 1);
      totalTonal++;
      if (!tonalFilesByColor.has(color)) tonalFilesByColor.set(color, new Set());
      tonalFilesByColor.get(color).add(rel);
    }
    if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text)) {
      vnStringHits++;
    } else {
      enStringHits++;
    }
    const imps = text.matchAll(/from\s+["']([^"']+)["']/g);
    for (const m of imps) {
      const spec = m[1];
      const base = basename(spec).replace(/\.(tsx?|jsx?)$/, "");
      importUsage.set(base, (importUsage.get(base) || 0) + 1);
    }

    if (/\bAppShell\b/.test(text)) usesAppShell = true;
    if (/<aside[^>]*\b(border-r|-translate-x-full)\b/.test(text)) legacySidebarFile = rel;
    if (/\b(SubpageToolbar|STICKY_TOOLBAR)\b/.test(text)) toolbarPagesCount++;
    else if (/(?:^|\/)page\.tsx$/.test(rel)) pagesWithoutToolbar.push(rel);
    if (/\bPagination\b/.test(text)) paginationPagesCount++;
    if (/\bKpiCard\b/.test(text)) usesKpiCard = true;
    if (/function\s+KPICard\b/.test(text)) customKpiCardFile = rel;
    if (/export\s+function\s+(PageHeader|Select|Modal|Input|Textarea|Button|EmptyState)\b/.test(text)) {
      wrapperFiles.push(rel);
    }
    if (/<table\b/.test(text)) {
      tablePages.push(rel);
    }
  }

  const topHexColours = [...hexCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([hex, count]) => ({ hex, count, nearest: nearestToken(hex) }));

  const topPhysicalColours = [...physicalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cls, count]) => ({ cls, count }));
  const topSemanticTokens = [...semanticCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cls, count]) => ({ cls, count }));
  const semanticAdoptionRate =
    totalPhysical + totalSemantic > 0
      ? Math.round((totalSemantic / (totalPhysical + totalSemantic)) * 1000) / 10
      : 100;

  const duplicateComponents = [];
  for (const file of tsFiles) {
    const rel = relative(cwd, file).split(sep).join("/");
    const stem = basename(file, extname(file));
    for (const item of SEMI_COMPONENT_MAP) {
      if (item.pattern.test(stem)) {
        const lines = readFileSync(file, "utf8").split(/\r?\n/).length;
        duplicateComponents.push({
          file: rel,
          name: stem,
          lines,
          importsCount: importUsage.get(stem) || 0,
          semiEquivalent: item.semi,
        });
        break;
      }
    }
  }
  duplicateComponents.sort((a, b) => b.importsCount - a.importsCount);

  const { hard, counts, hits } = runSemiLintScan(tsFiles, { ...lintCfg, scan: scanDirs }, cwd);
  const hardByRule = {};
  const hardByDir = {};
  for (const h of hard) {
    hardByRule[h.rule] = (hardByRule[h.rule] || 0) + 1;
    const topDir = h.file.split("/").slice(0, 2).join("/");
    hardByDir[topDir] = (hardByDir[topDir] || 0) + 1;
  }
  const ratchetByRule = {};
  for (const [rid, perFile] of Object.entries(counts)) {
    const sum = Object.values(perFile).reduce((a, b) => a + b, 0);
    if (sum > 0) ratchetByRule[rid] = sum;
  }

  const questions = [
    {
      id: "framework-versions",
      question: `Which version of Next.js and Tailwind CSS should we install in ${basename(cwd)} (currently next: ${nextVersion || "none"}, tailwindcss: ${twVersion || "none"})?`,
      options: [
        "(Recommended) Latest versions (next@latest + tailwindcss@latest)",
        ...(isTailwindV4 && nextVersion ? [`Keep current versions (next ${nextVersion}, tailwindcss ${twVersion})`] : []),
        "Specify custom Next.js / Tailwind CSS versions",
      ],
    },
  ];

  if (!usesAppShell || legacySidebarFile) {
    questions.push({
      id: "app-shell",
      question: `Layout shell (${legacySidebarFile || "layout.tsx"}) does not use @semi/ui's floating Bento AppShell + collapsible w-52/w-14 sidebar + MobileTabBar. Replace with AppShell?`,
      options: [
        "(Recommended) Replace layout with AppShell + grouped sidebar sections + MobileTabBar (3D Noobs Studio style)",
        "Keep current layout shell",
      ],
    });
  }

  if (wrapperFiles.length > 0 || toolbarPagesCount < Math.max(1, Math.floor(pageFiles.length / 2))) {
    questions.push({
      id: "page-headers-and-wrappers",
      question: `Found legacy UI wrapper file(s) (${wrapperFiles.join(", ") || "PageHeader"}) and ${pageFiles.length - toolbarPagesCount}/${pageFiles.length} pages without SubpageToolbar (STICKY_TOOLBAR). Refactor to Semi page structure?`,
      options: [
        "(Recommended) Remove ui.tsx wrappers and standardize all pages on PageTitle/PageTabsTitle + SubpageToolbar (icon-only + CTA, SearchInput, RefreshButton) + Modal (MODAL_FOOT) + FIELD_INPUT",
        "Keep local ui.tsx wrappers and only fix lint errors",
      ],
    });
  }

  if (tablePages.length > 0) {
    questions.push({
      id: "tables-vs-bento-cards",
      question: `Found ${tablePages.length} view(s) using HTML <table> (${tablePages.slice(0, 4).join(", ")}) and ${paginationPagesCount} using <Pagination>. How should we style list views?`,
      options: [
        "(Recommended) Convert entity overview grids to Bento CARDs (with IconTile/STATUS_DOT), keep dense transactional tables inside CARD with <Pagination> + tabular-nums",
        "Convert all list views to Bento CARD grids",
        "Keep existing tables and only add <Pagination> + SubpageToolbar",
      ],
    });
  }

  if (detectedLibs.length > 0) {
    const names = detectedLibs.map((d) => d.label).join(", ");
    questions.push({
      id: "third-party-ui",
      question: `Detected existing UI/icon libraries (${names}). How should we handle them?`,
      options: [
        "(Recommended) Replace all usages with @semi/ui components and remove the old libraries",
        "Keep alongside @semi/ui for now and migrate screen-by-screen",
      ],
    });
  }

  const customHex = topHexColours.filter((c) => c.nearest && c.nearest.distance > 18);
  if (customHex.length > 0) {
    const sample = customHex.slice(0, 4).map((c) => `${c.hex} (${c.count}x)`).join(", ");
    questions.push({
      id: "brand-colours",
      question: `Found custom hex colours off the default Semi palette: ${sample}. How should we map them?`,
      options: [
        "(Recommended) Map to the nearest Semi surface/status/primary tokens",
        "Override --color-primary-* in globals.css @theme to keep this project's brand accent",
      ],
    });
  }

  if (totalPhysical > 0) {
    const topSample = topPhysicalColours.slice(0, 4).map((c) => `${c.cls} (${c.count}x)`).join(", ");
    questions.push({
      id: "semantic-tokens-codemod",
      question: `Found ${totalPhysical} literal colour classes (${topSample}) that break Dark/Light theme switching. Run automated codemod to migrate them to Semantic Tokens?`,
      options: [
        "(Recommended) Automatically map to Semantic Tokens (bg-panel, bg-field, text-contrast, text-body, text-muted, border-line)",
        "Keep literal classes and record in semi-lint-baseline.json",
      ],
    });
  }

  if (totalTonal > 0) {
    questions.push({
      id: "tonal-matching-codemod",
      question: `Found ${totalTonal} chromatic tonal class usages (cards, callouts, alert banners, rows, buttons, badges, chips) across ${tonalFilesByColor.size} color families. How should they be adapted?`,
      options: [
        "(Recommended) Automatically adapt to Semi Dual-Theme Tone Matching (bg-<color>-500/10 border-<color>-500/20 text-tone-<color>, hover:bg-<color>-500/15)",
        "Convert to neutral gray surfaces (bg-field border-line text-muted)",
        "Keep existing classes as-is",
      ],
    });
  }

  // Migration inventory: every file with colour / size debt, grouped by module, plus a coverage figure. The refactor
  // plan is built from this (one module per PR) and "done" means zero findings, not a frozen baseline.
  const modules = {};
  for (const f of inventoryFiles) {
    const mod = f.file.split("/").slice(0, f.file.split("/").length > 2 ? 2 : 1).join("/");
    const m = (modules[mod] ||= { files: 0, debtFiles: 0, findings: 0, semantic: 0 });
    m.files++;
    if (f.total) m.debtFiles++;
    m.findings += f.total;
    m.semantic += f.semantic;
  }
  const debtTotal = inventoryFiles.reduce((n, f) => n + f.total, 0);
  const inventory = {
    generatedBy: "semi-audit",
    coverage: {
      semanticTokens: totalSemantic,
      findings: debtTotal,
      percent: totalSemantic + debtTotal ? Math.round((totalSemantic / (totalSemantic + debtTotal)) * 1000) / 10 : 100,
    },
    modules: Object.fromEntries(Object.entries(modules).sort((a, b) => b[1].findings - a[1].findings)),
    files: inventoryFiles.filter((f) => f.total).sort((a, b) => b.total - a.total),
  };

  // Every issue, one entry each, for semi-audit.md and /semi-fix. kind: "decision" (structure: fix or keep, the team
  // decides), "manual" (a rule hit no codemod can fix safely), "auto" (the token codemod rewrites it).
  const keep = lintCfg.keep || {};
  const kept = [];
  const issues = [];
  const decide = (check, file, what, fix) => {
    const k = keep[check];
    if (k && (!Array.isArray(k) || k.some((prefix) => (file || "").startsWith(prefix)))) return kept.push({ check, file, reason: Array.isArray(k) ? "" : String(k) });
    issues.push({ kind: "decision", check, file, what, fix });
  };
  if (!hasSemiUi) decide("semi-ui", "package.json", "@semi/ui chưa được cài", "chạy /semi-init (lần đầu áp dụng Semi)");
  if (twVersion && !isTailwindV4) decide("tailwind-v4", "package.json", `Tailwind ${twVersion}, Semi cần v4`, "nâng tailwindcss lên v4 (@tailwindcss/postcss)");
  if (!usesAppShell || legacySidebarFile)
    decide("app-shell", legacySidebarFile || "layout.tsx", legacySidebarFile ? "sidebar cũ (aside border-r / drawer)" : "chưa dùng AppShell", "AppShell + MobileTabBar");
  for (const f of wrapperFiles) decide("ui-wrappers", f, "file wrapper UI riêng che @semi/ui", "import thẳng từ @semi/ui, xoá wrapper");
  if (customKpiCardFile) decide("kpi-card", customKpiCardFile, "KPICard tự viết", "KpiCard");
  for (const f of pagesWithoutToolbar) decide("subpage-toolbar", f, "trang không có SubpageToolbar", "PageTitle + SubpageToolbar (nếu là trang danh sách)");
  for (const f of tablePages) decide("tables", f, "bảng `<table>` HTML", "Table của @semi/ui, hoặc lưới Card cho danh sách thực thể");
  for (const d of duplicateComponents) if (!wrapperFiles.includes(d.file)) decide("duplicates", d.file, `component riêng ${d.name} (${d.importsCount} chỗ import)`, d.semiEquivalent);
  for (const l of detectedLibs) decide("third-party-ui", "package.json", `thư viện UI ${l.label}`, "thay bằng @semi/ui rồi gỡ thư viện");

  for (const h of hard) issues.push({ kind: "manual", rule: h.rule, file: h.file, line: h.line, text: h.text });
  // Class-token findings: what the codemod rewrites is "auto", what it cannot map is "manual".
  const mode = detectMode(sources);
  const autoAt = new Set();
  for (const { rel, src, css } of sources) {
    for (const c of migrateSource(src, { css, mode }).changes) {
      issues.push({ kind: "auto", file: rel, line: c.line, from: c.from, to: c.to });
      autoAt.add(`${rel}:${c.line}:${c.from}`);
    }
  }
  for (const h of hits) if (!h.token || !autoAt.has(`${h.file}:${h.line}:${h.token}`)) issues.push({ kind: "manual", rule: h.rule, file: h.file, line: h.line, token: h.token });
  // CSS files are not linted by semi-lint; their @apply findings still count.
  for (const { rel, src, css } of sources) {
    if (!css) continue;
    for (const f of analyse(src, { css: true })) if (!autoAt.has(`${rel}:${f.line}:${f.token}`)) issues.push({ kind: "manual", rule: f.rule, file: rel, line: f.line, token: f.token });
  }
  const order = { decision: 0, manual: 1, auto: 2 };
  issues.sort((a, b) => order[a.kind] - order[b.kind] || (a.file || "").localeCompare(b.file || "") || (a.line || 0) - (b.line || 0));

  return {
    exists: true,
    cwd,
    issues,
    kept,
    inventory,
    stack: {
      nextVersion,
      reactVersion,
      tailwindVersion: twVersion,
      isTailwindV4,
      hasSemiUi,
      semiUiVersion: (() => {
        try {
          return JSON.parse(readFileSync(join(cwd, "node_modules/@semi/ui/package.json"), "utf8")).version;
        } catch {
          return null;
        }
      })(),
      detectedLibs,
      uiLanguage: vnStringHits >= enStringHits ? "Vietnamese" : "Mixed / English",
      tsFileCount: tsFiles.length,
      pageFileCount: pageFiles.length,
      scanDirs,
    },
    structure: {
      usesAppShell,
      legacySidebarFile,
      toolbarPagesCount,
      pageFileCount: pageFiles.length,
      paginationPagesCount,
      usesKpiCard,
      customKpiCardFile,
      wrapperFiles,
      tablePages,
    },
    colours: {
      topHexColours,
      offPaletteCount: customHex.length,
      physicalColours: {
        total: totalPhysical,
        topClasses: topPhysicalColours.slice(0, 10),
      },
      semanticTokens: {
        total: totalSemantic,
        topClasses: topSemanticTokens.slice(0, 10),
      },
      totalTonal,
      tonalColors: [...tonalFilesByColor.entries()]
        .map(([color, filesSet]) => {
          const sampleClasses = [...tonalCounts.entries()]
            .filter(([cls]) => cls.includes(`-${color}-`))
            .map(([cls, cnt]) => `${cls} (${cnt}x)`)
            .slice(0, 4);
          const count = [...tonalCounts.entries()]
            .filter(([cls]) => cls.includes(`-${color}-`))
            .reduce((sum, [, cnt]) => sum + cnt, 0);
          return {
            color,
            count,
            files: [...filesSet].slice(0, 5),
            sampleClasses,
          };
        })
        .sort((a, b) => b.count - a.count),
      semanticAdoptionRate,
    },
    duplicateComponents,
    lint: {
      hardTotal: hard.length,
      hardByRule,
      hardByDir,
      ratchetByRule,
      ratchetTotal: Object.values(ratchetByRule).reduce((a, b) => a + b, 0),
    },
    questions,
  };
}

export function auditProject(rawCwd = process.cwd()) {
  const apps = discoverFrontendApps(rawCwd);
  if (apps.length === 0) {
    return { exists: false, cwd: resolve(rawCwd), apps: [], message: "No package.json found — treat as a new project." };
  }
  const reports = apps.map((dir) => auditSingleApp(dir));
  if (reports.length === 1) {
    return { ...reports[0], root: resolve(rawCwd), apps: reports };
  }
  const multiAppQuestion = {
    id: "monorepo-target-apps",
    question: `Detected ${reports.length} frontend apps in this repository (${reports.map((r) => relative(resolve(rawCwd), r.cwd)).join(", ")}). Which app(s) should we refactor to the Semi Design System?`,
    options: [
      `(Recommended) All ${reports.length} frontend apps (${reports.map((r) => basename(r.cwd)).join(" + ")})`,
      ...reports.map((r) => `Only ${relative(resolve(rawCwd), r.cwd)}`),
    ],
  };
  return {
    exists: true,
    isMonorepo: true,
    cwd: resolve(rawCwd),
    root: resolve(rawCwd),
    apps: reports,
    questions: [multiAppQuestion, ...reports.flatMap((r) => r.questions)],
  };
}

const RULE_HINTS = Object.fromEntries([...HARD, ...RATCHET].map(([id, , msg]) => [id, msg]));
const CHECK_NAMES = {
  "semi-ui": "chưa cài @semi/ui",
  "tailwind-v4": "Tailwind v3",
  "app-shell": "khung AppShell",
  "ui-wrappers": "wrapper UI riêng",
  "kpi-card": "KPICard riêng",
  "subpage-toolbar": "trang thiếu SubpageToolbar",
  tables: "bảng HTML",
  duplicates: "component trùng @semi/ui",
  "third-party-ui": "thư viện UI khác",
};
const appsOf = (r) => (r.apps?.length ? r.apps : r.exists ? [r] : []);
const rootOf = (r) => r.root || r.cwd;
const nameOf = (r, a) => relative(rootOf(r), a.cwd) || basename(a.cwd);
const countBy = (list, key) => {
  const m = new Map();
  for (const x of list) m.set(x[key], (m.get(x[key]) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
export function totals(r) {
  const all = appsOf(r).flatMap((a) => a.issues);
  const n = (k) => all.filter((i) => i.kind === k).length;
  return { total: all.length, decision: n("decision"), manual: n("manual"), auto: n("auto") };
}

/** Short Vietnamese summary for the chat: one table, the next command, then the issues grouped in a few lines. */
export function formatSummary(r, reportPath = REPORT_FILE) {
  if (!r.exists) return `# Semi audit\n\nKhông thấy app Next.js / React nào: đây là dự án mới, chạy **/semi-init**.\n`;
  const apps = appsOf(r);
  const t = totals(r);
  const needsInit = apps.filter((a) => !a.stack.hasSemiUi);
  const lines = [
    `# Semi audit`,
    ``,
    `| App | @semi/ui | Next · Tailwind | Token | Vấn đề |`,
    `|---|---|---|---:|---:|`,
    ...apps.map(
      (a) =>
        `| \`${nameOf(r, a)}\` | ${a.stack.semiUiVersion || (a.stack.hasSemiUi ? "có" : "chưa cài")} | ${a.stack.nextVersion || "—"} · ${a.stack.tailwindVersion || "—"} | ${a.inventory.coverage.percent}% | ${a.issues.length || "✅ 0"} |`,
    ),
    ``,
  ];
  if (!t.total) lines.push(`✅ Không có vấn đề.`);
  else {
    lines.push(
      `**${t.total} vấn đề:** ${t.decision} cần quyết định · ${t.manual} sửa tay · ${t.auto} tự sửa (codemod). Chi tiết: \`${reportPath}\`.`,
      ``,
      needsInit.length
        ? `**Tiếp theo:** chạy **/semi-init** cho ${needsInit.map((a) => `\`${nameOf(r, a)}\``).join(", ")} (chưa cài @semi/ui), sau đó **/semi-fix**.`
        : `**Tiếp theo:** chạy **/semi-fix**.`,
      ``,
      `## Vấn đề`,
    );
    for (const a of apps) {
      if (!a.issues.length) continue;
      const of = (k) => a.issues.filter((i) => i.kind === k);
      const parts = [];
      const d = of("decision");
      if (d.length) parts.push(`cần quyết định: ${countBy(d, "check").map(([c, n]) => `${CHECK_NAMES[c] || c}${n > 1 ? ` ×${n}` : ""}`).join(", ")}`);
      const m = of("manual");
      if (m.length) parts.push(`sửa tay: ${countBy(m, "rule").slice(0, 5).map(([c, n]) => `\`${c}\` ×${n}`).join(", ")}${countBy(m, "rule").length > 5 ? ", …" : ""}`);
      const au = of("auto");
      if (au.length) parts.push(`tự sửa: ${au.length} class màu trong ${new Set(au.map((i) => i.file)).size} file`);
      lines.push(`- **\`${nameOf(r, a)}\`**`, ...parts.map((p) => `  - ${p}`));
    }
  }
  const kept = apps.flatMap((a) => a.kept);
  if (kept.length) lines.push(``, `Giữ nguyên theo \`keep\` trong semi-lint.json: ${countBy(kept, "check").map(([c, n]) => `${CHECK_NAMES[c] || c} ×${n}`).join(", ")}.`);
  return lines.join("\n") + "\n";
}

/** semi-audit.md: every issue with file:line, what to do, and a meta line /semi-fix uses to detect a stale file. */
export function formatDetails(r) {
  const apps = appsOf(r);
  const t = totals(r);
  const meta = { generatedAt: new Date().toISOString(), apps: apps.map((a) => ({ cwd: relative(rootOf(r), a.cwd) || ".", fingerprint: fingerprint(a.cwd) })) };
  const at = (i) => `\`${i.file}${i.line ? `:${i.line}` : ""}\``;
  const lines = [
    `<!-- semi-audit ${JSON.stringify(meta)} -->`,
    `# Semi audit: chi tiết`,
    ``,
    `Sinh bởi /semi-audit để /semi-fix làm theo. Đừng sửa tay: chạy lại /semi-audit sau khi đổi code. File được xoá khi audit không còn vấn đề.`,
    ``,
    `**${t.total} vấn đề:** ${t.decision} cần quyết định · ${t.manual} sửa tay · ${t.auto} tự sửa (codemod)`,
  ];
  const usedRules = new Set();
  for (const a of apps) {
    if (!a.issues.length) continue;
    lines.push(``, `## App \`${nameOf(r, a)}\``);
    const of = (k) => a.issues.filter((i) => i.kind === k);
    const d = of("decision");
    if (d.length) {
      lines.push(``, `### Cần quyết định (${d.length})`, ``, `Sửa theo đề xuất, hoặc giữ nguyên: thêm \`"keep": { "<check>": "lý do" }\` (hoặc mảng đường dẫn) vào \`semi-lint.json\`.`, ``);
      d.forEach((i, n) => lines.push(`- [ ] D${n + 1} \`${i.check}\` ${at(i)}: ${i.what} → ${i.fix}`));
    }
    const m = of("manual");
    if (m.length) {
      lines.push(``, `### Sửa tay (${m.length})`);
      let file = null;
      for (const i of m) {
        usedRules.add(i.rule);
        if (i.file !== file) lines.push(``, `#### \`${(file = i.file)}\``);
        lines.push(`- [ ] L${i.line} \`${i.rule}\`${i.token ? ` \`${i.token}\`` : ""}${i.text ? `: \`${i.text.replace(/`/g, "'")}\`` : ""}`);
      }
    }
    const au = of("auto");
    if (au.length) {
      lines.push(``, `### Tự sửa bằng codemod (${au.length})`, ``, `\`node <semi-fix>/scripts/fix.mjs --codemod\` đổi hết các dòng này; xem lại diff.`);
      let file = null;
      for (const i of au) {
        if (i.file !== file) lines.push(``, `#### \`${(file = i.file)}\``);
        lines.push(`- [ ] L${i.line} \`${i.from}\` → ${i.to ? `\`${i.to}\`` : "bỏ (token gốc đã đổi theo theme)"}`);
      }
    }
  }
  if (usedRules.size) {
    lines.push(``, `## Luật`, ``);
    for (const id of [...usedRules].sort()) lines.push(`- \`${id}\`: ${RULE_HINTS[id] || ""}`);
  }
  return lines.join("\n") + "\n";
}

/** Write semi-audit.md under root, or delete it when the audit found nothing. Returns the path, or null when clean. */
export function writeAuditFile(r, root = rootOf(r)) {
  const path = join(root, REPORT_FILE);
  if (!r.exists || !totals(r).total) {
    rmSync(path, { force: true });
    return null;
  }
  writeFileSync(path, formatDetails(r));
  return path;
}

/** Meta line of an existing semi-audit.md (null when missing), and whether every app still has the same sources. */
export function auditFileState(root) {
  const path = join(root, REPORT_FILE);
  if (!existsSync(path)) return { path, exists: false, fresh: false };
  const m = readFileSync(path, "utf8").match(/^<!-- semi-audit (.*) -->/);
  let meta = null;
  try {
    meta = m ? JSON.parse(m[1]) : null;
  } catch {
    meta = null;
  }
  const fresh = Boolean(meta?.apps?.length) && meta.apps.every((a) => existsSync(join(root, a.cwd)) && fingerprint(join(root, a.cwd)) === a.fingerprint);
  return { path, exists: true, fresh, meta };
}

const isMain = process.argv[1] && resolve(process.argv[1]).endsWith("audit.mjs");
if (isMain) {
  let cwd = process.cwd();
  let asJson = false;
  let write = true;
  let inventoryPath = null;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cwd" && argv[i + 1]) cwd = argv[++i];
    else if (argv[i] === "--json") asJson = true;
    else if (argv[i] === "--no-write") write = false;
    else if (argv[i] === "--inventory" && argv[i + 1]) inventoryPath = argv[++i];
  }
  const report = auditProject(cwd);
  if (inventoryPath) {
    const apps = report.apps?.length ? report.apps : [report];
    writeFileSync(inventoryPath, JSON.stringify({ apps: apps.map((a) => ({ cwd: a.cwd, ...a.inventory })) }, null, 2) + "\n");
  }
  const written = write ? writeAuditFile(report, resolve(cwd)) : null;
  if (asJson) console.log(JSON.stringify(report, null, 2));
  else {
    const rel = written ? relative(process.cwd(), written) : REPORT_FILE;
    process.stdout.write(formatSummary(report, rel && !rel.startsWith("..") ? rel : written));
  }
}
