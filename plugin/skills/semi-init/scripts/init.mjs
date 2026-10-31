#!/usr/bin/env node
// /semi-init automation script: idempotent installer & scaffolder for new or existing Next.js projects. It installs and
// wires @semi/ui and changes no app code: refactoring an existing app is /semi-audit + /semi-fix.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { discoverFrontendApps } from "../../semi-audit/scripts/audit.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "../../..");
const REPO_URL = "https://github.com/hoanghuynh296/semi-nextjs-codebase.git";
const GITHUB_SPEC_BASE = "github:hoanghuynh296/semi-nextjs-codebase";

function parseArgs(argv) {
  const opts = {
    cwd: process.cwd(),
    apply: false,
    writeBaseline: false,
    staticExport: false,
    starter: false,
    appName: "Semi App",
    nextVersion: "latest",
    tailwindVersion: "latest",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cwd" && argv[i + 1]) opts.cwd = resolve(argv[++i]);
    else if (a === "--apply") opts.apply = true;
    else if (a === "--write-baseline") opts.writeBaseline = true;
    else if (a === "--static-export") opts.staticExport = true;
    else if (a === "--starter") opts.starter = true;
    else if (a === "--app-name" && argv[i + 1]) opts.appName = argv[++i];
    else if (a === "--next-version" && argv[i + 1]) opts.nextVersion = argv[++i];
    else if (a === "--tailwind-version" && argv[i + 1]) opts.tailwindVersion = argv[++i];
  }
  return opts;
}

function detectPkgManager(cwd) {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

function resolveTargetSpec() {
  if (process.env.SEMI_UI_SOURCE) {
    return { spec: process.env.SEMI_UI_SOURCE, version: "0.1.0" };
  }
  const ls = spawnSync("git", ["ls-remote", "--tags", "--refs", REPO_URL], { encoding: "utf8", timeout: 15000 });
  if (ls.status !== 0) {
    console.error(
      "ERROR: Cannot access private repository https://github.com/hoanghuynh296/semi-nextjs-codebase.\n" +
        "Action required: Run `gh auth login && gh auth setup-git` (or configure your GitHub SSH key), then re-run `/semi-init`.",
    );
    process.exit(2);
  }
  const tags = (ls.stdout || "")
    .split(/\r?\n/)
    .map((l) => l.split("refs/tags/")[1])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const latest = tags[tags.length - 1] || "v0.1.0";
  return { spec: `${GITHUB_SPEC_BASE}#${latest}`, version: latest.replace(/^v/, "") };
}

function findGlobalsCss(webDir) {
  const candidates = [
    join(webDir, "app", "globals.css"),
    join(webDir, "src", "app", "globals.css"),
    join(webDir, "styles", "globals.css"),
  ];
  return candidates.find((p) => existsSync(p)) || candidates[0];
}

function wireGlobalsCss(webDir) {
  const cssPath = findGlobalsCss(webDir);
  mkdirSync(dirname(cssPath), { recursive: true });
  const relNodeModules = relative(dirname(cssPath), join(webDir, "node_modules", "@semi", "ui"))
    .split(sep)
    .join("/");

  const semiBlock = [
    `/* semi-design-system:start */`,
    `@import "@semi/ui/tokens.css";`,
    `@import "@semi/ui/base.css";`,
    `@source "${relNodeModules}/src";`,
    `@source "${relNodeModules}/styles";`,
    `/* semi-design-system:end */`,
  ].join("\n");

  let content = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : `@import "tailwindcss";\n`;
  if (content.includes("/* semi-design-system:start */")) {
    content = content.replace(/\/\* semi-design-system:start \*\/[\s\S]*?\/\* semi-design-system:end \*\//, semiBlock);
  } else if (content.includes(`@import "tailwindcss";`)) {
    content = content.replace(`@import "tailwindcss";`, `@import "tailwindcss";\n\n${semiBlock}`);
  } else {
    content = `@import "tailwindcss";\n\n${semiBlock}\n\n${content}`;
  }
  writeFileSync(cssPath, content);
  return cssPath;
}

function wireNextConfig(webDir, staticExport) {
  const tsPath = join(webDir, "next.config.ts");
  const mjsPath = join(webDir, "next.config.mjs");
  const jsPath = join(webDir, "next.config.js");
  const target = [tsPath, mjsPath, jsPath].find((p) => existsSync(p)) || tsPath;

  if (!existsSync(target)) {
    writeFileSync(
      tsPath,
      [
        `import type { NextConfig } from "next";`,
        ``,
        `const nextConfig: NextConfig = {`,
        ...(staticExport ? [`  output: "export",`] : []),
        `  transpilePackages: ["@semi/ui"],`,
        `};`,
        ``,
        `export default nextConfig;`,
        ``,
      ].join("\n"),
    );
    return tsPath;
  }

  let content = readFileSync(target, "utf8");
  if (!content.includes("@semi/ui")) {
    if (/transpilePackages\s*:\s*\[/.test(content)) {
      content = content.replace(/transpilePackages\s*:\s*\[/, `transpilePackages: ["@semi/ui", `);
    } else if (/nextConfig\s*(?::\s*NextConfig)?\s*=\s*\{/.test(content)) {
      content = content.replace(
        /(nextConfig\s*(?::\s*NextConfig)?\s*=\s*\{)/,
        `$1\n  transpilePackages: ["@semi/ui"],${staticExport && !content.includes("output:") ? `\n  output: "export",` : ""}`,
      );
    }
  }
  if (staticExport || content.includes(`output: "export"`) || content.includes(`output: 'export'`)) {
    content = content.replace(/^\s*(cacheComponents|partialPrefetching)\s*:\s*true\s*,?\s*\r?\n/gm, "");
  }
  writeFileSync(target, content);
  return target;
}

function wireSemiLintConfig(webDir) {
  const cfgPath = join(webDir, "semi-lint.json");
  if (!existsSync(cfgPath)) {
    const scan = ["src/app", "src/components", "src/modules", "app", "components", "modules"].filter((d) =>
      existsSync(join(webDir, d)),
    );
    const cfg = {
      scan: scan.length ? scan : ["app", "components"],
      baseline: "semi-lint-baseline.json",
      skip: {},
      only: {},
    };
    writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");
  } else {
    try {
      const existing = JSON.parse(readFileSync(cfgPath, "utf8"));
      if (!existing.baseline) existing.baseline = "semi-lint-baseline.json";
      // Prevent broad skip blankets that hide real errors (e.g. skip: { ...: ["src/app"] })
      if (existing.skip) {
        for (const [rule, list] of Object.entries(existing.skip)) {
          if (Array.isArray(list)) {
            existing.skip[rule] = list.filter((p) => p !== "src/app" && p !== "app" && p !== "src");
            if (existing.skip[rule].length === 0) delete existing.skip[rule];
          }
        }
      }
      writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + "\n");
    } catch {
      // ignore
    }
  }
  return cfgPath;
}

function wireAgentsMd(rootDir, version) {
  const rulesTemplatePath = join(PLUGIN_ROOT, "rules", "AGENTS.md");
  const baseBlock = existsSync(rulesTemplatePath)
    ? readFileSync(rulesTemplatePath, "utf8")
    : `<!-- semi-design-system:start -->\n# Semi Design System (\`@semi/ui\` v${version})\n<!-- semi-design-system:end -->\n`;
  const stampedBlock = baseBlock.replace(
    /\(`@semi\/ui`[^)]*\)/,
    `(\`@semi/ui\` v${version}, repo \`https://github.com/hoanghuynh296/semi-nextjs-codebase\`)`,
  );

  const agentsPath = join(rootDir, "AGENTS.md");
  if (!existsSync(agentsPath)) {
    writeFileSync(agentsPath, stampedBlock);
    return agentsPath;
  }
  let content = readFileSync(agentsPath, "utf8");
  if (content.includes("<!-- semi-design-system:start -->")) {
    content = content.replace(/<!-- semi-design-system:start -->[\s\S]*?<!-- semi-design-system:end -->/, stampedBlock.trim());
  } else {
    content = `${content.trimEnd()}\n\n${stampedBlock}`;
  }
  writeFileSync(agentsPath, content);
  return agentsPath;
}

function writeNewProjectStarter(webDir, appName) {
  const layoutPath = join(webDir, "app", "layout.tsx");
  writeFileSync(
    layoutPath,
    `import type { Metadata } from "next";
import { Geist, Montserrat_Alternates } from "next/font/google";
import { ConfirmHost, ThemeProvider, ThemeScript, ToastHost } from "@semi/ui";
import "./globals.css";

const geist = Geist({ subsets: ["latin", "vietnamese"], variable: "--font-geist" });
const montserratAlternates = Montserrat_Alternates({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  variable: "--font-montserrat-alternates",
});

export const metadata: Metadata = {
  title: ${JSON.stringify(appName)},
  description: "Built with the Semi Design System (@semi/ui)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="dark" className={\`dark \${geist.variable} \${montserratAlternates.variable}\`} suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="bg-app text-body font-sans antialiased min-h-screen">
        <ThemeProvider defaultTheme="dark">
          {children}
          <ConfirmHost />
          <ToastHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
`,
  );

  const pagePath = join(webDir, "app", "page.tsx");
  writeFileSync(
    pagePath,
    `"use client";

import React, { useState } from "react";
import {
  AppShell,
  Chip,
  CustomSelect,
  IconTile,
  KpiCard,
  PageTitle,
  Pills,
  SubpageToolbar,
  ThemeToggle,
  confirmDialog,
  type ShellNavSection,
} from "@semi/ui";
import { CARD, STATUS_DOT } from "@semi/ui/styles";

const SECTIONS: ShellNavSection[] = [
  {
    label: "Quản lý",
    items: [
      { id: "dashboard", label: "Tổng quan", shortLabel: "Trang chủ", icon: "grid" },
      { id: "devices", label: "Thiết bị", icon: "printer" },
      { id: "inventory", label: "Kho vật tư", icon: "spool" },
      { id: "automation", label: "Tự động hoá", icon: "zap" },
    ],
  },
  {
    label: "Hệ thống",
    items: [{ id: "settings", label: "Cài đặt", icon: "settings" }],
  },
];

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "online", label: "Trực tuyến" },
  { key: "busy", label: "Đang chạy" },
] as const;

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("vn");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  return (
    <AppShell
      productName={${JSON.stringify(appName)}}
      logoIcon="layers"
      sections={SECTIONS}
      activeId={activeNav}
      onSelect={setActiveNav}
    >
      <div className="flex items-center justify-between gap-4 pb-2">
        <PageTitle title={${JSON.stringify(appName)}} />
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon="printer" iconTone="green" label="Thiết bị trực tuyến" value="12 / 14" sub="Hoạt động ổn định" />
        <KpiCard icon="zap" iconTone="sky" label="Tác vụ hôm nay" value="148" sub="Tỷ lệ thành công 99.2%" />
        <KpiCard icon="spool" iconTone="violet" label="Tồn kho khả dụng" value="86" sub="4 mục sắp hết" />
        <KpiCard icon="coin" iconTone="amber" label="Hiệu suất trung bình" value="42 ms" sub="Trong 24 giờ qua" />
      </div>

      <SubpageToolbar
        left={
          <>
            <Pills options={[...TABS]} value={tab} onChange={setTab} />
            <Chip active={pinnedOnly} onClick={() => setPinnedOnly((v) => !v)}>
              <span>Đã ghim</span>
            </Chip>
            <CustomSelect
              value={region}
              onChange={setRegion}
              options={[
                { value: "vn", label: "Khu vực VN" },
                { value: "sg", label: "Khu vực SG" },
              ]}
            />
          </>
        }
        onPrimaryAction={() =>
          confirmDialog({
            title: "Tạo mục mới",
            message: "Bạn có muốn khởi tạo bản ghi mới trong hệ thống Semi không?",
            confirmLabel: "Tạo mới",
          })
        }
        primaryActionLabel="Tạo mới"
        searchValue={query}
        onSearchChange={setQuery}
        onRefresh={async () => {}}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { id: "01", name: "Thiết bị điều khiển trung tâm", status: "online" as const, metric: "99.8%" },
          { id: "02", name: "Trạm xử lý dữ liệu thời gian thực", status: "printing" as const, metric: "42 ms" },
          { id: "03", name: "Bộ lưu trữ nhật ký vận hành", status: "online" as const, metric: "1.2 TB" },
        ].map((item) => (
          <div key={item.id} className={\`\${CARD} p-4 space-y-3\`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <IconTile name="printer" tone="sky" size="md" />
                <div className="min-w-0">
                  <div className="text-ui font-semibold text-contrast truncate">{item.name}</div>
                  <div className="text-caption text-muted tabular-nums">Mã #{item.id}</div>
                </div>
              </div>
              <span className={\`w-2 h-2 rounded-full shrink-0 \${STATUS_DOT[item.status]}\`} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-divider text-label">
              <span className="text-muted">Hiệu suất</span>
              <span className="text-contrast font-medium tabular-nums">{item.metric}</span>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
`,
  );
}

const opts = parseArgs(process.argv.slice(2));
mkdirSync(opts.cwd, { recursive: true });

const discovered = discoverFrontendApps(opts.cwd);
let webDir = discovered[0] || opts.cwd;
const isExisting = discovered.length > 0;

if (isExisting && !opts.apply) {
  // Detection only: which apps exist and whether they already have @semi/ui. Pass --apply to install.
  const apps = discovered.map((dir) => {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return { dir: relative(opts.cwd, dir) || ".", next: deps.next || null, tailwindcss: deps.tailwindcss || null, semiUi: deps["@semi/ui"] || null };
  });
  console.log(JSON.stringify({ existing: true, apps }, null, 2));
  process.exit(10);
}

const { spec, version } = resolveTargetSpec();

if (!isExisting) {
  const cnaTag = opts.nextVersion && opts.nextVersion !== "keep" ? opts.nextVersion : "latest";
  console.log(`Scaffolding new Next.js (${cnaTag}) + Tailwind (${opts.tailwindVersion}) project in ${webDir}...`);
  const create = spawnSync(
    "npx",
    [
      "--yes",
      `create-next-app@${cnaTag}`,
      ".",
      "--ts",
      "--tailwind",
      "--eslint",
      "--app",
      "--no-src-dir",
      "--import-alias",
      "@/*",
      "--use-npm",
      "--yes",
    ],
    { cwd: webDir, stdio: "inherit" },
  );
  if (create.status !== 0) process.exit(create.status || 1);
}

// Add @semi/ui + semi:lint script + requested Next.js / Tailwind versions to package.json
const pkgPath = join(webDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.dependencies = pkg.dependencies || {};
pkg.devDependencies = pkg.devDependencies || {};
pkg.dependencies["@semi/ui"] = spec;

if (opts.nextVersion && opts.nextVersion !== "keep") {
  pkg.dependencies.next = opts.nextVersion;
  if (pkg.devDependencies["eslint-config-next"]) {
    pkg.devDependencies["eslint-config-next"] = opts.nextVersion;
  }
}
if (opts.tailwindVersion && opts.tailwindVersion !== "keep") {
  if (pkg.dependencies.tailwindcss) pkg.dependencies.tailwindcss = opts.tailwindVersion;
  else pkg.devDependencies.tailwindcss = opts.tailwindVersion;

  if (pkg.devDependencies["@tailwindcss/turbopack"]) {
    pkg.devDependencies["@tailwindcss/turbopack"] = opts.tailwindVersion;
  }
  if (pkg.devDependencies["@tailwindcss/postcss"]) {
    pkg.devDependencies["@tailwindcss/postcss"] = opts.tailwindVersion;
  } else if (!pkg.devDependencies["@tailwindcss/turbopack"]) {
    pkg.devDependencies["@tailwindcss/postcss"] = opts.tailwindVersion;
  }
}

pkg.scripts = pkg.scripts || {};
pkg.scripts["semi:lint"] = "semi-lint";
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const pm = detectPkgManager(webDir);
console.log(`Installing @semi/ui (${spec}) with ${pm}...`);
const installArgs = pm === "npm" ? ["install", "--install-links"] : ["install"];
const inst = spawnSync(pm, installArgs, { cwd: webDir, stdio: "inherit" });
if (inst.status !== 0) process.exit(inst.status || 1);

const installedPkgPath = join(webDir, "node_modules", "@semi", "ui", "package.json");
const installedVersion = existsSync(installedPkgPath)
  ? JSON.parse(readFileSync(installedPkgPath, "utf8")).version
  : version;

wireNextConfig(webDir, opts.staticExport);
wireGlobalsCss(webDir);
wireSemiLintConfig(webDir);
wireAgentsMd(opts.cwd, installedVersion);

if (!isExisting || opts.starter) {
  writeNewProjectStarter(webDir, opts.appName);
} else if (isExisting && opts.apply) {
  // Record today's debt so the edit hook only blocks new debt; /semi-fix pays the old debt off and shrinks it.
  spawnSync("npx", ["semi-lint", "--update-baseline"], { cwd: webDir, stdio: "inherit" });
}

if (opts.writeBaseline) {
  spawnSync("npx", ["semi-lint", "--update-baseline"], { cwd: webDir, stdio: "inherit" });
}

console.log("\nRunning verification (semi-lint + tsc + next build)...");
const lintRes = spawnSync("npx", ["semi-lint"], { cwd: webDir, stdio: "inherit" });
const tscRes = spawnSync("npx", ["tsc", "--noEmit"], { cwd: webDir, stdio: "inherit" });
const buildRes = spawnSync(pm, ["run", "build"], { cwd: webDir, stdio: "inherit" });

// A new app must be lint-clean; an existing app keeps its old hard hits until /semi-fix (the install must still build).
if ((!isExisting && lintRes.status !== 0) || tscRes.status !== 0 || buildRes.status !== 0) {
  process.exit(1);
}
console.log(`\nSemi Design System (@semi/ui v${installedVersion}) installed in ${webDir}`);
if (isExisting) console.log("Existing app: run /semi-audit, then /semi-fix to refactor it to Semi.");
