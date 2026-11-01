// node --test lint/test — semi-lint rules on single lines and files.
import { test } from "node:test";
import assert from "node:assert/strict";
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
