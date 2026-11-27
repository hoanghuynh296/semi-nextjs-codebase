// node --test lint/test — semi-lint rules on single lines and files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { filesToScan, scan } from "../semi-lint.mjs";

const lint = (code) => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  const file = join(dir, "page.tsx");
  writeFileSync(file, code);
  const r = scan([file], {}, dir);
  rmSync(dir, { recursive: true });
  return r.hard.map((h) => h.rule);
};

test("external-link: raw external hrefs and window.open are flagged, ExternalLink itself is not", () => {
  assert.deepEqual(lint('<a href="https://example.com">x</a>'), ["external-link"]);
  assert.deepEqual(lint("window.open(url)"), ["external-link"]);
  assert.deepEqual(lint('<ExternalLink href="https://example.com">docs</ExternalLink>'), []);
  assert.deepEqual(lint('<Link href="/settings">x</Link>'), []);
});

test("ignore: generated files are not scanned", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "src/a.tsx"), "export const a = 1;\n");
  writeFileSync(join(dir, "src/registry.generated.ts"), "export const b = 2;\n");
  const files = filesToScan({ scan: ["src"], ignore: ["src/registry.generated.ts"] }, dir).map((p) => p.split("/").pop());
  assert.deepEqual(files, ["a.tsx"]);
  rmSync(dir, { recursive: true });
});

test("decorative-icon-tones: three or more icon colours in a file are counted once, two are not", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  const file = join(dir, "page.tsx");
  writeFileSync(file, '<KpiCard label="a" value="1" icon="coin" iconTone="green" />\n<KpiCard label="b" value="2" icon="box" iconTone="sky" />\n<KpiCard label="c" value="3" icon="zap" iconTone="violet" />\n');
  const r = scan([file], {}, dir);
  assert.deepEqual(r.hits.filter((h) => h.rule === "decorative-icon-tones").map((h) => h.line), [1]);
  writeFileSync(file, '<KpiCard label="a" value="1" icon="clock" iconTone="amber" />\n<KpiCard label="b" value="2" icon="check" iconTone="green" />\n');
  assert.equal(scan([file], {}, dir).hits.filter((h) => h.rule === "decorative-icon-tones").length, 0);
  rmSync(dir, { recursive: true });
});

const ratchet = (code, rule, cfg = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  const file = join(dir, "page.tsx");
  writeFileSync(file, code);
  const r = scan([file], cfg, dir);
  rmSync(dir, { recursive: true });
  return r.hits.filter((h) => h.rule === rule).map((h) => h.line);
};

test("#16 loading-text: progress step labels and status lines are fine, bare loading text is not", () => {
  assert.deepEqual(ratchet('<p>Đang tải…</p>\nrun.show("Đang tải file lên máy chủ", { fraction });\n<Progress value={v} label="Đang tải" />', "loading-text"), [1]);
  assert.deepEqual(ratchet('<div role="status">\n  <span>Đang tải</span>\n</div>\n<div>\n  Loading...\n</div>', "loading-text"), [5]);
});

test("#16 narrow-container: dialogs and drawers keep their max width", () => {
  assert.deepEqual(ratchet('<div className={cn(MODAL_PANEL, "max-w-5xl")} />\n<div\n  role="dialog"\n  className="max-w-4xl"\n/>\n<Drawer className="max-w-4xl" />\n<main className="max-w-5xl" />', "narrow-container"), [7]);
});

test("#16 font-mono: allowed on code, pre, textarea and contentEditable editors, and inside code blocks", () => {
  const code = [
    '<pre className="font-mono" />',
    '<textarea className="font-mono text-ui" />',
    '<div contentEditable className="font-mono" />',
    "<pre>",
    '  <span className="font-mono">x</span>',
    "</pre>",
    '<td className="font-mono">{price}</td>',
  ].join("\n");
  assert.deepEqual(ratchet(code, "font-mono"), [7]);
});

test("#16 skip with a reason: content rules only, a reason is required, the audit lists them", async () => {
  const { configErrors, skipReasons } = await import("../semi-lint.mjs");
  const cfg = { skip: { "literal-colour-value": { "lib/palette.ts": "data colours: 3D scene" }, "inline-svg-path": ["components/Logo.tsx"] } };
  assert.deepEqual(configErrors(cfg), []);
  assert.deepEqual(skipReasons(cfg), [{ rule: "literal-colour-value", path: "lib/palette.ts", reason: "data colours: 3D scene" }]);
  assert.equal(configErrors({ skip: { "font-mono": { "a.tsx": "code" } } }).length, 1);
  assert.equal(configErrors({ skip: { "literal-colour-value": { "a.tsx": " " } } }).length, 1);
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  mkdirSync(join(dir, "lib"));
  writeFileSync(join(dir, "lib/palette.ts"), 'export const PART = "#ff8800";\n');
  writeFileSync(join(dir, "lib/ui.ts"), 'export const BG = "#ff8800";\n');
  const r = scan([join(dir, "lib/palette.ts"), join(dir, "lib/ui.ts")], cfg, dir);
  assert.deepEqual(r.hits.filter((h) => h.rule === "literal-colour-value").map((h) => h.file), ["lib/ui.ts"]);
  rmSync(dir, { recursive: true });
});

test("icon-alias flags brand aliases and suggests canonical names", async () => {
  const { scan } = await import("../semi-lint.mjs");
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  const file = join(dir, "page.tsx");
  writeFileSync(file, '<Icon name="shopee_mall" />\n<Icon name="momo_pay" />\n<Icon name="vtpost" />\n');
  const r = scan([file], {}, dir);
  assert.deepEqual(r.hard.filter((h) => h.rule === "icon-alias").map((h) => h.line), [1, 2, 3]);
  rmSync(dir, { recursive: true });
});

test("icon-alias: mail and inbox are real icons; email, envelope and incoming are aliases", async () => {
  const { scan } = await import("../semi-lint.mjs");
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  const file = join(dir, "page.tsx");
  writeFileSync(
    file,
    '<Icon name="mail" />\n<Icon name="inbox" />\n<Icon name="email" />\n<Icon name="envelope" />\n<Icon name="incoming" />\n',
  );
  const r = scan([file], {}, dir);
  assert.deepEqual(r.hard.filter((h) => h.rule === "icon-alias").map((h) => h.line), [3, 4, 5]);
  rmSync(dir, { recursive: true });
});

/** Writes { path: code } into a temp app and returns [rule, file, line] hits of the shell rules. */
const shellLint = (files, only) => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  for (const [p, code] of Object.entries(files)) {
    mkdirSync(join(dir, p, ".."), { recursive: true });
    writeFileSync(join(dir, p), code);
  }
  const paths = (only || Object.keys(files)).map((p) => join(dir, p));
  const rules = ["app-shell-in-page", "shell-gate", "shell-nav-href", "boot-loader-place"];
  const r = scan(paths, {}, dir).hits.filter((h) => rules.includes(h.rule)).map((h) => [h.rule, h.file, h.line]);
  rmSync(dir, { recursive: true });
  return r;
};

const SHELL = 'import { AppShell } from "@semi/ui";\nexport function Shell({ children }) {\n  return <AppShell sections={S} activeId="a">{children}</AppShell>;\n}\n';

test("#23 app-shell-in-page: AppShell in a layout is fine; in a page, or a component a page imports, is not", () => {
  assert.deepEqual(shellLint({ "app/layout.tsx": SHELL, "app/page.tsx": "export default function P() { return <p>x</p>; }\n" }), []);
  assert.deepEqual(shellLint({ "app/page.tsx": SHELL }), [["app-shell-in-page", "app/page.tsx", 3]]);
  const viaImport = { "app/components/Shell.tsx": SHELL, "app/orders/page.tsx": 'import { Shell } from "../components/Shell";\nexport default () => <Shell>x</Shell>;\n' };
  assert.deepEqual(shellLint(viaImport), [["app-shell-in-page", "app/orders/page.tsx", 1]]);
  // --files mode: only the page is linted, the imported file is still read from disk.
  assert.deepEqual(shellLint(viaImport, ["app/orders/page.tsx"]), [["app-shell-in-page", "app/orders/page.tsx", 1]]);
  const alias = { "src/components/Shell.tsx": SHELL, "app/page.tsx": 'import { Shell } from "@/components/Shell";\nexport default () => <Shell>x</Shell>;\n' };
  assert.deepEqual(shellLint(alias), [["app-shell-in-page", "app/page.tsx", 1]]);
});

test("#23 shell-gate: an early full-page skeleton before AppShell is flagged, BootLoader is not", () => {
  const gate = (el) => `export function Shell({ children }) {\n  if (!ready) return ${el};\n  return <AppShell sections={S}>{children}</AppShell>;\n}\n`;
  assert.deepEqual(shellLint({ "app/layout.tsx": gate("<PageSkeleton />") }), [["shell-gate", "app/layout.tsx", 2]]);
  assert.deepEqual(shellLint({ "app/layout.tsx": gate("(\n    <SkeletonGrid />\n  )") }), [["shell-gate", "app/layout.tsx", 2]]);
  assert.deepEqual(shellLint({ "app/layout.tsx": gate("<BootLoader />") }), []);
  // A skeleton in a file without AppShell (a loading.tsx) is the right place.
  assert.deepEqual(shellLint({ "app/loading.tsx": "export default function L() { return <PageSkeleton />; }\n" }), []);
});

test("#23 shell-nav-href: AppShell onSelect that routes is flagged, href items and in-page onSelect are not", () => {
  assert.deepEqual(shellLint({ "app/layout.tsx": "<AppShell sections={S} onSelect={(id) => router.push(hrefOf(id))}>{c}</AppShell>\n" }), [["shell-nav-href", "app/layout.tsx", 1]]);
  assert.deepEqual(shellLint({ "app/layout.tsx": "const go = (id) => {\n  router.replace(`/${id}`);\n};\n<AppShell sections={S} onSelect={go}>{c}</AppShell>\n" }), [["shell-nav-href", "app/layout.tsx", 4]]);
  assert.deepEqual(shellLint({ "app/layout.tsx": "<AppShell sections={S} onSelect={(id) => setFolder(id)}>{c}</AppShell>\n" }), []);
  assert.deepEqual(shellLint({ "app/layout.tsx": "<AppShell sections={S} activeId={a}>{c}</AppShell>\n" }), []);
});

test("#24 boot-loader-place: BootLoader in a layout gate is fine; in a page, a loading.tsx or AppShell content is not", () => {
  assert.deepEqual(shellLint({ "app/(app)/layout.tsx": "if (!session) return <BootLoader />;\nreturn <AppShell sections={S}>{children}</AppShell>;\n" }), []);
  assert.deepEqual(shellLint({ "app/page.tsx": "export default () => <BootLoader />;\n" }), [["boot-loader-place", "app/page.tsx", 1]]);
  assert.deepEqual(shellLint({ "app/loading.tsx": "export default () => <BootLoader />;\n" }), [["boot-loader-place", "app/loading.tsx", 1]]);
  assert.deepEqual(shellLint({ "app/layout.tsx": "<AppShell sections={S} footer={() => <X />}>\n  {ready ? children : <BootLoader />}\n</AppShell>\n" }), [["boot-loader-place", "app/layout.tsx", 2]]);
});

test("card-padding: a card tighter than p-card is flagged; p-card, the Card default, p-0 and rows inside are not", () => {
  assert.deepEqual(ratchet('<Card className="p-2 space-y-1">x</Card>', "card-padding"), [1]);
  assert.deepEqual(ratchet('<div className={`${CARD} p-1.5 flex`}>x</div>', "card-padding"), [1]);
  assert.deepEqual(ratchet('<div className={cn(CARD_HOVER, "p-2 text-left")}>x</div>', "card-padding"), [1]);
  assert.deepEqual(ratchet('<Card className="space-y-2">x</Card>\n<Card padding="none">x</Card>\n<div className={`${CARD} p-card sm:p-panel`}>x</div>', "card-padding"), []);
  assert.deepEqual(ratchet('<div className={`${CARD} p-0 overflow-hidden`}>x</div>\n<div className={`${CARD} p-card`}><div className="px-2 py-1 gap-2">row</div></div>', "card-padding"), []);
  assert.deepEqual(ratchet('<Card className="p-20">x</Card>', "card-padding"), []);
});

test("#142 semi-lint --json flushes > 64 KB piped stdout without truncation and keeps exit codes", async () => {
  const cli = new URL("../semi-lint.mjs", import.meta.url).pathname;
  const runPiped = (cwd, args) =>
    new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [cli, ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
      const chunks = [];
      let stderr = "";
      child.stdout.on("data", (d) => chunks.push(d));
      child.stderr.on("data", (d) => (stderr += d));
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, stdout: Buffer.concat(chunks).toString("utf8"), stderr }));
    });
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-pipe-"));
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "semi-lint.json"), JSON.stringify({ scan: ["app"] }));
  // ~400 hard violations across files → > 100 KB of JSON output (well over the 64 KB OS pipe buffer)
  for (let i = 0; i < 40; i++) {
    const lines = Array.from({ length: 12 }, (_, k) => `<h2 className="font-bold text-xs">Heading ${i}-${k} with enough padding text to exceed pipe buffer</h2>`).join("\n");
    writeFileSync(join(dir, `app/page-${String(i).padStart(2, "0")}.tsx`), `export default function P${i}() { return <div>\n${lines}\n</div>; }\n`);
  }
  const failRun = await runPiped(dir, ["--json"]);
  assert.equal(failRun.code, 1, failRun.stderr);
  assert.ok(Buffer.byteLength(failRun.stdout) > 65536, `expected > 64 KB JSON, got ${Buffer.byteLength(failRun.stdout)} bytes`);
  const parsed = JSON.parse(failRun.stdout);
  assert.equal(parsed.files, 40);
  assert.equal(parsed.hard.length, 40 * 12 * 2);

  // Clean run with > 64 KB JSON? Verify exit 0 with clean fixture as well
  const cleanDir = mkdtempSync(join(tmpdir(), "semi-lint-pipe-clean-"));
  mkdirSync(join(cleanDir, "app"));
  writeFileSync(join(cleanDir, "semi-lint.json"), JSON.stringify({ scan: ["app"] }));
  writeFileSync(join(cleanDir, "app/page.tsx"), `export default function P() { return <p className="text-ui text-body">OK</p>; }\n`);
  const okRun = await runPiped(cleanDir, ["--json"]);
  assert.equal(okRun.code, 0, okRun.stderr);
  assert.equal(JSON.parse(okRun.stdout).hard.length, 0);

  rmSync(dir, { recursive: true });
  rmSync(cleanDir, { recursive: true });
});

test("gradient (C-022): only Semi's SCROLL_EDGE declaration passes; a hand-written gradient or blur is caught anywhere", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-lint-"));
  mkdirSync(join(dir, "styles"));
  const constant = 'export const SCROLL_EDGE = {\n  top: "pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-panel to-transparent",\n  bottom: "absolute bottom-0 h-8 bg-linear-to-t from-panel to-transparent",\n} as const;\n';
  const copy = 'export const FADE = "absolute bottom-0 h-8 bg-linear-to-t from-panel to-transparent";\n';
  writeFileSync(join(dir, "styles/surfaces.ts"), constant + copy);
  writeFileSync(join(dir, "edge.tsx"), constant);
  writeFileSync(join(dir, "use.tsx"), '<span aria-hidden className={cn(SCROLL_EDGE.bottom, edges.bottom ? "opacity-100" : "opacity-0")} />\n');
  const r = scan([join(dir, "styles/surfaces.ts"), join(dir, "edge.tsx"), join(dir, "use.tsx")], {}, dir);
  const hits = r.hard.filter((h) => h.rule === "gradient").map((h) => `${h.file}:${h.line}`);
  // the constant in Semi's surfaces.ts passes, the copy below it and the same block in an app file do not; using it is fine
  assert.deepEqual(hits, ["styles/surfaces.ts:5", "edge.tsx:2", "edge.tsx:3"]);
  rmSync(dir, { recursive: true });
  for (const g of ["bg-gradient-to-b from-panel", "bg-linear-to-t from-panel to-transparent", "bg-radial from-app", "bg-conic-180 from-app", "style={{ background: 'linear-gradient(#000, transparent)' }}", "mask-image: radial-gradient(black, transparent)"])
    assert.ok(lint(`<div className="${g}" />`).includes("gradient"), g);
  assert.ok(lint('<div className="absolute inset-x-0 bottom-0 h-8 blur-xl bg-panel" />').includes("glow"));
  assert.deepEqual(lint('<div className="bg-linear-gradient-free bg-line" />').filter((r) => r === "gradient"), ["gradient"]);
});
