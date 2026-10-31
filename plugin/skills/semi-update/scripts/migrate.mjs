// Release migrations: code changes a @semi/ui release ships for its own breaking changes (node_modules/@semi/ui/
// migrations/*.mjs). /semi-update runs the ones between the old and the new version, nothing else. Zero deps.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { scanTargets } from "../../semi-audit/scripts/audit.mjs";

/** Compare x.y.z versions: < 0 when a is older. */
export function cmpVersion(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

/** Every migration module in dir (lib.mjs and _*.mjs are helpers), sorted by version then file name. */
export async function loadMigrations(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".mjs") && n !== "lib.mjs" && !n.startsWith("_")).sort()) {
    const m = await import(pathToFileURL(join(dir, f)).href);
    out.push({ file: f, version: m.version, id: m.id, description: m.description, run: m.default });
  }
  return out.sort((a, b) => cmpVersion(a.version, b.version) || a.file.localeCompare(b.file));
}

/** Migrations of releases after `from`, up to and including `to`. */
export const pending = (list, from, to) => list.filter((m) => cmpVersion(m.version, from) > 0 && cmpVersion(m.version, to) <= 0);

/** Run the pending migrations on one app. Each gets { appDir, files, read, write }; returns what changed. */
export async function runMigrations({ appDir, dir, from, to }) {
  const results = [];
  for (const m of pending(await loadMigrations(dir), from, to)) {
    const changed = new Set();
    const files = scanTargets(appDir).files;
    await m.run({
      appDir,
      files,
      read: (p) => readFileSync(p, "utf8"),
      write: (p, text) => {
        if (readFileSync(p, "utf8") === text) return;
        writeFileSync(p, text);
        changed.add(relative(appDir, p));
      },
    });
    results.push({ id: m.id, version: m.version, description: m.description, changed: [...changed].sort() });
  }
  return results;
}
