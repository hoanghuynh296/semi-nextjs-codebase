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

export function resolveTargetSpec() {
  if (process.env.SEMI_UI_SOURCE) {
    return { spec: process.env.SEMI_UI_SOURCE, version: "0.1.0" };
  }
  const ls = spawnSync("git", ["ls-remote", "--tags", "--refs", REPO_URL], { encoding: "utf8", timeout: 15000 });
  if (ls.status !== 0) {
    console.error(
      "ERROR: Cannot access private repository https://github.com/hoanghuynh296/semi-nextjs-codebase.\n" +
        "Action required: Run `gh auth login && gh auth setup-git` (or configure your GitHub SSH key), then run the command again.",
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

export function findGlobalsCss(webDir) {
  const candidates = [
    join(webDir, "app", "globals.css"),
    join(webDir, "src", "app", "globals.css"),
    join(webDir, "styles", "globals.css"),
  ];
  return candidates.find((p) => existsSync(p)) || candidates[0];
}

export function wireGlobalsCss(webDir) {
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
  const args = pm === "npm" ? ["install", "--install-links"] : ["add", `@semi/ui@${spec}`];
  const res = spawnSync(pm, args, { cwd: appDir, stdio: "inherit" });
  return res.status === 0;
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
