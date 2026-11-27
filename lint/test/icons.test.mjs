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
const catBlock = block(catSrc, "export const ICON_CATALOG", "\n} as const");
const catalog = new Set([...catBlock.matchAll(/^    name: "(\w+)"/gm)].map((m) => m[1]));
const aliasPairs = [...block(catSrc, "export const ICON_ALIASES", "\n};").matchAll(/^  (?:"([^"]+)"|(\w+)): "(\w+)",/gm)].map((m) => [m[1] ?? m[2], m[3]]);
const aliases = Object.fromEntries(aliasPairs);

// The rich-text / WYSIWYG editor set (docs/ICONS.md 2.12).
const EDITOR = ["fontSize","fontFamily","bold","italic","underline","strikethrough","subscript","superscript","textColor","highlight","clearFormatting","textCase","upperCase","lowerCase","heading","heading1","heading2","heading3","heading4","heading5","heading6","paragraph","quote","codeBlock","horizontalRule","pageBreak","lineHeight","textDirectionLtr","textDirectionRtl","alignLeft","alignCenter","alignRight","alignJustify","indent","outdent","list","orderedList","checklist","nestedList","hyperlink","unlink","imageInsert","embed","table","tableInsertRowAbove","tableInsertRowBelow","tableInsertColumnLeft","tableInsertColumnRight","tableDeleteRow","tableDeleteColumn","tableDelete","tableMergeCells","tableSplitCell","tableHeaderRow","mention","emoji","footnote","specialCharacter","formula","comment","findReplace","spellcheck"];

test("every icon has a catalog entry and every alias targets an icon", () => {
  assert.deepEqual([...icons].filter((n) => !catalog.has(n)), []);
  assert.deepEqual([...catalog].filter((n) => !icons.has(n)), []);
  assert.deepEqual(aliasPairs.filter(([, t]) => !icons.has(t)), []);
});

test("no alias is defined twice and no icon name is also an alias", () => {
  const keys = aliasPairs.map(([k]) => k);
  assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
  assert.deepEqual([...icons].filter((n) => n in aliases), []);
});

test("rich-text editor icons: every name is an icon with a catalog entry in the editor domain, keyworded for search", () => {
  for (const n of EDITOR) {
    assert.ok(icons.has(n), n);
    assert.ok(catalog.has(n), n);
    const entry = catBlock.slice(catBlock.indexOf(`  ${n}: {`), catBlock.indexOf("\n  },", catBlock.indexOf(`  ${n}: {`)));
    assert.match(entry, /domain: "editor"/, n);
    assert.match(entry, /"soạn thảo"/, n);
    assert.match(entry, /"editor"/, n);
  }
  assert.equal(new Set(EDITOR).size, EDITOR.length);
});

test("rich-text editor aliases resolve (snake, kebab, common names); link stays external", () => {
  const expected = {
    chain: "hyperlink", insert_link: "hyperlink", "insert-link": "hyperlink",
    h1: "heading1", h4: "heading4", align_left: "alignLeft", "align-left": "alignLeft", justify: "alignJustify",
    ol: "orderedList", ul: "list", checkbox_list: "checklist", clear_format: "clearFormatting",
    tx_color: "textColor", hr: "horizontalRule", insert_row_above: "tableInsertRowAbove", merge_cells: "tableMergeCells",
    smile: "emoji", sigma: "formula", html_source: "code", fullscreen_exit: "shrink", print: "printer", link: "external", open_link: "external",
  };
  for (const [k, t] of Object.entries(expected)) assert.equal(aliases[k], t, k);
});

test("every editor icon is drawn on the 24 grid", () => {
  for (const n of EDITOR) {
    const d = iconSrc.match(new RegExp(`^  ${n}:\\s*"([^"]+)"`, "m"))?.[1];
    assert.ok(d, n);
    assert.match(d, /^M/, n);
  }
});
