// Setup steps shared by /semi-init (new app), /semi-fix (foundation of an existing app) and /semi-update. Each step
// only adds what is missing and can run again safely.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const REPO_URL = "https://github.com/hoanghuynh296/semi-nextjs-codebase.git";
const GITHUB_SPEC_BASE = "github:hoanghuynh296/semi-nextjs-codebase";

export function detectPkgManager(cwd) {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

/** "1.2.3" vs "1.10.0" → -1 / 0 / 1 (a leading "v" is ignored). */
export function cmpSemver(a, b) {
  const pa = String(a).replace(/^v/, "").split(".").map(Number);
  const pb = String(b).replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0) ? -1 : 1;
  return 0;
}

/** Does version satisfy "^1.2.0" / "~1.2.0" / "1.2.0" (caret on 0.x pins the minor, as npm does)? */
export function satisfies(version, range) {
  if (!range) return true;
  const m = String(range).trim().match(/^([\^~]?)(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!m) return true;
  const [maj, min, pat] = [+m[2], +m[3], +(m[4] || 0)];
  const v = String(version).replace(/^v/, "").split(".").map(Number);
  if (cmpSemver(version, `${maj}.${min}.${pat}`) < 0) return false;
  if (m[1] === "^") return maj > 0 ? v[0] === maj : min > 0 ? v[0] === 0 && v[1] === min : v[0] === 0 && v[1] === 0 && v[2] === pat;
  if (m[1] === "~") return v[0] === maj && v[1] === min;
  return cmpSemver(version, `${maj}.${min}.${pat}`) === 0;
}

/** Release tags (vX.Y.Z) of a git repo, oldest first; null when the repo cannot be reached. */
export function gitTags(url) {
  const ls = spawnSync("git", ["ls-remote", "--tags", "--refs", url], { encoding: "utf8", timeout: 15000 });
  if (ls.status !== 0) return null;
  return (ls.stdout || "")
    .split(/\r?\n/)
    .map((l) => l.split("refs/tags/")[1])
    .filter((t) => t && /^v?\d+\.\d+\.\d+$/.test(t))
    .sort(cmpSemver);
}

/** github:owner/repo[#ref] → { url, base, ref }; null for other specs (file:, npm names). */
export function parseGithubSpec(spec) {
  const m = String(spec).match(/^(?:github:)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:#(.+))?$/);
  if (!m || String(spec).startsWith("file:") || String(spec).startsWith(".")) return null;
  return { url: `https://github.com/${m[1]}/${m[2]}.git`, base: `github:${m[1]}/${m[2]}`, ref: m[3] ?? null };
}

/**
 * The @semi/ui spec to install: the latest release tag, or the latest one inside `range` (a brand kit's "semi") when
 * given. SEMI_UI_SOURCE overrides it (local checkouts, tests).
 */
export function resolveTargetSpec({ range } = {}) {
  if (process.env.SEMI_UI_SOURCE) {
    return { spec: process.env.SEMI_UI_SOURCE, version: "0.1.0" };
  }
  const tags = gitTags(REPO_URL);
  if (!tags) {
    console.error(
      "ERROR: Cannot access private repository https://github.com/hoanghuynh296/semi-nextjs-codebase.\n" +
        "Action required: Run `gh auth login && gh auth setup-git` (or configure your GitHub SSH key), then run the command again.",
    );
    process.exit(2);
  }
  const fitting = range ? tags.filter((t) => satisfies(t, range)) : tags;
  const latest = fitting[fitting.length - 1] || tags[tags.length - 1] || "v0.1.0";
  const newest = tags[tags.length - 1];
  return { spec: `${GITHUB_SPEC_BASE}#${latest}`, version: latest.replace(/^v/, ""), newest: newest?.replace(/^v/, ""), limited: Boolean(range && latest !== newest) };
}

export function findGlobalsCss(webDir) {
  const candidates = [
    join(webDir, "app", "globals.css"),
    join(webDir, "src", "app", "globals.css"),
    join(webDir, "styles", "globals.css"),
  ];
  return candidates.find((p) => existsSync(p)) || candidates[0];
}

export function wireGlobalsCss(webDir, brandPkg = readBrand(webDir)?.pkg ?? null) {
  const cssPath = findGlobalsCss(webDir);
  mkdirSync(dirname(cssPath), { recursive: true });
  const relNodeModules = relative(dirname(cssPath), join(webDir, "node_modules", "@semi", "ui"))
    .split(sep)
    .join("/");

  const semiBlock = [
    `/* semi-design-system:start */`,
    `@import "@semi/ui/tokens.css";`,
    `@import "@semi/ui/base.css";`,
    ...(brandPkg ? [`@import "${brandPkg}/dist/brand.css";`] : []),
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

export function wireNextConfig(webDir, staticExport) {
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
    } else {
      // const nextConfig = { … } | export default { … } | module.exports = { … }
      const open = /(nextConfig\s*(?::\s*NextConfig)?\s*=\s*\{|export\s+default\s*\{|module\.exports\s*=\s*\{)/;
      if (open.test(content))
        content = content.replace(open, `$1\n  transpilePackages: ["@semi/ui"],${staticExport && !content.includes("output:") ? `\n  output: "export",` : ""}`);
      else console.warn(`${target}: add transpilePackages: ["@semi/ui"] by hand (config shape not recognised)`);
    }
  }
  if (staticExport || content.includes(`output: "export"`) || content.includes(`output: 'export'`)) {
    content = content.replace(/^\s*(cacheComponents|partialPrefetching)\s*:\s*true\s*,?\s*\r?\n/gm, "");
  }
  writeFileSync(target, content);
  return target;
}

export function wireSemiLintConfig(webDir) {
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

/**
 * The Semi styles ({ default, styles: [{ id, name, description, tokens }] }): those of the @semi/ui installed in
 * appDir when given (null when that version predates styles), else the plugin's copy of tokens/styles.json.
 */
export function semiStyles(appDir) {
  const file = appDir ? join(appDir, "node_modules", "@semi", "ui", "tokens", "styles.json") : join(PLUGIN_ROOT, "skills", "semi-audit", "scripts", "vendor", "styles.json");
  if (appDir && !existsSync(file)) return existsSync(join(appDir, "node_modules", "@semi", "ui")) ? null : semiStyles();
  return JSON.parse(readFileSync(file, "utf8"));
}

/** The root layout of an App Router app (relative path), or null. */
export function findRootLayout(appDir) {
  return ["app/layout.tsx", "src/app/layout.tsx", "app/layout.jsx", "src/app/layout.jsx"].find((f) => existsSync(join(appDir, f))) || null;
}

/** An app's style: what semi-lint.json declares ("style") and what <html data-style> in the root layout applies. */
export function readStyleState(appDir) {
  let cfg = {};
  try {
    cfg = JSON.parse(readFileSync(join(appDir, "semi-lint.json"), "utf8"));
  } catch {}
  const layout = findRootLayout(appDir);
  const html = layout ? readFileSync(join(appDir, layout), "utf8").match(/<html\b[^>]*>/) : null;
  const attr = (name) => (html ? (html[0].match(new RegExp(`\\bdata-${name}=["']([\\w-]+)["']`))?.[1] ?? null) : null);
  // palettes were removed in v0.14.0: a leftover "palette" or data-palette is cleaned up by /semi-fix
  return { declared: cfg.style ?? null, applied: attr("style"), legacyPalette: cfg.palette ?? attr("palette"), layout, hasHtml: Boolean(html) };
}

/** <html …> with data-style replaced by `attrs` (written right after <html). A data-palette left by v0.13 goes too. */
const withStyleAttrs = (tag, attrs) => tag.replace(/\s+data-(?:style|palette)=["'][\w-]*["']/g, "").replace(/^<html\b/, `<html ${attrs}`);

/**
 * Pick a style: "style" in semi-lint.json and data-style on <html> in the root layout (the one place an app sets it).
 * Returns { layout, ok, message }; ok is false for an unknown id or a layout without an <html> tag.
 */
export function wireStyle(appDir, id) {
  const list = semiStyles(appDir);
  if (!list) return { ok: false, message: "@semi/ui đã cài chưa có style: chạy /semi-update trước" };
  const style = list.styles.find((s) => s.id === id);
  if (!style) return { ok: false, message: `style "${id}" không có; chọn: ${list.styles.map((s) => s.id).join(", ")}` };
  const brand = readBrand(appDir)?.kit;
  if (brand && !brand.styles.allowed.includes(id))
    return { ok: false, message: `brand ${brand.name} không cho phép style "${id}" (được phép: ${brand.styles.allowed.join(", ")}); thêm nó trong repo brand bằng /semi-brand` };
  const cfgPath = join(appDir, "semi-lint.json");
  const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
  cfg.style = id;
  delete cfg.palette; // removed in v0.14.0
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");
  const layout = findRootLayout(appDir);
  const src = layout ? readFileSync(join(appDir, layout), "utf8") : "";
  const html = src.match(/<html\b[^>]*>/);
  const attrs = `data-style="${id}"`;
  if (!html) return { ok: false, layout, message: `không thấy thẻ <html> trong ${layout || "app/layout.tsx"}: thêm ${attrs} vào <html> bằng tay` };
  writeFileSync(join(appDir, layout), src.replace(html[0], withStyleAttrs(html[0], attrs)));
  return { ok: true, layout, message: `${layout} ← <html ${attrs}>, semi-lint.json ← "style": "${id}"` };
}

/** next/font code for a style's fonts: { importLine, decls, classNames } (classNames is a template-literal fragment). */
export function nextFontCode(style) {
  const fonts = style.fonts ?? [];
  const id = (f) => f.nextFont.replace(/_(\w)/g, (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toLowerCase());
  return {
    importLine: `import { ${fonts.map((f) => f.nextFont).join(", ")} } from "next/font/google";`,
    decls: fonts
      .map((f) => `const ${id(f)} = ${f.nextFont}({ subsets: ["latin", "vietnamese"], ${f.weight ? `weight: ${JSON.stringify(f.weight)}, ` : ""}variable: "${f.variable}" });`)
      .join("\n"),
    classNames: fonts.map((f) => `\${${id(f)}.variable}`).join(" "),
  };
}

/**
 * Fonts of a style that the root layout does not load (its CSS variable is never named). [] when the app sets its own
 * fonts (--font-sans-family / --font-display-family) or has no layout.
 */
export function missingStyleFonts(appDir, style) {
  const fonts = appFonts(appDir, style);
  const layout = findRootLayout(appDir);
  if (!layout) return [];
  const src = readFileSync(join(appDir, layout), "utf8");
  const css = findGlobalsCss(appDir);
  const own = /--font-(sans|display)-family/.test(src + (existsSync(css) ? readFileSync(css, "utf8") : ""));
  return own && !readBrand(appDir) ? [] : fonts.filter((f) => !src.includes(f.variable));
}

/** Text telling a person how to load the fonts a style needs in the root layout. */
export function styleFontHint(layout, style, fonts = style.fonts) {
  const code = nextFontCode({ ...style, fonts });
  return [
    `sửa tay ${layout}: tải font của style ${style.name} (giữ nguyên phần còn lại):`,
    `  ${code.importLine}`,
    ...code.decls.split("\n").map((l) => `  ${l}`),
    `  <html className={\`… ${code.classNames}\`}>  (thêm biến font vào className của <html>; font cũ của style trước có thể bỏ)`,
  ].join("\n");
}

// ---- Brand kits (docs/BRANDS.md) -------------------------------------------------------------------------------

/** The app's brand kit: { pkg, dir, kit } from "brand" in semi-lint.json and node_modules/<pkg>/dist/brand.json.
 * kit is null when the package is declared but not installed; the whole result is null without a brand. */
export function readBrand(appDir) {
  let pkg = null;
  try {
    pkg = JSON.parse(readFileSync(join(appDir, "semi-lint.json"), "utf8")).brand ?? null;
  } catch {}
  if (!pkg) return null;
  const dir = join(appDir, "node_modules", ...pkg.split("/"));
  const file = join(dir, "dist", "brand.json");
  return { pkg, dir, kit: existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null };
}

/** Fonts the app loads: the brand's when it has one, else the style's. */
export function appFonts(appDir, style) {
  const b = readBrand(appDir);
  return b?.kit ? b.kit.fonts : style?.fonts ?? [];
}

/**
 * Install a package by spec (github:owner/repo[#tag], file:../dir) and return its name. A github spec without a tag
 * gets the repo's latest release tag. npm installs links as copies (--install-links), like @semi/ui.
 */
export function installPackage(appDir, spec) {
  const gh = parseGithubSpec(spec);
  let resolved = spec;
  if (gh && !gh.ref) {
    const tags = gitTags(gh.url);
    if (tags?.length) resolved = `${gh.base}#${tags[tags.length - 1]}`;
  }
  const pkgPath = join(appDir, "package.json");
  const before = JSON.parse(readFileSync(pkgPath, "utf8"));
  const pm = detectPkgManager(appDir);
  const args = pm === "npm" ? ["install", "--install-links", resolved] : ["add", resolved];
  const res = spawnSync(pm, args, { cwd: appDir, stdio: "inherit" });
  if (res.status !== 0) return { ok: false, spec: resolved };
  const after = JSON.parse(readFileSync(pkgPath, "utf8"));
  const deps = { ...after.dependencies };
  const name = Object.keys(deps).find((k) => deps[k] !== before.dependencies?.[k]) ?? Object.keys(deps).find((k) => deps[k] === resolved);
  return { ok: Boolean(name), name, spec: resolved };
}

/** Write the brand's rules block (AGENTS.brand.md of the kit) into AGENTS.md, replacing an older one. */
export function wireBrandAgents(rootDir, kitDir) {
  const src = join(kitDir, "AGENTS.brand.md");
  if (!existsSync(src)) return null;
  const blockText = readFileSync(src, "utf8").trim();
  const agentsPath = join(rootDir, "AGENTS.md");
  let content = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : "";
  content = content.includes("<!-- semi-brand:start -->")
    ? content.replace(/<!-- semi-brand:start -->[\s\S]*?<!-- semi-brand:end -->/, blockText)
    : `${content.trimEnd()}\n\n${blockText}\n`;
  writeFileSync(agentsPath, content.trimStart());
  return agentsPath;
}

/**
 * Use an installed brand kit: "brand" in semi-lint.json, the kit's brand.css in the Semi CSS block, its rules in
 * AGENTS.md. The style must be one the brand allows (wireStyle checks it). Returns { ok, message }.
 */
export function wireBrand(appDir, rootDir, pkg) {
  const dir = join(appDir, "node_modules", ...pkg.split("/"));
  if (!existsSync(join(dir, "dist", "brand.json"))) return { ok: false, message: `${pkg} chưa cài hoặc không phải brand kit (thiếu dist/brand.json)` };
  const cfgPath = join(appDir, "semi-lint.json");
  const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
  cfg.brand = pkg;
  delete cfg.palette; // removed in v0.14.0; the brand sets the neutrals
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");
  const css = wireGlobalsCss(appDir, pkg);
  wireBrandAgents(rootDir, dir);
  return { ok: true, message: `${relative(appDir, css)} ← @import "${pkg}/dist/brand.css", semi-lint.json ← "brand": "${pkg}", AGENTS.md ← luật của brand` };
}

export function wireAgentsMd(rootDir, version) {
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


/** Version of @semi/ui installed in appDir (node_modules), else the tag in package.json, else null. */
export function installedSemiVersion(appDir) {
  try {
    return JSON.parse(readFileSync(join(appDir, "node_modules", "@semi", "ui", "package.json"), "utf8")).version;
  } catch {
    const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
    const s = pkg.dependencies?.["@semi/ui"] || pkg.devDependencies?.["@semi/ui"] || "";
    return s.match(/#v?(\d+\.\d+\.\d+)/)?.[1] || null;
  }
}

/** Point package.json at spec (adds the semi:lint script) and install. Never touches next / tailwindcss. */
export function installSemiUi(appDir, spec) {
  const pkgPath = join(appDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (pkg.devDependencies?.["@semi/ui"]) pkg.devDependencies["@semi/ui"] = spec;
  else (pkg.dependencies ||= {})["@semi/ui"] = spec;
  (pkg.scripts ||= {})["semi:lint"] = "semi-lint";
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  const pm = detectPkgManager(appDir);
  // Name the package: a bare `npm install` keeps the commit package-lock.json already has for a git dependency, so an
  // upgrade to a new tag would silently stay on the old one.
  const dev = Boolean(pkg.devDependencies?.["@semi/ui"]);
  const args = pm === "npm" ? ["install", "--install-links", ...(dev ? ["-D"] : []), `@semi/ui@${spec}`] : ["add", ...(dev ? ["-D"] : []), `@semi/ui@${spec}`];
  const res = spawnSync(pm, args, { cwd: appDir, stdio: "inherit" });
  if (res.status !== 0) return false;
  // Say it plainly when the installed version is not the one asked for (a stale lock or cache).
  const want = String(spec).match(/#v?(\d+\.\d+\.\d+)$/)?.[1];
  const got = installedSemiVersion(appDir);
  if (want && got && got !== want) {
    console.error(`@semi/ui: đã cài ${got} nhưng cần ${want}. Xoá node_modules/@semi rồi chạy lại.`);
    return false;
  }
  return true;
}

/** Run a CLI installed in the app (node_modules/.bin), never a same-named package fetched by npx. */
export function runLocal(appDir, bin, args) {
  const p = join(appDir, "node_modules", ".bin", process.platform === "win32" ? `${bin}.cmd` : bin);
  if (!existsSync(p)) {
    console.log(`(${bin} is not installed in ${appDir}: skipped)`);
    return { status: 0, skipped: true };
  }
  return spawnSync(p, args, { cwd: appDir, stdio: "inherit" });
}
