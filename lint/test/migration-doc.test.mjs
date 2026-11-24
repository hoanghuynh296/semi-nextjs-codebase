// node --test lint/test — docs/MIGRATION-1.0.md is checked against the 1.0 release migrations: every 1.0 migration is
// named, and every name the foundation migration renames appears in the guide, so the guide cannot fall behind the script.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { COLORS, SIZES } from "../../migrations/1.0.0-foundation.mjs";

const root = new URL("../..", import.meta.url).pathname;
const guide = readFileSync(join(root, "docs/MIGRATION-1.0.md"), "utf8");

test("MIGRATION-1.0.md names every 1.0 release migration", () => {
  const ids = readdirSync(join(root, "migrations"))
    .filter((f) => /^1\.0\.\d+-[\w-]+\.mjs$/.test(f))
    .map((f) => f.replace(/\.mjs$/, ""));
  assert.ok(ids.length > 0);
  for (const id of ids) assert.ok(guide.includes(`\`${id}\``), `docs/MIGRATION-1.0.md does not name ${id}`);
});

test("MIGRATION-1.0.md lists every colour and size the foundation migration renames", () => {
  for (const [from, to] of Object.entries(COLORS)) {
    assert.ok(guide.includes(from), `colour ${from} is not in docs/MIGRATION-1.0.md`);
    assert.ok(guide.includes(to), `colour ${to} (from ${from}) is not in docs/MIGRATION-1.0.md`);
  }
  for (const [from, to] of Object.entries(SIZES)) {
    assert.ok(guide.includes(`text-${from}`), `size text-${from} is not in docs/MIGRATION-1.0.md`);
    assert.ok(guide.includes(`text-${to}`), `size text-${to} (from text-${from}) is not in docs/MIGRATION-1.0.md`);
  }
});

// The AGENTS block /semi-sync writes must not present a pending 1.0 part as available: every line that names a part of
// a ticket the guide's status table does not list as merged also says "pending". When a ticket merges, its row says
// "merged" and its names may stand alone.
const PENDING_NAMES = {
  T2: ["RouteHeader", "avatar menu"],
  T4: ["`subtle`", "`surface`", "`inverse`"],
  T5: ["PillTabs", "SegmentedControl"],
  T7: ["**work**", "**reading**", "**two-column**"],
};
test("the AGENTS block marks each pending 1.0 part as pending", () => {
  const rules = readFileSync(join(root, "plugin/rules/AGENTS.md"), "utf8").split("\n");
  for (const [ticket, names] of Object.entries(PENDING_NAMES)) {
    const row = guide.split("\n").find((l) => l.startsWith(`| ${ticket} #`));
    assert.ok(row, `no status row for ${ticket} in docs/MIGRATION-1.0.md`);
    if (/merged|shipped/.test(row)) continue;
    for (const name of names)
      for (const line of rules.filter((l) => l.includes(name)))
        assert.match(line, /pending/, `plugin/rules/AGENTS.md names ${name} (${ticket}) without saying it is pending: ${line.slice(0, 80)}`);
  }
});

// A range of pending tickets written in the AGENTS block ("T3, T5–T9", "T2–T9") must not include a merged one.
test("the AGENTS block's list of pending tickets leaves out every merged ticket", () => {
  const rules = readFileSync(join(root, "plugin/rules/AGENTS.md"), "utf8");
  const merged = guide
    .split("\n")
    .map((l) => l.match(/^\| (T\d+) #\d+ \|.*\b(?:merged|shipped)\b/))
    .filter(Boolean)
    .map((m) => Number(m[1].slice(1)));
  const lists = [...rules.matchAll(/pending[^\n]{0,40}?\((T\d+(?:[–-]T\d+)?(?:, T\d+(?:[–-]T\d+)?)*)\)|\((T\d+(?:[–-]T\d+)?(?:, T\d+(?:[–-]T\d+)?)*)\)/g)].map((m) => m[1] ?? m[2]);
  assert.ok(lists.length > 0, "no pending-ticket list found in plugin/rules/AGENTS.md");
  for (const list of lists) {
    const nums = list.split(", ").flatMap((p) => {
      const [a, b] = p.split(/[–-]/).map((x) => Number(x.replace("T", "")));
      return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
    });
    for (const n of merged) assert.ok(!nums.includes(n), `plugin/rules/AGENTS.md lists T${n} as pending in "(${list})", but MIGRATION-1.0.md says it is merged`);
  }
});
