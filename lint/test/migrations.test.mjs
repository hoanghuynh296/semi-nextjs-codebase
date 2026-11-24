// node --test lint/test — release migrations (migrations/*.mjs), their helpers and the /semi-sync runner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { accentStateTokens, renameExport, renameProp } from "../../migrations/lib.mjs";
import { cmpVersion, loadMigrations, pending, runMigrations } from "../../plugin/skills/semi-sync/scripts/migrate.mjs";

const root = new URL("../..", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("every shipped migration has a version up to this release, a unique id, a description and a function", async () => {
  const list = await loadMigrations(join(root, "migrations"));
  const ids = new Set();
  for (const m of list) {
    assert.match(String(m.version), /^\d+\.\d+\.\d+$/, m.file);
    // Up to the next minor, or the next major for a breaking release: an unreleased migration ([Unreleased] in the
    // CHANGELOG) ships with the next release, and /semi-sync only runs migrations up to the version it installs.
    const [maj, min] = pkg.version.split(".").map(Number);
    const next = cmpVersion(m.version, `${maj}.${min + 1}.0`) <= 0 || m.version === `${maj + 1}.0.0`;
    assert.ok(next, `${m.file}: version after the next minor (or major) of ${pkg.version}`);
    assert.ok(m.id && !ids.has(m.id), `${m.file}: id`);
    ids.add(m.id);
    assert.ok(m.description, `${m.file}: description`);
    assert.equal(typeof m.run, "function", `${m.file}: default export`);
  }
});

test("cmpVersion and pending pick the releases after the old version up to the new one", () => {
  assert.ok(cmpVersion("0.10.0", "0.9.9") > 0);
  assert.equal(cmpVersion("1.2.3", "1.2.3"), 0);
  const list = ["0.6.0", "0.7.0", "0.8.0", "0.9.0"].map((version) => ({ version }));
  assert.deepEqual(pending(list, "0.6.0", "0.8.0").map((m) => m.version), ["0.7.0", "0.8.0"]);
});

test("renameExport renames the import and its uses, only in files importing it from @semi/ui", () => {
  const src = `import { KpiCard, Button } from "@semi/ui";\nconst a = <KpiCard value={1} />;\nconst b = obj.KpiCard;\n`;
  const out = renameExport(src, "KpiCard", "MetricCard");
  assert.match(out, /import \{ MetricCard, Button \}/);
  assert.match(out, /<MetricCard value/);
  assert.match(out, /obj\.KpiCard/);
  assert.equal(renameExport(out, "KpiCard", "MetricCard"), out, "second run changes nothing");
  const local = `import { KpiCard } from "./mine";\n<KpiCard />`;
  assert.equal(renameExport(local, "KpiCard", "MetricCard"), local);
});

test("accentStateTokens: brand-scale states become themed accent tokens, solid fills and other hues stay", () => {
  const src = `cn("focus-visible:ring-2 focus-visible:ring-primary-500/50", "focus:border-primary-500/50 hover:border-primary-500/30", "bg-primary-500/15 hover:bg-primary-500/25 bg-primary-500 bg-rose-500/10", "md:focus-within:border-primary-400")`;
  const out = accentStateTokens(src);
  assert.equal(
    out,
    `cn("focus-visible:ring-2 focus-visible:ring-focus", "focus:border-focus hover:border-accent-line", "bg-accent-subtle hover:bg-accent-subtle-hover bg-primary-500 bg-rose-500/10", "md:focus-within:border-focus")`,
  );
  assert.equal(accentStateTokens(out), out, "second run changes nothing");
});

test("renameProp only touches that component's tag", () => {
  const src = `<Button tone="danger" /> <Chip tone="danger" />`;
  assert.equal(renameProp(src, "Button", "tone", "variant"), `<Button variant="danger" /> <Chip tone="danger" />`);
});

test("runMigrations runs only the pending ones and reports changed files", async () => {
  const app = mkdtempSync(join(tmpdir(), "semi-mig-"));
  const dir = join(app, "migrations");
  mkdirSync(join(app, "app"), { recursive: true });
  mkdirSync(dir);
  writeFileSync(join(app, "package.json"), JSON.stringify({ dependencies: { next: "16.0.0", react: "19.0.0" } }));
  writeFileSync(join(app, "app/page.tsx"), `import { Old } from "@semi/ui";\nexport default () => <Old />;\n`);
  const lib = new URL("../../migrations/lib.mjs", import.meta.url).href;
  const mig = (v, id, from, to) =>
    `import { renameExport } from ${JSON.stringify(lib)};\nexport const version = "${v}"; export const id = "${id}"; export const description = "${from} → ${to}";\n` +
    `export default ({ files, read, write }) => { for (const f of files) write(f, renameExport(read(f), "${from}", "${to}")); };\n`;
  writeFileSync(join(dir, "0.6.0-a.mjs"), mig("0.6.0", "a", "Old", "Older"));
  writeFileSync(join(dir, "0.7.0-b.mjs"), mig("0.7.0", "b", "Old", "New"));
  const done = await runMigrations({ appDir: app, dir, from: "0.6.0", to: "0.7.0" });
  assert.deepEqual(done.map((m) => [m.id, m.changed]), [["b", ["app/page.tsx"]]]);
  assert.match(readFileSync(join(app, "app/page.tsx"), "utf8"), /<New \/>/);
  rmSync(app, { recursive: true });
});

test("remove-palette: drops semi-lint.json palette and <html data-palette>, keeps the rest; a second run changes nothing", async () => {
  const { default: migrate, version } = await import("../../migrations/0.14.0-remove-palette.mjs");
  assert.equal(version, "0.14.0");
  const app = mkdtempSync(join(tmpdir(), "palette-"));
  writeFileSync(join(app, "semi-lint.json"), JSON.stringify({ style: "soft", palette: "sage" }, null, 2));
  const layout = join(app, "app/layout.tsx");
  mkdirSync(join(app, "app"));
  writeFileSync(layout, `export default function L({ children }) {\n  return <html data-style="soft" data-palette="sage" lang="vi">{children}</html>;\n}\n`);
  const ctx = (files) => ({ appDir: app, files, read: (p) => readFileSync(p, "utf8"), write: (p, t) => writeFileSync(p, t) });
  await migrate(ctx([layout]));
  assert.deepEqual(JSON.parse(readFileSync(join(app, "semi-lint.json"), "utf8")), { style: "soft" });
  assert.match(readFileSync(layout, "utf8"), /<html data-style="soft" lang="vi">/);
  const once = readFileSync(layout, "utf8");
  await migrate(ctx([layout]));
  assert.equal(readFileSync(layout, "utf8"), once, "second run changes nothing");
  rmSync(app, { recursive: true });
});

test("0.30.0 role-token-names: text-kpi → text-figure, z-keypad → z-sheet, classes and CSS variables, twice-safe", async () => {
  const { renameRoleTokens } = await import("../../migrations/0.30.0-role-token-names.mjs");
  const src = `<span className="text-kpi sm:text-heading md:text-kpi" />\n<div className="fixed z-keypad" />\n.x { font-size: var(--text-kpi); line-height: var(--text-kpi--line-height); z-index: var(--z-keypad); }\nconst keep = "text-kpis z-keypadx my-text-kpi";\n`;
  const out = renameRoleTokens(src);
  assert.match(out, /className="text-figure sm:text-heading md:text-figure"/);
  assert.match(out, /z-sheet"/);
  assert.match(out, /var\(--text-figure\); line-height: var\(--text-figure--line-height\); z-index: var\(--z-sheet\)/);
  assert.match(out, /"text-kpis z-keypadx my-text-kpi"/, "only whole token names change");
  assert.equal(renameRoleTokens(out), out);
});

test("0.36.0 surfaces: hand-made cards, copied secondary and primary buttons; floating layers and other orders stay; twice-safe", async () => {
  const { migrateSurfaces, version } = await import("../../migrations/0.36.0-surfaces.mjs");
  assert.equal(version, "0.36.0");
  const src = [
    `<div className="bg-panel border border-line rounded-card p-card" />`,
    `<div className="fixed bg-panel border border-line rounded-card shadow-overlay" />`,
    `<div className="sticky top-0 bg-panel border border-line rounded-card" />`,
    `<div className="rounded-card border border-line bg-panel" />`,
    `const b = "h-control px-3 bg-field hover:bg-raised border border-line text-body hover:text-contrast";`,
    `const p = 'h-control bg-accent hover:bg-accent-hover text-on-accent';`,
    `const on = "bg-accent text-on-accent";`,
    `const t = \`bg-panel border border-line rounded-card \${x}\`;`,
  ].join("\n");
  const out = migrateSurfaces(src);
  assert.match(out, /className="bg-card rounded-card p-card"/);
  assert.match(out, /"fixed bg-panel border border-line rounded-card shadow-overlay"/, "a popover keeps its panel and line");
  assert.match(out, /"sticky top-0 bg-panel border border-line rounded-card"/, "a sticky bar keeps its panel and line");
  assert.match(out, /"rounded-card border border-line bg-panel"/, "another order is a manual step");
  assert.match(out, /"h-control px-3 bg-tint hover:bg-tint-hover text-body hover:text-contrast"/);
  assert.match(out, /'h-control bg-action hover:bg-action-hover text-on-action'/);
  assert.match(out, /"bg-accent text-on-accent"/, "an accent mark without the button hover stays");
  assert.match(out, /`bg-panel border border-line rounded-card \$\{x\}`/, "template literals with expressions are left alone");
  assert.equal(migrateSurfaces(out), out, "second run changes nothing");
});

test("0.36.0 shell: footer → account on AppShell and DocsShell only; mobileTabIds warning; twice-safe", async () => {
  const { migrateShell, deprecatedTabIds, footerAndAccount, version } = await import("../../migrations/0.36.0-shell.mjs");
  assert.equal(version, "0.36.0");
  const src = `import { AppShell, Modal } from "@semi/ui";\n<AppShell productName="A" footer={({ collapsed }) => <X />} mobileTabIds={["a"]}>\n<Modal footer={<B />} />\n<DocsShell onX={() => 1} footer={f} />\n`;
  const out = migrateShell(src);
  assert.match(out, /<AppShell productName="A" account=\{\(\{ collapsed \}\)/);
  assert.match(out, /<Modal footer=\{<B \/>\}/, "other components keep footer");
  assert.match(out, /<DocsShell onX=\{\(\) => 1\} account=\{f\}/, "a prop after an arrow function is still found");
  assert.equal(migrateShell(out), out, "twice-safe");
  assert.equal(migrateShell(`<AppShell footer={x} />`), `<AppShell footer={x} />`, "files that do not import @semi/ui are left alone");
  assert.equal(deprecatedTabIds(src), 1);
  assert.equal(deprecatedTabIds(`<AppShell mobileNav="tabs" mobileTabIds={["a"]} />`), 0);
  // account already set: footer stays (two account props would not compile) and the tag is reported
  const both = `import { AppShell } from "@semi/ui";\n<AppShell footer={f} account={a} />\n`;
  assert.equal(migrateShell(both), both);
  assert.equal(footerAndAccount(both), 1);
  assert.equal(footerAndAccount(out), 0);
  // account inside another prop's braces does not count
  assert.match(migrateShell(`import { AppShell } from "@semi/ui";\n<AppShell x={{ account: 1 }} footer={f} />`), /x=\{\{ account: 1 \}\} account=\{f\}/);
});

test("0.36.0 shell / 0.37.0 account-rail: an account render prop's collapsed check becomes collapsed || rail; other shapes reported; twice-safe", async () => {
  const { railAccount, migrateShell, deprecatedTabIds } = await import("../../migrations/0.36.0-shell.mjs");
  const rail = await import("../../migrations/0.37.0-account-rail.mjs");
  assert.equal(rail.version, "0.37.0");
  const src = `import { AppShell } from "@semi/ui";\n<AppShell productName="A" footer={({ collapsed }) => (collapsed ? null : <Block wide={!collapsed} x={{ collapsed: 1 }} on={s.collapsed} />)}>\n`;
  const { src: out, manual } = railAccount(migrateShell(src));
  assert.match(out, /account=\{\(\{ collapsed, rail \}\) => \(\(collapsed \|\| rail\) \? null : <Block wide=\{!\(collapsed \|\| rail\)\}/);
  assert.match(out, /x=\{\{ collapsed: 1 \}\} on=\{s\.collapsed\}/, "keys and properties named collapsed are left alone");
  assert.deepEqual(manual, []);
  assert.equal(railAccount(out).src, out, "twice-safe");
  // a typed parameter and a block body
  const typed = `import { AppShell } from "@semi/ui";\n<AppShell account={({ collapsed }: ShellSlotState) => { return collapsed ? <A /> : <B />; }} />`;
  assert.match(railAccount(typed).src, /\(\{ collapsed, rail \}: ShellSlotState\) => \{ return \(collapsed \|\| rail\) \?/);
  // already uses rail, or does not read collapsed: unchanged
  for (const ok of [`<AppShell account={({ rail }) => (rail ? null : <B />)} />`, `<AppShell account={({ collapsed, rail }) => (collapsed || rail ? null : <B />)} />`, `<AppShell account={<B />} />`]) {
    const f = `import { AppShell } from "@semi/ui";\n${ok}`;
    assert.deepEqual(railAccount(f), { src: f, manual: [] });
  }
  // another shape that reads collapsed: left alone, reported with its line
  const other = `import { AppShell } from "@semi/ui";\n\n<AppShell\n  account={(s) => (s.collapsed ? null : <B />)}\n/>`;
  assert.deepEqual(railAccount(other), { src: other, manual: [{ line: 4, reason: "collapsed" }] });
  // review of #134: only plain reads are rewritten; anything else is reported and left as is (never a syntax error)
  const H = `import { AppShell } from "@semi/ui";\n`;
  for (const body of [
    "<LogoutButton collapsed={collapsed} />", // an attribute name
    "<B {...{ collapsed }} />", // a spread shorthand
    "<B c={{ collapsed }} />", // a shorthand property
    "<p>collapsed</p>", // JSX text
    "<p>{collapsed}</p>", // a JSX child
    "<B t={`${collapsed}`} />", // a template literal
    "collapsed === true ? null : <B />", // a comparison
    "(collapsed ? null : <p>Mở (collapsed)</p>)", // a read, then the word in JSX text
    "items.map((collapsed) => <B on={collapsed} />)", // a parameter that shadows it
    "items.map((collapsed: boolean, i) => <B on={collapsed} />)", // a typed parameter
    "f((x, collapsed) => collapsed)", // a later parameter
    "items.map(function (collapsed) { return <B on={collapsed} />; })", // a function parameter
    "items.map(function row(collapsed) { return collapsed; })", // a named function's parameter
    "{ try { return <A />; } catch (collapsed) { return null; } }", // a catch binding
  ]) {
    const f = `${H}<AppShell account={({ collapsed }) => ${body}} />`;
    assert.deepEqual(railAccount(f), { src: f, manual: [{ line: 2, reason: "collapsed" }] }, body);
  }
  // strings, comments, object keys and properties that mention the word are not reads: the reads around them are rewritten
  const mixed = `${H}<AppShell account={({ collapsed }) => (collapsed /* collapsed */ ? null : <B c="collapsed" k={{ collapsed: 1 }} p={s.collapsed} on={!collapsed} />)} />`;
  const fixed = railAccount(mixed);
  assert.deepEqual(fixed.manual, []);
  assert.equal(
    fixed.src,
    `${H}<AppShell account={({ collapsed, rail }) => ((collapsed || rail) /* collapsed */ ? null : <B c="collapsed" k={{ collapsed: 1 }} p={s.collapsed} on={!(collapsed || rail)} />)} />`,
  );
  assert.equal(railAccount(fixed.src).src, fixed.src, "twice-safe");
  // review of #134 round 2: the most common shape, a body that starts with the read (no parentheses)
  const bare = `${H}<AppShell\n  account={({ collapsed }) =>\n    collapsed ? null : (\n      <Account />\n    )\n  }\n/>`;
  const bareOut = railAccount(bare);
  assert.deepEqual(bareOut.manual, []);
  assert.match(bareOut.src, /\(\{ collapsed, rail \}\) =>\n {4}\(collapsed \|\| rail\) \? null : \(/);
  assert.equal(railAccount(bareOut.src).src, bareOut.src, "twice-safe");
  assert.match(railAccount(`${H}<AppShell account={({ collapsed }) => collapsed && <A />} />`).src, /=> \(collapsed \|\| rail\) && <A \/>/);
  // an `if (collapsed) {` in a block body is a read, not a parameter
  assert.match(railAccount(`${H}<AppShell account={({ collapsed }) => { if (collapsed) { return null; } return <A />; }} />`).src, /\{ if \(\(collapsed \|\| rail\)\) \{ return null;/);
  // a function or a component that reads neither collapsed nor rail is reported; a plain JSX node is not
  for (const expr of ["AccountBlock", "(s) => <Account {...s} />", "() => <Account />", "function (s) { return <A />; }"]) {
    const f = `${H}<AppShell account={${expr}} />`;
    assert.deepEqual(railAccount(f), { src: f, manual: [{ line: 2, reason: "state" }] }, expr);
  }
  assert.deepEqual(railAccount(`${H}<AppShell account={<Avatar />} />`).manual, []);
  // not an AppShell, or no @semi/ui import: left alone
  const modal = `import { Modal } from "@semi/ui";\n<Modal account={({ collapsed }) => collapsed} />`;
  assert.equal(railAccount(modal).src, modal);
  // mobileTabIds with mobileNav="tabs" is the supported way to pick the tabs (#113): no warning
  assert.equal(deprecatedTabIds(`<AppShell mobileNav="tabs" mobileTabIds={["a"]} />`), 0);
  // the 0.37.0 migration runs the same step through read / write
  const files = { "a.tsx": src.replace("footer=", "account="), "b.css": "x" };
  rail.default({ files: Object.keys(files), read: (f) => files[f], write: (f, v) => (files[f] = v) });
  assert.match(files["a.tsx"], /\(\{ collapsed, rail \}\)/);
  assert.equal(files["b.css"], "x");
});

test("1.0.0 foundation: removed colour and size tokens map to the 1.0 names, data-style goes, a second run changes nothing", async () => {
  const { migrateFoundation, foundationFlags } = await import("../../migrations/1.0.0-foundation.mjs");
  const src = [
    `<html lang="vi" data-theme="dark" data-style="soft">`,
    `cn("text-contrast hover:text-contrast/80 bg-accent hover:bg-accent-hover text-on-accent", "bg-action text-on-action")`,
    `cn("text-accent-fg aria-selected:bg-accent-subtle hover:bg-accent-subtle-hover border-accent-line decoration-accent")`,
    `cn("text-caption text-label text-ui text-ui-lg text-title text-title-lg text-heading-sm text-heading text-heading-lg text-display text-kpi font-title font-display")`,
    `.x { color: var(--color-text-contrast); background: var(--color-accent-subtle); font-size: var(--text-label); line-height: var(--text-heading--line-height); border-color: var(--semi-accent-line); }`,
    `cn("bg-primary-500 text-tone-rose my-text-label-x")`,
    `cn("w-full text-label max-sm:text-title-lg sm:text-title-lg")`,
  ].join("\n");
  const out = migrateFoundation(src);
  assert.equal(
    out,
    [
      `<html lang="vi" data-theme="dark">`,
      `cn("text-strong hover:text-strong/80 bg-primary hover:bg-primary-hover text-on-primary", "bg-primary text-on-primary")`,
      `cn("text-strong aria-selected:bg-item-selected hover:bg-item-selected border-outline-line decoration-primary")`,
      `cn("text-chrome text-chrome text-ui text-lead text-lead text-lead text-section text-section text-tab-xl text-tab-xl text-figure font-title font-display")`,
      `.x { color: var(--color-text-strong); background: var(--color-item-selected); font-size: var(--text-chrome); line-height: var(--text-section--line-height); border-color: var(--semi-outline-line); }`,
      `cn("bg-primary-500 text-tone-rose my-text-label-x")`,
      `cn("w-full text-chrome max-sm:text-input sm:text-lead")`,
    ].join("\n"),
  );
  assert.equal(migrateFoundation(out), out, "second run changes nothing");
  const flags = foundationFlags(src, out);
  assert.ok(flags.some((f) => f.includes("primary-50")), "brand scale flagged");
  assert.ok(flags.some((f) => f.includes("bg-accent")), "bg-accent → bg-primary flagged");
  assert.ok(flags.some((f) => f.includes("accent-fg")), "accent-fg flagged");
});

test("1.0.0 foundation: brand colour never lands on text or lines; --semi-contrast stays; declarations are flagged, not renamed; text-ui unchanged, text-label flagged", async () => {
  const { migrateFoundation, foundationFlags } = await import("../../migrations/1.0.0-foundation.mjs");
  const cls = `cn("text-accent hover:text-action-hover border-accent border-t-accent ring-accent ring-offset-accent outline-accent divide-accent decoration-accent fill-accent stroke-action bg-accent hover:bg-accent-hover text-on-accent bg-contrast")`;
  const out = migrateFoundation(cls);
  assert.equal(
    out,
    `cn("text-strong hover:text-strong border-outline-line border-t-outline-line ring-focus ring-offset-outline-line outline-focus divide-outline-line decoration-primary fill-strong stroke-strong bg-primary hover:bg-primary-hover text-on-primary bg-strong")`,
  );
  assert.equal(migrateFoundation(out), out, "second run changes nothing");

  // reads: --color-contrast → --color-strong, --semi-text-contrast / --semi-accent-fg → --semi-text-strong; --semi-contrast untouched
  const css = `.a { color: var(--color-contrast); outline-color: var(--semi-text-contrast); fill: var(--semi-accent-fg); background: color-mix(in oklab, var(--semi-contrast) 5%, transparent); border-color: var(--semi-accent); }`;
  const cssOut = migrateFoundation(css);
  assert.equal(
    cssOut,
    `.a { color: var(--color-strong); outline-color: var(--semi-text-strong); fill: var(--semi-text-strong); background: color-mix(in oklab, var(--semi-contrast) 5%, transparent); border-color: var(--semi-primary); }`,
  );
  assert.equal(migrateFoundation(cssOut), cssOut);

  // declarations are not renamed (a renamed --semi-accent: would override the brand kit's --semi-primary) but flagged
  const decl = `:root{--semi-accent:#f00;--semi-panel:#123}\n@theme { --color-accent-subtle: red; --color-brandish: blue; }\n<div style={{ "--semi-text-contrast": "#000", "--semi-gap": "4px" }} />`;
  assert.equal(migrateFoundation(decl), decl, "declarations stay as written");
  const flags = foundationFlags(decl, migrateFoundation(decl));
  for (const v of ["--semi-accent", "--semi-panel", "--color-accent-subtle", "--semi-text-contrast"])
    assert.ok(flags.some((f) => f.startsWith(`app CSS sets ${v}: remove it (brand-override) or use the brand kit`)), `${v}: ${flags.join("; ")}`);
  assert.ok(flags.some((f) => f.startsWith("app CSS sets --semi-accent:") && f.includes("not renamed")));
  assert.ok(!flags.some((f) => /--semi-gap|--color-brandish/.test(f)), "an app's own variables are not flagged");

  // text-ui keeps its name and its 14px (the content size): not rewritten, not flagged. text-caption / text-label → text-chrome
  // (12px shell chrome); a label that was a form label, help text or row text is content: flagged, not decided.
  const chromeFlag = "text-label → text-chrome (12px, shell chrome and meta only)";
  const flagsOf = (s) => foundationFlags(s, migrateFoundation(s));
  for (const s of [`<p className="text-ui text-muted">x</p>`, `.x { font-size: var(--text-ui); }`]) {
    assert.equal(migrateFoundation(s), s, "text-ui stays");
    assert.deepEqual(flagsOf(s), []);
  }
  assert.equal(flagsOf(`<label className="text-label">x</label>`).filter((f) => f.startsWith(chromeFlag)).length, 1);
  assert.equal(flagsOf(`.x { font-size: var(--text-label); }`).filter((f) => f.startsWith(chromeFlag)).length, 1);
  assert.equal(flagsOf(`<span className="text-caption my-text-label-x">x</span>`).filter((f) => f.startsWith(chromeFlag)).length, 0);
  // text-copy (the first 1.0 draft's 14px) → text-ui, class and variable; a second run changes nothing
  const copy = `<p className="text-copy sm:text-copy/90 my-text-copy-x">x</p>\n.x { font-size: var(--text-copy); line-height: var(--text-copy--line-height); }`;
  const copyOut = migrateFoundation(copy);
  assert.equal(copyOut, `<p className="text-ui sm:text-ui/90 my-text-copy-x">x</p>\n.x { font-size: var(--text-ui); line-height: var(--text-ui--line-height); }`);
  assert.equal(migrateFoundation(copyOut), copyOut);
  assert.deepEqual(flagsOf(copy), []);
  const chrome = migrateFoundation(`<label className="text-label">x</label>`);
  assert.deepEqual(flagsOf(chrome), [], "a second run flags nothing");
});

test("the semi-sync runner collects a migration's flags", async () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-flags-"));
  try {
    mkdirSync(join(dir, "mig"));
    writeFileSync(join(dir, "mig", "9.9.9-x.mjs"), `export const version = "9.9.9"; export const id = "x"; export const description = "x";\nexport default ({ files, flag }) => { for (const f of files) flag(f, "check me"); };\n`);
    mkdirSync(join(dir, "app", "app"), { recursive: true });
    writeFileSync(join(dir, "app", "app", "page.tsx"), "export default function P() { return null; }\n");
    const [r] = await runMigrations({ appDir: join(dir, "app"), dir: join(dir, "mig"), from: "9.0.0", to: "9.9.9" });
    assert.ok(r.flags.length >= 1 && r.flags.every((f) => f.message === "check me" && !f.file.startsWith("/")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("1.0.0 foundation (review 2): focus rings go to ring-focus, JS declarations are flagged not renamed, accent-accent is flagged", async () => {
  const { migrateFoundation, foundationFlags } = await import("../../migrations/1.0.0-foundation.mjs");
  const src = [
    `cn("focus-visible:ring-accent focus:outline-accent ring-accent/50 border-accent accent-accent")`,
    `const s = { ["--semi-accent" as string]: x, "--semi-panel": y };`,
    `el.style.setProperty("--semi-accent", c); el.style.setProperty('--color-panel', c);`,
    `.a { color: var(--semi-accent); }`,
  ].join("\n");
  const out = migrateFoundation(src);
  assert.equal(
    out,
    [
      `cn("focus-visible:ring-focus focus:outline-focus ring-focus/50 border-outline-line accent-primary")`,
      `const s = { ["--semi-accent" as string]: x, "--semi-panel": y };`,
      `el.style.setProperty("--semi-accent", c); el.style.setProperty('--color-panel', c);`,
      `.a { color: var(--semi-primary); }`,
    ].join("\n"),
  );
  assert.equal(migrateFoundation(out), out, "second run changes nothing");
  const flags = foundationFlags(src, out);
  for (const v of ["--semi-accent", "--semi-panel", "--color-panel"]) assert.ok(flags.some((f) => f.includes(`sets ${v}:`)), `${v} flagged`);
  assert.ok(flags.some((f) => f.startsWith("accent-accent")), "accent-accent flagged");
});

test("1.0.0 app-shell: AppShell create → mainAction, utilities → tools; account / footer reported; twice-safe", async () => {
  const shell = await import("../../migrations/1.0.0-app-shell.mjs");
  assert.equal(shell.version, "1.0.0");
  const src = [
    'import { AppShell, DocsShell, useThemeUtility } from "@semi/ui";',
    "const theme = useThemeUtility();",
    "<AppShell productName=\"A\" create={{ label: \"Tạo mới\", items }} utilities={[theme]} account={({ rail }) => (rail ? <A /> : <B />)}>",
    "  {children}",
    "</AppShell>;",
    '<DocsShell productName="D" utilities={tools} footer={() => <x create="1" />} />;',
    "<Other create={x} utilities={y} />;",
  ].join("\n");
  const out = shell.migrateShell(src);
  assert.match(out, /<AppShell productName="A" mainAction=\{\{ label: "Tạo mới", items \}\} tools=\{\[theme\]\} account=/);
  assert.match(out, /<DocsShell productName="D" tools=\{tools\} footer=\{\(\) => <x create="1" \/>\} \/>/);
  // other components and props inside an attribute's braces are untouched
  assert.match(out, /<Other create=\{x\} utilities=\{y\} \/>/);
  assert.equal(shell.migrateShell(out), out);
  const flags = shell.shellFlags(src);
  assert.ok(flags.some((m) => m.startsWith("AppShell account:")));
  assert.ok(flags.some((m) => m.startsWith("DocsShell account / footer")));
  assert.ok(flags.some((m) => m.startsWith("useThemeUtility()")));
  // both the old and the new prop: left for a person, reported
  const both = '<AppShell create={a} mainAction={b} sections={s} />';
  assert.equal(shell.migrateShell(both), both);
  assert.ok(shell.shellFlags(both).some((m) => m.includes("sets both create and mainAction")));
  // through read / write / flag
  const files = { "a.tsx": src, "b.css": "x" };
  const flagged = [];
  shell.default({ files: Object.keys(files), read: (f) => files[f], write: (f, v) => (files[f] = v), flag: (f, m) => flagged.push([f, m]) });
  assert.match(files["a.tsx"], /mainAction=/);
  assert.equal(files["b.css"], "x");
  assert.ok(flagged.every(([f]) => f === "a.tsx") && flagged.length >= 3);
});

test("1.0.0 app-shell: comments inside a tag are not props, a > in a comment or string does not end the tag; {...spread} reported", async () => {
  const shell = await import("../../migrations/1.0.0-app-shell.mjs");
  // the comment names the old prop: the real prop is renamed, the comment kept as written
  assert.equal(shell.migrateShell("<AppShell /* create */ create={a} />"), "<AppShell /* create */ mainAction={a} />");
  assert.equal(shell.migrateShell("<AppShell\n  // utilities moved\n  utilities={u}\n/>"), "<AppShell\n  // utilities moved\n  tools={u}\n/>");
  // only a comment: nothing to rename
  assert.equal(shell.migrateShell("<AppShell /* create={a} */ sections={s} />"), "<AppShell /* create={a} */ sections={s} />");
  // a > inside a comment or a string does not end the tag early
  assert.equal(shell.migrateShell('<AppShell /* a > b */ title="x > y" create={a} />'), '<AppShell /* a > b */ title="x > y" mainAction={a} />');
  // a string that holds the prop name is not a prop
  assert.equal(shell.migrateShell('<AppShell title=" create" sections={s} />'), '<AppShell title=" create" sections={s} />');
  assert.deepEqual(shell.shellFlags("<AppShell /* account */ sections={s} />"), []);
  // a spread may carry create / utilities: reported, not rewritten
  const spread = "<AppShell {...props} sections={s} />";
  assert.equal(shell.migrateShell(spread), spread);
  assert.ok(shell.shellFlags(spread).some((m) => m.startsWith("AppShell {...spread}")));
  assert.ok(shell.shellFlags("<DocsShell { ...rest } />").some((m) => m.startsWith("DocsShell {...spread}")));
  // a spread inside an attribute's braces is not the tag's
  assert.ok(!shell.shellFlags("<AppShell header={{ ...h }} />").some((m) => m.includes("spread")));
  // an apostrophe in nested JSX text reads as an open string: the tag is left alone and reported, not silently skipped
  const apostrophe = "import { AppShell } from \"@semi/ui\";\n<AppShell header={<span>Don't</span>} create={a} />";
  assert.equal(shell.migrateShell(apostrophe), apostrophe);
  assert.ok(shell.shellFlags(apostrophe).some((m) => m.startsWith("AppShell / DocsShell tag on line 2:")));
  // a later, readable tag in the same file is still migrated
  assert.match(shell.migrateShell(apostrophe + "\n<AppShell create={b} />"), /<AppShell header=\{<span>Don't<\/span>\} create=\{a\} \/>/);
  assert.match(shell.migrateShell(apostrophe + "\n<AppShell create={b} />"), /\n<AppShell mainAction=\{b\} \/>$/);
test("1.0.0 buttons: variant=\"secondary\" → \"subtle\" on Semi Button / SplitButton, BTN_SECONDARY → BTN_SUBTLE; twice-safe; outline and expressions flagged", async () => {
  const { migrateButtons, buttonFlags } = await import("../../migrations/1.0.0-buttons.mjs");
  const src = [
    `import { Button, SplitButton, BTN_SECONDARY, MODAL_BTN_SECONDARY } from "@semi/ui";`,
    `<Button variant="secondary" onClick={() => a > b}>x</Button>`,
    `<Button onClick={() => go()} variant={"secondary"} size="sm" />`,
    `<SplitButton label="x" variant='secondary' items={[]} />`,
    `<Card variant="secondary" />`,
    `<button className={cn(BTN_SECONDARY, "x")} /><button className={MODAL_BTN_SECONDARY} />`,
  ].join("\n");
  const out = migrateButtons(src);
  assert.equal(
    out,
    [
      `import { Button, SplitButton, BTN_SUBTLE, MODAL_BTN_SUBTLE } from "@semi/ui";`,
      `<Button variant="subtle" onClick={() => a > b}>x</Button>`,
      `<Button onClick={() => go()} variant="subtle" size="sm" />`,
      `<SplitButton label="x" variant="subtle" items={[]} />`,
      `<Card variant="secondary" />`,
      `<button className={cn(BTN_SUBTLE, "x")} /><button className={MODAL_BTN_SUBTLE} />`,
    ].join("\n"),
  );
  assert.equal(migrateButtons(out), out, "second run changes nothing");
  // a Button that is not Semi's is left alone
  const local = `import { Button } from "./ui";\n<Button variant="secondary" />`;
  assert.equal(migrateButtons(local), local);
  const flags = buttonFlags(`import { Button } from "@semi/ui";\nconst v = ok ? "primary" : "secondary";\n<Button variant={v} /><Button variant="outline" />`);
  assert.equal(flags.length, 2, flags.join("; "));
  assert.deepEqual(buttonFlags(out.replace(`<Card variant="secondary" />`, "")), []);
  // what the rename cannot reach is flagged: an alias, a namespace import, a ButtonVariant wrapper, a non-Semi component
  const alias = `import { Button as B } from "@semi/ui";\n<B variant="secondary" />`;
  assert.equal(migrateButtons(alias), alias);
  assert.ok(buttonFlags(alias).some((f) => f.startsWith("Button imported under another name")), "alias");
  const ns = `import * as S from "@semi/ui";\n<S.Button variant="secondary" />`;
  assert.ok(buttonFlags(ns).some((f) => f.startsWith("Button imported under another name")), "namespace");
  assert.ok(buttonFlags(ns).some((f) => f.startsWith("<S.Button variant")), "namespace tag");
  const wrapper = `import { Button, type ButtonVariant } from "@semi/ui";\nexport const Act = ({ v }: { v: ButtonVariant }) => <Button variant={v} />;`;
  assert.ok(buttonFlags(wrapper).some((f) => f.startsWith("a wrapper typed with ButtonVariant")), "wrapper");
  assert.ok(buttonFlags(`<Card variant="secondary" />`).some((f) => f.startsWith("<Card variant")), "non-Semi component");
  // an arrow (=>) or a > inside {…} before the variant does not end the tag
  assert.ok(buttonFlags(`<Card onClick={() => go()} variant="secondary" />`).some((f) => f.startsWith("<Card variant")), "after an arrow");
  assert.ok(buttonFlags(`<Card when={a > b} variant={'secondary'} />`).some((f) => f.startsWith("<Card variant")), "after a > in braces");
  assert.deepEqual(buttonFlags(`<Card onClick={() => go()} variant="primary" />`), []);
});
