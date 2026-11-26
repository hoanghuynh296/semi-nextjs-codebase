// node --test lint/test — /semi-check issue list, semi-check.md and the /semi-check loop on a throwaway app.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditFileState, auditProject, formatSummary, totals, writeAuditFile } from "../../plugin/skills/semi-check/scripts/audit.mjs";
import { wireAgentsMd } from "../../plugin/skills/semi-new-app/scripts/setup.mjs";

const FIX = new URL("../../plugin/skills/semi-check/scripts/fix.mjs", import.meta.url).pathname;
const LOOK = new URL("../../plugin/skills/semi-new-app/scripts/look.mjs", import.meta.url).pathname;
const LAYOUT = `export default function L({ children }) {\n  return (\n    <html lang="vi" suppressHydrationWarning>\n      <body>{children}</body>\n    </html>\n  );\n}\n`;

function app() {
  const root = mkdtempSync(join(tmpdir(), "semi-audit-"));
  const web = join(root, "web");
  mkdirSync(join(web, "app"), { recursive: true });
  writeFileSync(join(web, "package.json"), JSON.stringify({ scripts: { lint: "semi-lint && eslint" }, dependencies: { next: "16.0.0", react: "19.0.0", "@semi/ui": "x" }, devDependencies: { tailwindcss: "^4.1.0" } }));
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  writeFileSync(join(root, ".github", "workflows", "semi.yml"), "name: Semi\n");
  writeFileSync(join(web, "next.config.mjs"), `const nextConfig = { transpilePackages: ["@semi/ui"] };\nexport default nextConfig;\n`);
  writeFileSync(join(web, "app/globals.css"), `@import "tailwindcss";\n@import "@semi/ui/tokens.css";\n`);
  writeFileSync(
    join(web, "app/page.tsx"),
    `export default function Page() {\n  return <main className="bg-white text-slate-900"><h1 className="font-bold">T</h1><table />{[1].map((i) => i)}</main>;\n}\n`,
  );
  return { root, web };
}

test("an app without Semi starts at the foundation phase", () => {
  const root = mkdtempSync(join(tmpdir(), "semi-audit-"));
  mkdirSync(join(root, "app"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ dependencies: { next: "16.0.0", react: "19.0.0" }, devDependencies: { tailwindcss: "^4.1.0" } }));
  writeFileSync(join(root, "app/layout.tsx"), `export default function L({ children }) { return <html><body>{children}</body></html>; }\n`);
  const issues = auditProject(root).apps[0].issues;
  assert.deepEqual(
    issues.filter((i) => i.phase === "foundation").map((i) => i.check),
    ["semi-ui", "transpile", "semi-css", "semi-lint-config", "semi-gate", "providers", "fonts"],
  );
  assert.equal(issues[0].phase, "foundation");
  rmSync(root, { recursive: true });
});

test("a second Tailwind build (#184): Semi's CSS in its own sheet next to the app's tailwindcss is a foundation item; the scoped entry is not", () => {
  const { root, web } = app();
  writeFileSync(join(web, "app/globals.css"), `@import "tailwindcss";\n@theme { --color-primary: red; }\n`);
  mkdirSync(join(web, "app/(semi)"));
  const sheet = join(web, "app/(semi)/semi.css");
  writeFileSync(sheet, `@import "tailwindcss";\n@import "@semi/ui/tokens.css";\n@import "@semi/ui/base.css";\n@source "./";\n`);
  let found = auditProject(root).apps[0].issues.filter((i) => i.phase === "foundation");
  const item = found.find((i) => i.check === "second-build");
  assert.ok(item, "second-build is reported");
  assert.equal(item.file, "app/(semi)/semi.css");
  assert.equal(item.kind, "manual");
  assert.match(item.what, /second Tailwind build: Semi utilities share @layer utilities with the app's \(app\/globals\.css\)/);
  assert.match(item.fix, /@semi\/ui\/scoped\.css/);
  // Semi's CSS is in the app, only not in globals.css: no "semi-css" item (fix.mjs would wire globals.css)
  assert.ok(!found.some((i) => i.check === "semi-css"));
  // the scoped entry is the supported staged setup: nothing to report
  writeFileSync(sheet, `@import "@semi/ui/scoped.css";\n@source "./";\n`);
  found = auditProject(root).apps[0].issues.filter((i) => i.phase === "foundation");
  assert.ok(!found.some((i) => i.check === "second-build" || i.check === "semi-css"));
  // one build (Semi in globals.css): nothing to report either
  rmSync(join(web, "app/(semi)"), { recursive: true });
  writeFileSync(join(web, "app/globals.css"), `@import "tailwindcss";\n@import "@semi/ui/tokens.css";\n@import "@semi/ui/base.css";\n`);
  found = auditProject(root).apps[0].issues.filter((i) => i.phase === "foundation");
  assert.ok(!found.some((i) => i.check === "second-build" || i.check === "semi-css"));
  rmSync(root, { recursive: true });
});

test("detail and list pages: only list pages need a SubpageToolbar; AppHeader counts as a Semi frame", () => {
  const { root, web } = app();
  mkdirSync(join(web, "app/about"));
  writeFileSync(join(web, "app/about/page.tsx"), `export default function A() { return <p>x</p>; }\n`);
  writeFileSync(join(web, "app/list.tsx"), `import { AppHeader } from "@semi/ui";\nexport const H = () => <AppHeader title="x" />;\n`);
  const checks = auditProject(root).apps[0].issues.map((i) => `${i.check}:${i.file}`);
  assert.ok(!checks.includes("subpage-toolbar:app/about/page.tsx"));
  assert.ok(!checks.some((c) => c.startsWith("app-shell:")));
  rmSync(root, { recursive: true });
});

test("a list page on the StickyContextBar anatomy needs no SubpageToolbar (#115)", () => {
  const { root, web } = app();
  mkdirSync(join(web, "app/orders"));
  writeFileSync(
    join(web, "app/orders/page.tsx"),
    `import { PageTitle, StickyContextBar, SearchPill } from "@semi/ui";\nexport default function O({ rows }) { return <><PageTitle title="x" /><StickyContextBar><SearchPill /></StickyContextBar><ul>{rows.map((r) => <li key={r}>{r}</li>)}</ul></>; }\n`,
  );
  const checks = auditProject(root).apps[0].issues.map((i) => `${i.check}:${i.file}`);
  assert.ok(!checks.includes("subpage-toolbar:app/orders/page.tsx"));
  rmSync(root, { recursive: true });
});

test("issues are sorted into decisions, hand fixes and codemod fixes with file:line", () => {
  const { root } = app();
  const r = auditProject(root);
  const issues = r.apps[0].issues;
  assert.ok(issues.some((i) => i.kind === "decision" && i.check === "tables" && i.file === "app/page.tsx"));
  assert.ok(issues.some((i) => i.kind === "manual" && i.rule === "font-weight" && i.line === 2));
  assert.ok(issues.some((i) => i.kind === "auto" && i.from === "bg-white" && i.to === "bg-panel" && i.line === 2));
  const path = writeAuditFile(r, root);
  const md = readFileSync(path, "utf8");
  assert.match(md, /^<!-- semi-audit /);
  assert.match(md, /L2 `font-weight`/);
  assert.equal(auditFileState(root).fresh, true);
  rmSync(root, { recursive: true });
});

test("semi-check.md goes stale when the code changes", () => {
  const { root, web } = app();
  writeAuditFile(auditProject(root), root);
  writeFileSync(join(web, "app/page.tsx"), readFileSync(join(web, "app/page.tsx"), "utf8") + "// edit\n");
  assert.equal(auditFileState(root).fresh, false);
  rmSync(root, { recursive: true });
});

test("keep in semi-lint.json silences a structural check", () => {
  const { root, web } = app();
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app"], keep: { tables: "reports", "app-shell": ["app/"], "subpage-toolbar": "single page" } }));
  const a = auditProject(root).apps[0];
  assert.ok(!a.issues.some((i) => i.check === "tables"));
  assert.ok(a.kept.some((k) => k.check === "tables" && k.reason === "reports"));
  rmSync(root, { recursive: true });
});

test("fix --codemod then a clean --verify deletes semi-check.md", () => {
  const { root, web } = app();
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app"], keep: { tables: "x", "app-shell": "x", "subpage-toolbar": "x" } }));
  writeFileSync(join(web, "app/layout.tsx"), `// fonts: --font-geist\n` + LAYOUT.replace("<body>", "<body><ThemeProvider>").replace("</body>", "</ThemeProvider></body>"));
  // The agent rules are wired (AGENTS.md block + CLAUDE.md importing it), so only the code is left to fix.
  writeFileSync(join(web, "AGENTS.md"), "<!-- semi-design-system:start -->\n# Semi\n<!-- semi-design-system:end -->\n");
  writeFileSync(join(web, "CLAUDE.md"), "@AGENTS.md\n");
  writeAuditFile(auditProject(root), root);
  execFileSync("node", [FIX, "--cwd", root, "--codemod"]);
  assert.match(readFileSync(join(web, "app/page.tsx"), "utf8"), /bg-panel text-strong/);
  writeFileSync(join(web, "app/page.tsx"), readFileSync(join(web, "app/page.tsx"), "utf8").replace("font-bold", "font-semibold"));
  execFileSync("node", [FIX, "--cwd", root, "--verify"]);
  assert.equal(totals(auditProject(root)).total, 0);
  assert.equal(existsSync(join(root, "semi-check.md")), false);
  rmSync(root, { recursive: true });
});

test("one look: a style / palette left from before 1.0 is an audit issue, foundation removes it, look.mjs sets the density", () => {
  const { root, web } = app();
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app"], style: "soft", palette: "olive" }));
  writeFileSync(join(web, "app/layout.tsx"), LAYOUT.replace("<html ", '<html data-style="soft" data-palette="olive" '));
  const issue = (check) => auditProject(root).apps[0].issues.find((i) => i.check === check);
  assert.match(issue("legacy-look").what, /style "soft"/);
  const out = execFileSync("node", [FIX, "--cwd", root, "foundation"], { encoding: "utf8" });
  assert.match(readFileSync(join(web, "app/layout.tsx"), "utf8"), /<html lang="vi" suppressHydrationWarning>/);
  const cfg = JSON.parse(readFileSync(join(web, "semi-lint.json"), "utf8"));
  assert.equal(cfg.style, undefined);
  assert.equal(cfg.palette, undefined);
  assert.equal(issue("legacy-look"), undefined);
  // Semi's font (Geist) is printed for the layout, and the audit asks for it until the layout loads it.
  assert.match(out, /import \{ Geist \} from "next\/font\/google"/);
  assert.match(issue("fonts").what, /Geist/);
  writeFileSync(join(web, "app/layout.tsx"), readFileSync(join(web, "app/layout.tsx"), "utf8").replace("<html ", "<html className={geist.variable /* --font-geist */} "));
  assert.equal(issue("fonts"), undefined);
  // The product's density / type scale stay a choice of the app.
  execFileSync("node", [LOOK, "--cwd", root, "--density", "compact"], { stdio: "pipe" });
  assert.match(readFileSync(join(web, "app/layout.tsx"), "utf8"), /<html data-density="compact"/);
  assert.match(execFileSync("node", [LOOK, "--cwd", root], { encoding: "utf8" }), /density compact, type scale even/);
  rmSync(root, { recursive: true });
});

test("brand kit in a product: the audit asks to wire it, foundation wires it, only the brand's fonts count", () => {
  const { root, web } = app();
  // A built kit, as if installed from github:3dnoobs/brand.
  const kit = join(web, "node_modules", "@3dnoobs", "brand");
  mkdirSync(kit, { recursive: true });
  writeFileSync(join(kit, "package.json"), JSON.stringify({ name: "@3dnoobs/brand", version: "1.0.0" }));
  writeFileSync(join(kit, "brand.json"), JSON.stringify({ name: "3D Noobs", package: "@3dnoobs/brand", primary: "#00AE42", fonts: { sans: "Inter" } }));
  execFileSync("node", [new URL("../../brand/cli.mjs", import.meta.url).pathname, "build"], { cwd: kit });
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app"], brand: "@3dnoobs/brand", keep: { tables: "x", "app-shell": "x", "subpage-toolbar": "x" } }));
  writeFileSync(join(web, "app/layout.tsx"), LAYOUT.replace("<body>", "<body><ThemeProvider>").replace("</body>", "</ThemeProvider></body>"));
  const issue = (check) => auditProject(root).apps[0].issues.find((i) => i.check === check);
  assert.match(issue("brand").what, /brand\.css.*AGENTS\.md/);
  let out;
  try {
    out = execFileSync("node", [FIX, "--cwd", root, "foundation"], { encoding: "utf8" });
  } catch (e) {
    throw new Error(e.stdout + e.stderr);
  }
  assert.match(readFileSync(join(web, "app/globals.css"), "utf8"), /@import "@3dnoobs\/brand\/dist\/brand\.css";/);
  assert.match(readFileSync(join(root, "AGENTS.md"), "utf8"), /<!-- semi-brand:start -->[\s\S]*3D Noobs/);
  assert.doesNotMatch(readFileSync(join(web, "app/layout.tsx"), "utf8"), /data-style/);
  assert.match(out, /import \{ Inter \} from "next\/font\/google"/); // the brand's font, not Semi's Geist
  assert.equal(issue("brand"), undefined);
  assert.match(issue("fonts").what, /Inter của brand 3D Noobs/);
  rmSync(root, { recursive: true });
});

test("agent rules: the audit asks for the Semi block in AGENTS.md and CLAUDE.md importing it; foundation writes both", () => {
  const { root, web } = app();
  const issue = () => auditProject(root).apps[0].issues.find((i) => i.check === "agent-rules");
  assert.match(issue().what, /AGENTS\.md[\s\S]*CLAUDE\.md/);
  writeFileSync(join(web, "CLAUDE.md"), "# Notes of this app\n");
  wireAgentsMd(web, "0.19.0");
  assert.match(readFileSync(join(web, "AGENTS.md"), "utf8"), /<!-- semi-design-system:start -->/);
  const claude = readFileSync(join(web, "CLAUDE.md"), "utf8");
  assert.match(claude, /^@AGENTS\.md\n/);
  assert.match(claude, /# Notes of this app/); // the app's own text stays
  wireAgentsMd(web, "0.19.0");
  assert.equal(readFileSync(join(web, "CLAUDE.md"), "utf8"), claude); // once
  assert.equal(issue(), undefined);
  rmSync(root, { recursive: true });
});

test("discovery skips git-ignored folders and nested repositories; --include brings one back (issue #14)", () => {
  const { root, web } = app();
  execFileSync("git", ["init", "-q", root]);
  writeFileSync(join(root, ".gitignore"), "_scratch/\n");
  for (const dir of ["_scratch/copy/web", "data/editor"]) {
    mkdirSync(join(root, dir, "app"), { recursive: true });
    cpSync(join(web, "package.json"), join(root, dir, "package.json"));
  }
  mkdirSync(join(root, "data/editor/.git"));
  const r = auditProject(root);
  assert.deepEqual(r.apps.map((a) => a.cwd), [web]);
  assert.deepEqual(r.skipped, [{ dir: "_scratch", reason: "git-ignored" }, { dir: join("data", "editor"), reason: "nested-repo" }]);
  assert.equal(auditProject(root, { include: ["data/editor"] }).apps.length, 2);
  const out = execFileSync("node", [new URL("../../plugin/skills/semi-check/scripts/audit.mjs", import.meta.url).pathname, "--cwd", root, "--no-write"], { encoding: "utf8" });
  assert.match(out, /Bỏ qua repo con: `data\/editor`/);
  rmSync(root, { recursive: true });
});

test("tokens: --dry-run writes nothing, --theme overrides the audit, unknown theme stops (issue #11, #12)", () => {
  const { root, web } = app();
  writeFileSync(join(web, "app/page.tsx"), `export default function Page() {\n  return <main className="bg-white bg-slate-900 text-slate-300">x</main>;\n}\n`);
  const page = () => readFileSync(join(web, "app/page.tsx"), "utf8");
  const before = page();
  // One light and one dark class, nothing on the page: the script asks instead of guessing light.
  assert.throws(() => execFileSync("node", [FIX, "--cwd", root, "tokens"], { stdio: "pipe" }));
  assert.equal(page(), before);
  const dry = execFileSync("node", [FIX, "--cwd", root, "tokens", "--theme", "dark", "--dry-run"], { encoding: "utf8" });
  assert.match(dry, /\(thử, chưa ghi\)/);
  assert.equal(page(), before);
  execFileSync("node", [FIX, "--cwd", root, "tokens", "--theme", "dark"], { stdio: "pipe" });
  assert.match(page(), /className="bg-white bg-app text-body"/);
  rmSync(root, { recursive: true });
});

test("foundation: a config exported as a function, <html> in a comment (issue #13)", async () => {
  const { wireNextConfig, clearLegacyLook, readLookState, findHtmlTag } = await import("../../plugin/skills/semi-new-app/scripts/setup.mjs");
  const { web, root } = app();
  writeFileSync(
    join(web, "next.config.ts"),
    `import type { NextConfig } from "next";\nexport default function config(phase: string): NextConfig {\n  const base: NextConfig = {\n    images: { unoptimized: true },\n  };\n  return base;\n}\n`,
  );
  rmSync(join(web, "next.config.mjs"));
  assert.ok(wireNextConfig(web, false));
  assert.match(readFileSync(join(web, "next.config.ts"), "utf8"), /const base: NextConfig = \{\n {4}transpilePackages: \["@semi\/ui"\],\n {4}images/);
  writeFileSync(join(web, "next.config.ts"), `import cfg from "./base";\nexport default cfg;\n`);
  assert.equal(wireNextConfig(web, false), null);
  assert.equal(findHtmlTag(`// the <html> tag below\nconst s = "<html>";\n<html lang="vi">`).tag, '<html lang="vi">');
  writeFileSync(join(web, "app/layout.tsx"), `// ThemeScript goes in <head>, data-style="flat" on <html>\n` + LAYOUT.replace("<html ", '<html data-style="flat" '));
  assert.equal(readLookState(web).legacyStyle, "flat");
  assert.deepEqual(clearLegacyLook(web), ["app/layout.tsx"]);
  const layout = readFileSync(join(web, "app/layout.tsx"), "utf8");
  assert.match(layout, /^\/\/ ThemeScript goes in <head>, data-style="flat" on <html>\n/); // the comment stays
  assert.match(layout, /<html lang="vi"/);
  assert.equal(readLookState(web).legacyStyle, null);
  assert.deepEqual(clearLegacyLook(web), []); // twice: nothing left
  rmSync(root, { recursive: true });
});

test("#16: a file composing the @semi/ui component it is named like is not a duplicate; tool pages need no toolbar; content skips are listed", () => {
  const { root, web } = app();
  mkdirSync(join(web, "components"));
  mkdirSync(join(web, "app/slicer"));
  writeFileSync(join(web, "components/Header.tsx"), `import { AppHeader, Button } from "@semi/ui";\nexport function Header() { return <AppHeader title="x" />; }\n`);
  writeFileSync(join(web, "components/Dialog.tsx"), `import { Button } from "@semi/ui";\nexport function Dialog() { return <div role="dialog"><Button>x</Button></div>; }\n`);
  writeFileSync(join(web, "components/Drawing.tsx"), `export const Drawing = () => <svg className="fill-white" />;\n`);
  writeFileSync(join(web, "app/slicer/page.tsx"), `import { AppHeader } from "@semi/ui";\nexport default function S() { return <><AppHeader title="x" /><canvas />{[1].map((i) => <i key={i} />)}</>; }\n`);
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app", "components"], skip: { "no-literal-palette": { "components/Drawing.tsx": "illustration: device colours" } } }));
  const r = auditProject(root);
  const issues = r.apps[0].issues;
  const checks = issues.map((i) => `${i.check}:${i.file}`);
  assert.ok(!checks.includes("duplicates:components/Header.tsx"));
  assert.ok(checks.includes("duplicates:components/Dialog.tsx"), "imports Button, not Modal: still a copy");
  assert.ok(!checks.includes("subpage-toolbar:app/slicer/page.tsx"));
  assert.ok(checks.includes("subpage-toolbar:app/page.tsx"));
  assert.ok(!issues.some((i) => i.file === "components/Drawing.tsx"), "no codemod or lint issue for a content file");
  assert.match(formatSummary(r), /Minh hoạ \/ màu dữ liệu: `components\/Drawing\.tsx` \(`no-literal-palette`\): illustration: device colours/);
  rmSync(root, { recursive: true });
});

test("semi-gate: wireLintGate puts semi-lint in lint and writes the CI workflow once; the audit then stays quiet", async () => {
  const { wireLintGate } = await import("../../plugin/skills/semi-new-app/scripts/setup.mjs");
  const root = mkdtempSync(join(tmpdir(), "semi-gate-"));
  mkdirSync(join(root, ".git"));
  const web = join(root, "web");
  mkdirSync(join(web, "app"), { recursive: true });
  writeFileSync(join(web, "package.json"), JSON.stringify({ scripts: { lint: "eslint" } }));
  const first = wireLintGate(web);
  assert.ok(first.some((c) => /lint/.test(c)) && first.some((c) => /semi\.yml/.test(c)));
  const pkg = JSON.parse(readFileSync(join(web, "package.json"), "utf8"));
  assert.equal(pkg.scripts.lint, "semi-lint && eslint");
  const wf = readFileSync(join(root, ".github/workflows/semi.yml"), "utf8");
  assert.match(wf, /working-directory: web/);
  assert.match(wf, /npx semi-lint --ci/);
  assert.match(wf, /fetch-depth: 0/);
  assert.deepEqual(wireLintGate(web), [], "second run changes nothing");
  rmSync(root, { recursive: true });
});

test("#145 audit detects 0.x brand.json schema, sales-hub-style semi-pending stand-ins, and counts StickyContextBar pages (#139)", () => {
  const { root, web } = app();
  // 0.x brand.json with removed keys (styles, neutral) → brand-schema issue
  const kit = join(web, "node_modules", "@old", "brand");
  mkdirSync(join(kit, "dist"), { recursive: true });
  writeFileSync(join(kit, "package.json"), JSON.stringify({ name: "@old/brand", version: "0.5.0" }));
  const oldBrand = { name: "Old", package: "@old/brand", primary: "#00AE42", neutral: "tinted", styles: ["flat"], fonts: { sans: "Inter" } };
  writeFileSync(join(kit, "brand.json"), JSON.stringify(oldBrand));
  writeFileSync(join(kit, "dist/brand.json"), JSON.stringify(oldBrand));
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app"], brand: "@old/brand" }));

  // Sales-hub-style stand-ins: semi-pending-*.css, app/components/semi-pending/*, and TODO(semi-pending) in globals.css
  mkdirSync(join(web, "app/components/semi-pending"), { recursive: true });
  writeFileSync(join(web, "app/semi-pending-neutral.css"), `:root {}\n`);
  writeFileSync(join(web, "app/components/semi-pending/PillTabs.tsx"), `export function PillTabs() { return <div />; }\n`);
  writeFileSync(join(web, "app/globals.css"), `@import "tailwindcss";\n@import "@semi/ui/tokens.css";\n/* TODO(semi-pending): remove after 1.0 */\n`);

  // StickyContextBar page counted in toolbarPagesCount and question text (#139)
  mkdirSync(join(web, "app/orders"), { recursive: true });
  writeFileSync(
    join(web, "app/orders/page.tsx"),
    `import { PageTitle, StickyContextBar } from "@semi/ui";\nexport default function Orders() { return <><PageTitle title="Đơn" /><StickyContextBar /></>; }\n`,
  );

  const report = auditProject(root);
  const a = report.apps[0];
  const schemaIssue = a.issues.find((i) => i.check === "brand-schema");
  assert.ok(schemaIssue, "reports brand-schema for 0.x brand.json");
  assert.match(schemaIssue.what, /neutral.*styles/);

  const pendingIssues = a.issues.filter((i) => i.check === "semi-pending");
  assert.equal(pendingIssues.length, 3, "detects css, component, and TODO(semi-pending) stand-ins");
  assert.ok(pendingIssues.every((i) => /MIGRATION-1\.0\.md/.test(i.fix)));
  assert.equal(a.standIns.length, 3);
  assert.match(formatSummary(report), /stand-in tạm \(docs\/MIGRATION-1\.0\.md\)/);

  // StickyContextBar page counted: 2 pages total, 1 has StickyContextBar → 50% covered, so question is NOT asked (#139)
  assert.equal(a.structure.toolbarPagesCount, 1);
  assert.equal(a.structure.pageFileCount, 2);
  assert.equal(a.questions.find((q) => q.id === "page-headers-and-wrappers"), undefined);

  // Add 2 more pages without toolbar → now 1/4 covered (< 50%), question IS asked and names StickyContextBar
  mkdirSync(join(web, "app/reports"), { recursive: true });
  writeFileSync(join(web, "app/reports/page.tsx"), `export default function R() { return <main>Reports</main>; }\n`);
  mkdirSync(join(web, "app/settings"), { recursive: true });
  writeFileSync(join(web, "app/settings/page.tsx"), `export default function S() { return <main>Settings</main>; }\n`);
  const a2 = auditProject(root).apps[0];
  const structQ = a2.questions.find((q) => q.id === "page-headers-and-wrappers");
  assert.ok(structQ, "page-headers-and-wrappers question present when < 50% covered");
  assert.match(structQ.question, /3\/4 pages without SubpageToolbar \/ StickyContextBar/);

  rmSync(root, { recursive: true });
});
