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
    kind: "app",
    theme: null,
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
    else if (a === "--kind" && argv[i + 1]) opts.kind = argv[++i];
    else if (a === "--theme" && argv[i + 1]) opts.theme = argv[++i];
  }
  return opts;
}

/** What kind of product it is: its usual density / type scale, default theme and first screen. */
const KINDS = {
  tool: { density: "compact", typeScale: null, theme: "system", frame: "shell" }, // used all day: dashboard, management
  app: { density: null, typeScale: null, theme: "system", frame: "shell" }, // an everyday app
  store: { density: "airy", typeScale: null, theme: "light", frame: "site" }, // a shop, consumer web
  landing: { density: "airy", typeScale: "contrast", theme: "light", frame: "site" }, // marketing, introduction
};
const THEMES = ["light", "dark", "system"];

/**
 * The layout and the first screen, from the brand (brief, sample, voice, logo) and the kind of product: a tool or app
 * opens in AppShell with its main figure and list; a store or landing page opens as a site with a top bar, a hero and
 * proof. The agent then builds the real screens from the brand book's Ứng dụng page.
 */
function writeNewProjectStarter(webDir, { appName, style, guide = null, kind = "app", theme = "system", brandPkg = null }) {
  const fonts = nextFontCode(style);
  const g = guide ?? {};
  const first = (x) => (Array.isArray(x) ? x[0] : x);
  const sample = g.brief?.sample ?? {};
  // A site's top bar shows the full logo; the app sidebar sits next to the product name, so it takes the square mark.
  const logoFile = g.logo?.fullDist && brandPkg ? `${brandPkg}/${g.logo.fullDist}` : null;
  const markFile = g.logo?.markDist && brandPkg ? `${brandPkg}/${g.logo.markDist}` : null;
  const initial = theme === "light" ? "light" : "dark"; // "system" is resolved by ThemeScript before paint
  writeFileSync(
    join(webDir, "app", "layout.tsx"),
    `import type { Metadata } from "next";
${fonts.importLine}
import { ConfirmHost, TaskHost, ThemeProvider, ThemeScript, ToastHost } from "@semi/ui";
import "./globals.css";

// Fonts (${style.name})
${fonts.decls}

export const metadata: Metadata = {
  title: ${JSON.stringify(appName)},
  description: ${JSON.stringify(g.brief?.product ?? g.brief?.tagline ?? appName)},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="${initial}" className={\`${initial} ${fonts.classNames}\`} suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="${theme}" />
      </head>
      <body className="bg-app text-body font-sans antialiased min-h-screen">
        <ThemeProvider defaultTheme="${theme}">
          {children}
          <ConfirmHost />
          <ToastHost />
          <TaskHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
`,
  );

  const copy = {
    title: g.brief?.tagline ?? `Chào mừng đến với ${appName}`,
    lead: g.brief?.product ?? "Trang đầu tiên của sản phẩm. Thay nó bằng màn hình chính khi đã rõ người dùng đến đây để làm gì.",
    action: first(g.voice?.examples?.button) ?? "Bắt đầu",
    list: sample.list ?? "Danh sách",
    items: sample.items ?? [],
    metric: sample.metric ?? null,
    proof: sample.proof ?? sample.metric ?? null,
    empty: g.voice?.examples?.empty ?? "Chưa có gì ở đây. Bắt đầu bằng việc chính của sản phẩm.",
  };
  const J = JSON.stringify;
  const shell = KINDS[kind].frame === "shell";
  const logoSrc = shell ? markFile : logoFile;
  const logoImport = logoSrc ? `import Image from "next/image";\nimport logo from ${J(logoSrc)};\n` : "";
  const logoEl = logoSrc ? (shell ? `<Image src={logo} alt="" unoptimized className="h-6 w-6" />` : `<Image src={logo} alt=${J(appName)} unoptimized className="h-6 w-auto" />`) : null;
  const header = `// Starter screen from the brand kit (brief, sample, voice): replace it with the product's main screen; the brand
// book's Ứng dụng page shows the brand on real screens. One main block per screen (DESIGN_SYSTEM.md §19).`;

  let page;
  if (shell) {
    const main = copy.metric
      ? `      <div className="grid gap-3 @2xl:grid-cols-[2fr_3fr] items-start">
        {/* featured spans two grid columns: the wrapper keeps it in its own column */}
        <div>
          <KpiCard featured label={${J(copy.metric.label)}} value={${J(copy.metric.value)}}${copy.metric.sub ? ` sub={${J(copy.metric.sub)}}` : ""} />
        </div>
        ${copy.items.length ? `<Card className="divide-y divide-divider">
          {${J(copy.items)}.map((item) => (
            <div key={item} className="px-4 py-3 text-ui text-contrast truncate">
              {item}
            </div>
          ))}
        </Card>` : `<EmptyState title=${J(copy.list)} description={${J(copy.empty)}} />`}
      </div>`
      : `      <section className="rounded-panel border-card bg-panel">
        <div className="p-6 @2xl:p-10 space-y-4 @2xl:max-w-2xl">
          <h2 className="font-display font-title text-heading-lg @2xl:text-display leading-tight text-contrast">{${J(copy.title)}}</h2>
          <p className="text-ui-lg text-body">{${J(copy.lead)}}</p>
          <Button variant="primary">{${J(copy.action)}}</Button>
        </div>
      </section>
      <EmptyState title=${J(copy.list)} description={${J(copy.empty)}} />`;
    page = `"use client";

import React, { useState } from "react";
${logoImport}import { AppShell, Button, Card, EmptyState, KpiCard, PageTitle, ThemeToggle, type ShellNavSection } from "@semi/ui";

${header}
const SECTIONS: ShellNavSection[] = [
  { label: "Ứng dụng", items: [{ id: "home", label: "Tổng quan", shortLabel: "Trang chủ", icon: "grid" }, { id: "list", label: ${J(copy.list)}, icon: "box" }] },
  { label: "Hệ thống", items: [{ id: "settings", label: "Cài đặt", icon: "settings" }] },
];

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("home");
  return (
    <AppShell
      productName={${J(appName)}}
      ${logoEl ? `logo={${logoEl}}` : `logoIcon="layers"`}
      sections={SECTIONS}
      activeId={activeNav}
      onSelect={setActiveNav}
      footer={() => <ThemeToggle />}
    >
      <PageTitle title={${J(appName)}} />
      <div className="@container space-y-5">
${main}
      </div>
    </AppShell>
  );
}
`;
  } else {
    const items = copy.items.length
      ? `
        <section className="space-y-4">
          <h2 className="font-display font-title text-heading text-contrast">{${J(copy.list)}}</h2>
          <div className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
            {${J(copy.items)}.map((item) => (
              <Card key={item} interactive className="p-4 flex items-center gap-3">
                <span className="text-title font-medium text-contrast min-w-0 truncate">{item}</span>
                <span className="ml-auto text-label text-accent-fg font-medium shrink-0">Xem</span>
              </Card>
            ))}
          </div>
        </section>`
      : "";
    const proof = copy.proof
      ? `
          <div className="rounded-panel bg-accent-subtle p-6 @3xl:p-8 flex flex-col justify-center gap-2 min-h-48">
            <div className="font-figure font-title text-display tabular-nums leading-none text-contrast">{${J(copy.proof.value)}}</div>
            <div className="text-ui-lg text-body">{${J(copy.proof.label)}}</div>
          </div>`
      : "";
    page = `${logoImport}import { Button, Card, ThemeToggle } from "@semi/ui";

${header}
export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-canvas">
        <div className="px-4 sm:px-8 h-14 flex items-center gap-3">
          ${logoEl ?? `<span className="font-display font-title text-title-lg text-contrast">{${J(appName)}}</span>`}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="primary">{${J(copy.action)}}</Button>
          </div>
        </div>
      </header>
      <main className="@container px-4 sm:px-8 py-10 space-y-12">
        <section className={\`grid gap-8 items-center ${copy.proof ? "@3xl:grid-cols-[3fr_2fr]" : ""}\`}>
          <div className="space-y-4">
            <h1 className="font-display font-title text-heading-lg @3xl:text-display leading-tight text-contrast">{${J(copy.title)}}</h1>
            <p className="text-ui-lg text-body max-w-xl">{${J(copy.lead)}}</p>
            <Button variant="primary">{${J(copy.action)}}</Button>
          </div>${proof}
        </section>${items}
      </main>
    </div>
  );
}
`;
  }
  writeFileSync(join(webDir, "app", "page.tsx"), page);
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
if (!KINDS[opts.kind]) {
  console.error(`--kind ${opts.kind}: chọn ${Object.keys(KINDS).join(", ")}`);
  process.exit(2);
}
if (opts.theme && !THEMES.includes(opts.theme)) {
  console.error(`--theme ${opts.theme}: chọn ${THEMES.join(", ")}`);
  process.exit(2);
}
// The kind of product sets the usual density, type scale and theme; explicit flags win.
opts.density ??= KINDS[opts.kind].density;
opts.typeScale ??= KINDS[opts.kind].typeScale;
opts.theme ??= KINDS[opts.kind].theme;
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
writeNewProjectStarter(webDir, {
  appName: opts.appName,
  style: brandKit ? { ...chosenStyle, name: brandKit.name, fonts: brandKit.fonts } : chosenStyle,
  guide: brandKit?.guide,
  kind: opts.kind,
  theme: opts.theme,
  brandPkg,
});
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
console.log(`\nNew Semi app (@semi/ui v${installedVersion}${brandKit ? `, brand ${brandKit.name}` : ""}, style ${opts.style}, ${opts.kind}, theme ${opts.theme}) created and verified in ${webDir}`);
