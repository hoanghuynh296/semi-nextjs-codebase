// The repo is public and its docs are copied into public/ (llms-full.txt, docs/*): no local machine paths in them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const LOCAL = /file:\/\/\/|\/Users\/[A-Za-z]|\/home\/[a-z][\w-]*\//;

function* files(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(md|txt|json)$/.test(f)) yield p;
  }
}

test("docs and their public copies hold no local machine paths", () => {
  const hits = [];
  for (const p of [...files(join(root, "docs")), ...files(join(root, "public")), join(root, "README.md"), join(root, "AGENTS.md")]) {
    readFileSync(p, "utf8")
      .split("\n")
      .forEach((line, i) => LOCAL.test(line) && hits.push(`${p.slice(root.length + 1)}:${i + 1}`));
  }
  assert.deepEqual(hits, []);
});
