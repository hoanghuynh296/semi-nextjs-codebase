#!/usr/bin/env node
// /semi-new-app: scaffolds a NEW Semi app (Next.js + Tailwind 4 + @semi/ui + starter pages). An existing app is not
// touched: it adopts Semi with /semi-check (the foundation step there installs @semi/ui).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { discoverFrontendApps } from "../../semi-check/scripts/audit.mjs";
import {
  detectPkgManager,
  installedSemiVersion,
  resolveTargetSpec,
  runLocal,
  installPackage,
  nextFontCode,
  semiStyles,
  wireAgentsMd,
  wireGlobalsCss,
  wireNextConfig,
  wireBrand,
  wireSemiLintConfig,
  wireStyle,
  wireProductLook,
} from "./setup.mjs";

function parseArgs(argv) {
  const opts = {
    cwd: process.cwd(),
    staticExport: false,
    appName: "Semi App",
    nextVersion: "latest",
    tailwindVersion: "latest",
    style: null,
    brand: null,
    density: null,
    typeScale: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cwd" && argv[i + 1]) opts.cwd = resolve(argv[++i]);
    else if (a === "--static-export") opts.staticExport = true;
    else if (a === "--app-name" && argv[i + 1]) opts.appName = argv[++i];
    else if (a === "--next-version" && argv[i + 1]) opts.nextVersion = argv[++i];
    else if (a === "--tailwind-version" && argv[i + 1]) opts.tailwindVersion = argv[++i];
    else if (a === "--style" && argv[i + 1]) opts.style = argv[++i];
    else if (a === "--brand" && argv[i + 1]) opts.brand = argv[++i];
    else if (a === "--density" && argv[i + 1]) opts.density = argv[++i];
    else if (a === "--type-scale" && argv[i + 1]) opts.typeScale = argv[++i];
  }
  return opts;
}

function writeNewProjectStarter(webDir, appName, style, guide = null) {
  const fonts = nextFontCode(style);
  const layoutPath = join(webDir, "app", "layout.tsx");
  writeFileSync(
    layoutPath,
    `import type { Metadata } from "next";
${fonts.importLine}
import { ConfirmHost, ThemeProvider, ThemeScript, ToastHost } from "@semi/ui";
import "./globals.css";

// Fonts (${style.name})
${fonts.decls}

export const metadata: Metadata = {
  title: ${JSON.stringify(appName)},
  description: "Built with the Semi Design System (@semi/ui)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="dark" className={\`dark ${fonts.classNames}\`} suppressHydrationWarning>
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
  // The first screen is the brand's, not a template's: headline, text and button come from the brand brief and voice
  // (dist/brand.json) when there is a kit; the agent then builds the real screens from the brand book's applications.
  const g = guide ?? {};
  const first = (x) => (Array.isArray(x) ? x[0] : x);
  const copy = {
    title: g.brief?.tagline ?? `Chào mừng đến với ${appName}`,
    lead: g.brief?.product ?? "Trang đầu tiên của sản phẩm. Thay nó bằng màn hình chính khi đã rõ người dùng đến đây để làm gì.",
    action: first(g.voice?.examples?.button) ?? "Bắt đầu",
    emptyTitle: "Chưa có gì ở đây",
    empty: g.voice?.examples?.empty ?? "Dữ liệu sẽ hiện ở đây khi có. Bắt đầu bằng việc chính của sản phẩm.",
  };
  writeFileSync(
    pagePath,
    `"use client";

import React, { useState } from "react";
import { AppShell, Button, EmptyState, PageTitle, ThemeToggle, type ShellNavSection } from "@semi/ui";

// Starter screen: replace it with the product's main screen (the brand book's "Ứng dụng" tab shows the brand on
// real screens). Keep one main block per screen; avoid the generic AI look (DESIGN_SYSTEM.md §19).
const SECTIONS: ShellNavSection[] = [
  { label: "Ứng dụng", items: [{ id: "home", label: "Tổng quan", shortLabel: "Trang chủ", icon: "grid" }] },
  { label: "Hệ thống", items: [{ id: "settings", label: "Cài đặt", icon: "settings" }] },
];

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("home");
  return (
    <AppShell productName={${JSON.stringify(appName)}} logoIcon="layers" sections={SECTIONS} activeId={activeNav} onSelect={setActiveNav}>
      <div className="flex items-center justify-between gap-4 pb-2">
        <PageTitle title={${JSON.stringify(appName)}} />
        <ThemeToggle />
      </div>
      <div className="@container">
      <section className="rounded-panel border-card bg-panel mb-5">
        <div className="p-6 @2xl:p-10 space-y-4 @2xl:max-w-[60%]">
          <h2 className="font-display font-title text-heading-lg @2xl:text-display leading-tight text-contrast">{${JSON.stringify(copy.title)}}</h2>
          <p className="text-ui-lg text-body">{${JSON.stringify(copy.lead)}}</p>
          <Button variant="primary">{${JSON.stringify(copy.action)}}</Button>
        </div>
      </section>
      <EmptyState title=${JSON.stringify(copy.emptyTitle)} description=${JSON.stringify(copy.empty)} />
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
if (discovered.length) {
  // Existing code: /semi-new-app only scaffolds new apps, so nothing here changes it.
  const apps = discovered.map((dir) => {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return { dir: relative(opts.cwd, dir) || ".", next: deps.next || null, tailwindcss: deps.tailwindcss || null, semiUi: deps["@semi/ui"] || null };
  });
  console.log(JSON.stringify({ existing: true, apps, next: "/semi-check" }, null, 2));
  process.exit(10);
}
const webDir = opts.cwd;
const styles = semiStyles();
if (!opts.brand) opts.style ||= styles.default; // with a brand, its default style once the kit is installed
if (opts.style && !styles.styles.some((s) => s.id === opts.style)) {
  console.error(`--style ${opts.style}: không có style này. Chọn: ${styles.styles.map((s) => s.id).join(", ")}`);
  process.exit(2);
}
const cnaTag = opts.nextVersion && opts.nextVersion !== "keep" ? opts.nextVersion : "latest";
console.log(`Scaffolding new Next.js (${cnaTag}) + Tailwind project in ${webDir}...`);
const create = spawnSync(
  "npx",
  ["--yes", `create-next-app@${cnaTag}`, ".", "--ts", "--tailwind", "--eslint", "--app", "--no-src-dir", "--import-alias", "@/*", "--use-npm", "--yes"],
  { cwd: webDir, stdio: "inherit" },
);
if (create.status !== 0) process.exit(create.status || 1);

// The brand kit first: its "semi" range decides which @semi/ui to install.
let brandPkg = null;
let brandKit = null;
if (opts.brand) {
  console.log(`Installing brand kit (${opts.brand})...`);
  const b = installPackage(webDir, opts.brand);
  const kitFile = b.ok ? join(webDir, "node_modules", ...b.name.split("/"), "dist", "brand.json") : null;
  if (!kitFile || !existsSync(kitFile)) {
    console.error(`${opts.brand}: không cài được hoặc không phải brand kit (thiếu dist/brand.json). Tạo brand kit bằng /semi-brand.`);
    process.exit(2);
  }
  brandPkg = b.name;
  brandKit = JSON.parse(readFileSync(kitFile, "utf8"));
  opts.style ||= brandKit.styles.default;
  if (!brandKit.styles.allowed.includes(opts.style)) {
    console.error(`--style ${opts.style}: brand ${brandKit.name} chỉ cho phép ${brandKit.styles.allowed.join(", ")}`);
    process.exit(2);
  }
}
const { spec } = resolveTargetSpec({ range: brandKit?.semi });

// @semi/ui + semi:lint script (+ a Tailwind version when asked; create-next-app installs the latest)
const pkgPath = join(webDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
(pkg.dependencies ||= {})["@semi/ui"] = spec;
(pkg.scripts ||= {})["semi:lint"] = "semi-lint";
if (opts.tailwindVersion && !["keep", "latest"].includes(opts.tailwindVersion)) {
  pkg.devDependencies ||= {};
  if (pkg.dependencies.tailwindcss) pkg.dependencies.tailwindcss = opts.tailwindVersion;
  else pkg.devDependencies.tailwindcss = opts.tailwindVersion;
  pkg.devDependencies["@tailwindcss/postcss"] = opts.tailwindVersion;
}
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const pm = detectPkgManager(webDir);
console.log(`Installing @semi/ui (${spec}) with ${pm}...`);
const inst = spawnSync(pm, pm === "npm" ? ["install", "--install-links"] : ["install"], { cwd: webDir, stdio: "inherit" });
if (inst.status !== 0) process.exit(inst.status || 1);
const installedVersion = installedSemiVersion(webDir);

wireNextConfig(webDir, opts.staticExport);
// create-next-app's sample CSS (body Arial, --font-sans, --background / --foreground) would override Semi's fonts and
// surfaces; a new app has nothing of its own in it yet, so it starts from Tailwind + the Semi block.
writeFileSync(join(webDir, "app", "globals.css"), `@import "tailwindcss";\n`);
wireGlobalsCss(webDir);
wireSemiLintConfig(webDir);
wireAgentsMd(opts.cwd, installedVersion);
if (brandPkg) {
  const wired = wireBrand(webDir, opts.cwd, brandPkg);
  console.log(wired.message);
  if (!wired.ok) process.exit(2);
}
const chosenStyle = (semiStyles(webDir) || styles).styles.find((s) => s.id === opts.style) ?? styles.styles[0];
// Fonts: the brand's when there is one, else the style's.
writeNewProjectStarter(webDir, opts.appName, brandKit ? { ...chosenStyle, name: brandKit.name, fonts: brandKit.fonts } : chosenStyle, brandKit?.guide);
const styled = wireStyle(webDir, opts.style);
console.log(styled.message);
if (!styled.ok) process.exit(2);
if (opts.density || opts.typeScale) {
  const look = wireProductLook(webDir, { density: opts.density, typeScale: opts.typeScale });
  console.log(look.message);
  if (!look.ok) process.exit(2);
}

console.log("\nRunning verification (semi-lint + tsc + next build)...");
const failed = [
  runLocal(webDir, "semi-lint", []),
  runLocal(webDir, "tsc", ["--noEmit"]),
  spawnSync(pm, ["run", "build"], { cwd: webDir, stdio: "inherit" }),
].some((r) => r.status !== 0);
if (failed) process.exit(1);
console.log(`\nNew Semi app (@semi/ui v${installedVersion}${brandKit ? `, brand ${brandKit.name}` : ""}, style ${opts.style}) created and verified in ${webDir}`);
