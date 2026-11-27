// Every icon has a catalog entry; every alias points at a real icon; the rich-text editor set (#217) resolves.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const iconSrc = readFileSync(join(root, "src/Icon.tsx"), "utf8");
const catSrc = readFileSync(join(root, "src/iconCatalog.ts"), "utf8");
const block = (src, start, end) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));
const icons = new Set([...block(iconSrc, "export const ICONS = {", "\n} as const").matchAll(/^  (\w+):/gm)].map((m) => m[1]));
const catalog = new Set([...block(catSrc, "export const ICON_CATALOG", "\n} as const").matchAll(/^    name: "(\w+)"/gm)].map((m) => m[1]));
const aliases = Object.fromEntries(
  [...block(catSrc, "export const ICON_ALIASES", "\n};").matchAll(/^  (?:"([^"]+)"|(\w+)): "(\w+)",/gm)].map((m) => [m[1] ?? m[2], m[3]]),
);

test("every icon has a catalog entry and every alias targets an icon", () => {
  assert.deepEqual([...icons].filter((n) => !catalog.has(n)), []);
  assert.deepEqual([...catalog].filter((n) => !icons.has(n)), []);
  assert.deepEqual(Object.entries(aliases).filter(([, t]) => !icons.has(t)), []);
});

test("rich-text editor icons and their aliases resolve; link stays external", () => {
  for (const n of ["fontSize", "bold", "italic", "underline", "strikethrough", "quote", "hyperlink", "table", "list", "orderedList"]) {
    assert.ok(icons.has(n), n);
    assert.ok(catalog.has(n), n);
  }
  assert.equal(aliases.chain, "hyperlink");
  assert.equal(aliases.insert_link, "hyperlink");
  assert.equal(aliases.link, "external");
  assert.equal(aliases.open_link, "external");
});
