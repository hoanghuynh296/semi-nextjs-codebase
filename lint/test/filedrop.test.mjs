// node --test lint/test — pure helpers of FileDrop (src/fileDropUtils.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyFiles, formatFileSize, matchesAccept } from "../../src/fileDropUtils.ts";

const f = (name, size = 10, type = "") => ({ name, size, type });

test("matchesAccept: extensions, MIME types and wildcards, case-insensitive; no list accepts all", () => {
  assert.equal(matchesAccept(f("a.CSV"), [".csv"]), true);
  assert.equal(matchesAccept(f("a.txt"), [".csv", ".xlsx"]), false);
  assert.equal(matchesAccept(f("a.png", 1, "image/png"), ["image/*"]), true);
  assert.equal(matchesAccept(f("a.pdf", 1, "application/pdf"), ["image/*"]), false);
  assert.equal(matchesAccept(f("a.pdf", 1, "application/pdf"), ["application/pdf"]), true);
  assert.equal(matchesAccept(f("x"), undefined), true);
  assert.equal(matchesAccept(f("x"), []), true);
});

test("formatFileSize", () => {
  assert.equal(formatFileSize(0), "0 B");
  assert.equal(formatFileSize(1023), "1023 B");
  assert.equal(formatFileSize(1536), "1.5 KB");
  assert.equal(formatFileSize(48_200), "47 KB");
  assert.equal(formatFileSize(5 * 1024 * 1024), "5.0 MB");
  assert.equal(formatFileSize(3 * 1024 ** 3), "3.0 GB");
});

test("classifyFiles: type, size, directory, duplicate (existing and in batch), multiple", () => {
  const dir = f("folder", 0);
  const r = classifyFiles(
    [f("a.csv"), f("a.csv"), f("b.txt"), f("big.csv", 99), f("have.csv", 5), dir, f("c.csv")],
    { accept: [".csv"], maxSize: 50, multiple: true, existing: [{ name: "have.csv", size: 5 }], directories: new Set([dir]) },
  );
  assert.deepEqual(r.accepted.map((x) => x.name), ["a.csv", "c.csv"]);
  assert.deepEqual(r.rejected.map((x) => `${x.file.name}:${x.reason}`), ["a.csv:duplicate", "b.txt:type", "big.csv:size", "have.csv:duplicate", "folder:directory"]);
  // same name, different size is not a duplicate
  assert.equal(classifyFiles([f("a.csv", 1), f("a.csv", 2)], { multiple: true }).accepted.length, 2);
});

test("classifyFiles: multiple off keeps the first valid file and rejects the rest as multiple", () => {
  const r = classifyFiles([f("bad.txt"), f("a.csv"), f("b.csv")], { accept: [".csv"] });
  assert.deepEqual(r.accepted.map((x) => x.name), ["a.csv"]);
  assert.deepEqual(r.rejected.map((x) => `${x.file.name}:${x.reason}`), ["bad.txt:type", "b.csv:multiple"]);
});
