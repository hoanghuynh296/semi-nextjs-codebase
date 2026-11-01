// node --test lint/test — /semi-audit issue list, semi-audit.md and the /semi-fix loop on a throwaway app.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditFileState, auditProject, totals, writeAuditFile } from "../../plugin/skills/semi-audit/scripts/audit.mjs";

const FIX = new URL("../../plugin/skills/semi-fix/scripts/fix.mjs", import.meta.url).pathname;
const STYLE = new URL("../../plugin/skills/semi-style/scripts/style.mjs", import.meta.url).pathname;
const LAYOUT = `export default function L({ children }) {\n  return (\n    <html lang="vi" suppressHydrationWarning>\n      <body>{children}</body>\n    </html>\n  );\n}\n`;

function app() {
  const root = mkdtempSync(join(tmpdir(), "semi-audit-"));
  const web = join(root, "web");
  mkdirSync(join(web, "app"), { recursive: true });
  writeFileSync(join(web, "package.json"), JSON.stringify({ dependencies: { next: "16.0.0", react: "19.0.0", "@semi/ui": "x" }, devDependencies: { tailwindcss: "^4.1.0" } }));
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
    ["semi-ui", "transpile", "semi-css", "semi-lint-config", "providers", "style"],
  );
  assert.equal(issues[0].phase, "foundation");
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

test("semi-audit.md goes stale when the code changes", () => {
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

test("fix --codemod then a clean --verify deletes semi-audit.md", () => {
  const { root, web } = app();
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app"], style: "flat", keep: { tables: "x", "app-shell": "x", "subpage-toolbar": "x" } }));
  writeFileSync(join(web, "app/layout.tsx"), `// fonts: --font-geist --font-montserrat-alternates\n` + LAYOUT.replace("<html ", '<html data-style="flat" ').replace("<body>", "<body><ThemeProvider>").replace("</body>", "</ThemeProvider></body>"));
  writeAuditFile(auditProject(root), root);
  execFileSync("node", [FIX, "--cwd", root, "--codemod"]);
  assert.match(readFileSync(join(web, "app/page.tsx"), "utf8"), /bg-panel text-contrast/);
  writeFileSync(join(web, "app/page.tsx"), readFileSync(join(web, "app/page.tsx"), "utf8").replace("font-bold", "font-semibold"));
  execFileSync("node", [FIX, "--cwd", root, "--verify"]);
  assert.equal(totals(auditProject(root)).total, 0);
  assert.equal(existsSync(join(root, "semi-audit.md")), false);
  rmSync(root, { recursive: true });
});

test("style: the audit asks for one, foundation --style applies it, /semi-style switches it", () => {
  const { root, web } = app();
  writeFileSync(join(web, "app/layout.tsx"), LAYOUT);
  const styleIssue = () => auditProject(root).apps[0].issues.find((i) => i.check === "style");
  assert.match(styleIssue().what, /chưa chọn style/);
  // Without --style the step is not guessed: it lists the styles and fails.
  assert.throws(() => execFileSync("node", [FIX, "--cwd", root, "foundation"], { stdio: "pipe" }));
  const out = execFileSync("node", [FIX, "--cwd", root, "foundation", "--style", "soft"], { encoding: "utf8" });
  assert.match(readFileSync(join(web, "app/layout.tsx"), "utf8"), /<html data-style="soft" lang="vi" suppressHydrationWarning>/);
  assert.equal(JSON.parse(readFileSync(join(web, "semi-lint.json"), "utf8")).style, "soft");
  // The style's fonts are printed for the layout, and the audit asks for them until the layout loads them.
  assert.match(out, /import \{ Plus_Jakarta_Sans \} from "next\/font\/google"/);
  assert.equal(styleIssue(), undefined);
  assert.match(auditProject(root).apps[0].issues.find((i) => i.check === "style-fonts").what, /Plus Jakarta Sans/);
  writeFileSync(join(web, "app/layout.tsx"), readFileSync(join(web, "app/layout.tsx"), "utf8").replace("<html ", "<html className={jakarta.variable /* --font-jakarta */} "));
  assert.equal(auditProject(root).apps[0].issues.find((i) => i.check === "style-fonts"), undefined);
  // The layout drifting from semi-lint.json is a foundation issue again.
  writeFileSync(join(web, "app/layout.tsx"), LAYOUT);
  assert.match(styleIssue().what, /data-style="soft"/);
  execFileSync("node", [STYLE, "--cwd", root, "--to", "flat"], { stdio: "pipe" });
  assert.match(readFileSync(join(web, "app/layout.tsx"), "utf8"), /<html data-style="flat" lang="vi"/);
  assert.match(execFileSync("node", [STYLE, "--cwd", root], { encoding: "utf8" }), /style flat\n {2}● flat/);
  assert.throws(() => execFileSync("node", [STYLE, "--cwd", root, "--to", "glass"], { stdio: "pipe" }));
  rmSync(root, { recursive: true });
});
