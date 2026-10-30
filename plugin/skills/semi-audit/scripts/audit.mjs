#!/usr/bin/env node
// /semi-audit static analyzer for existing web projects. Zero external dependencies.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { HARD, RATCHET, scan as runSemiLintScan } from "./vendor/semi-lint.mjs";

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
    const hex = typeof raw === "string" ? raw : raw?.value;
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
  { pattern: /^(sidepanel|sidebar|drawer)$/i, semi: "SidePanel (@semi/ui)" },
  { pattern: /^(skeleton|shimmer|loading|loader|spinner)$/i, semi: "Skeleton / PageSkeleton (@semi/ui)" },
  { pattern: /^(refreshbutton|reloadbutton)$/i, semi: "RefreshButton (@semi/ui)" },
  { pattern: /^(pageactions|headeractions|toolbaractions)$/i, semi: "PageActions (@semi/ui)" },
  { pattern: /^(appheader|header|navbar|topbar)$/i, semi: "AppHeader (@semi/ui)" },
  { pattern: /^(confirm|confirmdialog|confirmmodal|alertdialog)$/i, semi: "confirmDialog + ConfirmHost (@semi/ui)" },
  { pattern: /^(externallink|outlink)$/i, semi: "ExternalLink (@semi/ui)" },
  { pattern: /^(markdown|mdrenderer)$/i, semi: "Markdown (@semi/ui)" },
  { pattern: /^(button|btn|iconbutton)$/i, semi: "BTN_PRIMARY / BTN_SECONDARY / BTN_DANGER (@semi/ui/styles)" },
  { pattern: /^(card|panel|surface|modal|dialog)$/i, semi: "CARD / MODAL_* (@semi/ui/styles)" },
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
    if (["node_modules", ".next", "out", "dist", "build", ".git", "venv"].includes(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkCode(p, out);
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

export function auditProject(rawCwd = process.cwd()) {
  let cwd = resolve(rawCwd);
  if (!existsSync(join(cwd, "package.json")) && existsSync(join(cwd, "web", "package.json"))) {
    cwd = join(cwd, "web");
  }
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) {
    return { exists: false, cwd, message: "No package.json found — treat as a new project." };
  }

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

  const scanDirs = ["src/app", "src/components", "src/pages", "src/modules", "app", "components", "pages", "modules"]
    .filter((d, idx, arr) => existsSync(join(cwd, d)) && !arr.slice(0, idx).some((prev) => d.startsWith(prev + "/")));
  const allFiles = (scanDirs.length ? scanDirs.map((d) => join(cwd, d)) : [cwd]).flatMap((d) => walkCode(d, []));
  const tsFiles = allFiles.filter((f) => /\.tsx?$/.test(f));

  // Hex colour occurrences
  const hexCounts = new Map();
  let vnStringHits = 0;
  let enStringHits = 0;
  const importUsage = new Map();

  for (const file of allFiles) {
    const text = readFileSync(file, "utf8");
    const hexMatches = text.match(/#[0-9a-fA-F]{6}\b/g) || [];
    for (const h of hexMatches) {
      const upper = h.toUpperCase();
      hexCounts.set(upper, (hexCounts.get(upper) || 0) + 1);
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
  }

  const topHexColours = [...hexCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([hex, count]) => ({ hex, count, nearest: nearestToken(hex) }));

  // Overlapping local components
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

  // Run semi-lint scan across tsFiles
  const { hard, counts } = runSemiLintScan(tsFiles, { scan: scanDirs, skip: {}, only: {}, disable: [] }, cwd);
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

  // Generate decision questions for the user
  const questions = [
    {
      id: "framework-versions",
      question: `Which version of Next.js and Tailwind CSS should we install (currently next: ${nextVersion || "none"}, tailwindcss: ${twVersion || "none"})?`,
      options: [
        "(Recommended) Latest versions (next@latest + tailwindcss@latest)",
        ...(isTailwindV4 && nextVersion ? [`Keep current versions (next ${nextVersion}, tailwindcss ${twVersion})`] : []),
        "Specify custom Next.js / Tailwind CSS versions",
      ],
    },
  ];
  if (detectedLibs.length > 0) {
    const names = detectedLibs.map((d) => d.label).join(", ");
    questions.push({
      id: "third-party-ui",
      question: `Detected existing UI/icon libraries (${names}). How should we handle them?`,
      options: [
        "(Recommended) Keep alongside @semi/ui for now and migrate screen-by-screen",
        "Replace all usages with @semi/ui components and remove the old libraries in Phase 3",
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
  if (duplicateComponents.length > 0) {
    const topNames = duplicateComponents.slice(0, 5).map((d) => `${d.name} (${d.importsCount} imports)`).join(", ");
    questions.push({
      id: "duplicate-components",
      question: `Found ${duplicateComponents.length} local component(s) overlapping with @semi/ui (${topNames}). How should we refactor them?`,
      options: [
        "(Recommended) Replace directly with imports from @semi/ui and delete the local duplicates",
        "Re-export @semi/ui from the existing local component paths first to minimize import churn",
        "Keep existing local components and only use @semi/ui for new screens",
      ],
    });
  }
  questions.push({
    id: "refactor-scope",
    question: `What scope of refactoring should we execute now (${hard.length} hard lint hits across ${tsFiles.length} TS/TSX files)?`,
    options: [
      "(Recommended) Full 4-phase refactor (install @semi/ui -> replace tokens -> migrate components -> lock in semi-lint)",
      "Phase 1 + baseline only (install @semi/ui + tokens now, enforce on new/edited files, refactor old screens later)",
      "Refactor specific directories/routes only",
    ],
  });

  return {
    exists: true,
    cwd,
    stack: {
      nextVersion,
      reactVersion,
      tailwindVersion: twVersion,
      isTailwindV4,
      hasSemiUi,
      detectedLibs,
      uiLanguage: vnStringHits >= enStringHits ? "Vietnamese" : "Mixed / English",
      tsFileCount: tsFiles.length,
      scanDirs,
    },
    colours: { topHexColours, offPaletteCount: customHex.length },
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

function formatMarkdown(r) {
  if (!r.exists) return `# Semi Audit\n\n${r.message}\n`;
  const lines = [
    `# Semi Design System — Audit Report`,
    ``,
    `- **Directory:** \`${r.cwd}\``,
    `- **Next.js:** \`${r.stack.nextVersion || "none"}\` · **React:** \`${r.stack.reactVersion || "none"}\` · **Tailwind:** \`${r.stack.tailwindVersion || "none"}\` (${r.stack.isTailwindV4 ? "v4 ready" : "needs v4 upgrade"})`,
    `- **@semi/ui installed:** ${r.stack.hasSemiUi ? "Yes" : "No"}`,
    `- **Files scanned:** ${r.stack.tsFileCount} TS/TSX files in \`${r.stack.scanDirs.join(", ")}\``,
    `- **UI language detected:** ${r.stack.uiLanguage}`,
    `- **Other UI libraries:** ${r.stack.detectedLibs.length ? r.stack.detectedLibs.map((d) => `${d.label} (${d.version})`).join(", ") : "None"}`,
    ``,
    `## 1. Hard-coded Hex Colours → Nearest Semi Token`,
  ];
  if (!r.colours.topHexColours.length) {
    lines.push(`No raw \`#hex\` literals found.`);
  } else {
    lines.push(`| Hex | Count | Nearest Semi Token | Token Hex | Δ RGB |`, `|---|---:|---|---|---:|`);
    for (const c of r.colours.topHexColours) {
      lines.push(
        `| \`${c.hex}\` | ${c.count} | \`--color-${c.nearest?.token || "?"}\` | \`${c.nearest?.tokenHex || "?"}\` | ${c.nearest?.distance ?? "?"} |`,
      );
    }
  }
  lines.push(``, `## 2. Local Components Overlapping with \`@semi/ui\` (${r.duplicateComponents.length})`);
  if (!r.duplicateComponents.length) {
    lines.push(`None detected.`);
  } else {
    lines.push(`| Local File | Lines | Imports | \`@semi/ui\` Equivalent |`, `|---|---:|---:|---|`);
    for (const d of r.duplicateComponents.slice(0, 25)) {
      lines.push(`| \`${d.file}\` | ${d.lines} | ${d.importsCount} | ${d.semiEquivalent} |`);
    }
  }
  lines.push(
    ``,
    `## 3. \`semi-lint\` Violations`,
    `- **Hard violations:** ${r.lint.hardTotal}`,
    ...Object.entries(r.lint.hardByRule).map(([k, v]) => `  - \`${k}\`: ${v}`),
    `- **By directory:** ${Object.entries(r.lint.hardByDir).map(([k, v]) => `\`${k}\` (${v})`).join(", ") || "clean"}`,
    `- **Ratchet hits:** ${r.lint.ratchetTotal}`,
    ...Object.entries(r.lint.ratchetByRule).map(([k, v]) => `  - \`${k}\`: ${v}`),
    ``,
    `## 4. Questions Requiring User Decision (${r.questions.length})`,
  );
  r.questions.forEach((q, idx) => {
    lines.push(`${idx + 1}. **${q.question}**`);
    for (const opt of q.options) lines.push(`   - ${opt}`);
  });
  return lines.join("\n") + "\n";
}

const isMain = process.argv[1] && resolve(process.argv[1]).endsWith("audit.mjs");
if (isMain) {
  let cwd = process.cwd();
  let asJson = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cwd" && argv[i + 1]) cwd = argv[++i];
    else if (argv[i] === "--json") asJson = true;
  }
  const report = auditProject(cwd);
  if (asJson) console.log(JSON.stringify(report, null, 2));
  else process.stdout.write(formatMarkdown(report));
}
