// node --test lint/test — /semi-audit issue list, semi-audit.md and the /semi-fix loop on a throwaway app.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditFileState, auditProject, totals, writeAuditFile } from "../../plugin/skills/semi-audit/scripts/audit.mjs";

const FIX = new URL("../../plugin/skills/semi-fix/scripts/fix.mjs", import.meta.url).pathname;

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
    ["semi-ui", "transpile", "semi-css", "semi-lint-config", "providers"],
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
  writeFileSync(join(web, "semi-lint.json"), JSON.stringify({ scan: ["app"], keep: { tables: "x", "app-shell": "x", "subpage-toolbar": "x" } }));
  writeAuditFile(auditProject(root), root);
  execFileSync("node", [FIX, "--cwd", root, "--codemod"]);
  assert.match(readFileSync(join(web, "app/page.tsx"), "utf8"), /bg-panel text-contrast/);
  writeFileSync(join(web, "app/page.tsx"), readFileSync(join(web, "app/page.tsx"), "utf8").replace("font-bold", "font-semibold"));
  execFileSync("node", [FIX, "--cwd", root, "--verify"]);
  assert.equal(totals(auditProject(root)).total, 0);
  assert.equal(existsSync(join(root, "semi-audit.md")), false);
  rmSync(root, { recursive: true });
});
