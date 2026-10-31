// node --test lint/test — release migrations (migrations/*.mjs), their helpers and the /semi-update runner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renameExport, renameProp } from "../../migrations/lib.mjs";
import { cmpVersion, loadMigrations, pending, runMigrations } from "../../plugin/skills/semi-update/scripts/migrate.mjs";

const root = new URL("../..", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("every shipped migration has a version up to this release, a unique id, a description and a function", async () => {
  const list = await loadMigrations(join(root, "migrations"));
  const ids = new Set();
  for (const m of list) {
    assert.match(String(m.version), /^\d+\.\d+\.\d+$/, m.file);
    assert.ok(cmpVersion(m.version, pkg.version) <= 0 || pkg.version === m.version, `${m.file}: version after ${pkg.version}`);
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
