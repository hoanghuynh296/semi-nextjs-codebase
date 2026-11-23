// DataTable's pure parts (#124, #130): the order it shows (sortRows / searchRows, exported for DetailOverlay ‹ ›) and
// which columns fold when it is too narrow (foldColumns, internal).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { searchRows, sortRows } from "../../src/listQuery.ts";
import { foldColumns } from "../../src/dataTableFold.ts";

const rows = [
  { id: "SO-10", customer: "Đặng Ánh", total: 300, note: null },
  { id: "SO-9", customer: "an bình", total: 100, note: "giao gấp" },
  { id: "SO-100", customer: "Bùi Chi", total: 200, note: "Hoàng Hà" },
  { id: "SO-2", customer: "Ân Thơ", total: 200, note: undefined },
];
const columns = [
  { key: "id", header: "Mã" },
  { key: "customer", header: "Khách" },
  { key: "total", header: "Tổng", numeric: true },
  { key: "note", header: "Ghi chú", searchable: false },
  { key: "upper", header: "Mã hoa", value: (r) => r.id.toLowerCase() },
];
const ids = (list) => list.map((r) => r.id);

test("sortRows: numbers by value, ties keep input order, desc reverses", () => {
  assert.deepEqual(ids(sortRows(rows, columns, { key: "total", dir: "asc" })), ["SO-9", "SO-100", "SO-2", "SO-10"]);
  assert.deepEqual(ids(sortRows(rows, columns, { key: "total", dir: "desc" })), ["SO-10", "SO-100", "SO-2", "SO-9"]);
});

test("sortRows: text in Vietnamese order with numbers inside compared as numbers", () => {
  assert.deepEqual(ids(sortRows(rows, columns, { key: "id", dir: "asc" })), ["SO-2", "SO-9", "SO-10", "SO-100"]);
  assert.deepEqual(
    sortRows(rows, columns, { key: "customer", dir: "asc" }).map((r) => r.customer),
    [...rows.map((r) => r.customer)].sort((a, b) => a.localeCompare(b, "vi", { numeric: true })),
  );
  // value() is what sorts, not row[key]
  assert.deepEqual(ids(sortRows(rows, columns, { key: "upper", dir: "desc" })), ["SO-100", "SO-10", "SO-9", "SO-2"]);
});

test("sortRows: empty values last in both directions; no sort or unknown key returns the rows as they are", () => {
  assert.deepEqual(ids(sortRows(rows, columns, { key: "note", dir: "asc" })).slice(2).sort(), ["SO-10", "SO-2"]);
  assert.deepEqual(ids(sortRows(rows, columns, { key: "note", dir: "desc" })).slice(2).sort(), ["SO-10", "SO-2"]);
  assert.equal(sortRows(rows, columns, null), rows);
  assert.equal(sortRows(rows, columns, undefined), rows);
  assert.equal(sortRows(rows, columns, { key: "nope", dir: "asc" }), rows);
  assert.deepEqual(ids(rows), ["SO-10", "SO-9", "SO-100", "SO-2"], "input not mutated");
});

test("searchRows: every word, case and Vietnamese marks ignored, searchable: false left out", () => {
  assert.deepEqual(ids(searchRows(rows, columns, "AN")), ["SO-10", "SO-9", "SO-2"]); // Ánh, an, Ân
  assert.deepEqual(ids(searchRows(rows, columns, "dang anh")), ["SO-10"]);
  assert.deepEqual(ids(searchRows(rows, columns, "so-9 bình")), ["SO-9"]);
  assert.deepEqual(ids(searchRows(rows, columns, "hoang")), [], "the note column is not searched");
  assert.deepEqual(ids(searchRows(rows, columns, "300")), ["SO-10"], "numbers are searched as text");
  assert.equal(searchRows(rows, columns, "  "), rows);
});

test("DataTable shows rows in the order of sortRows(searchRows(…)) (parity: it calls them, not a copy)", () => {
  const src = readFileSync(new URL("../../src/DataTable.tsx", import.meta.url), "utf8");
  assert.match(src, /searchRows\(rows, columns, search\)/);
  assert.match(src, /sortRows\(filtered, columns, sort\)/);
  assert.doesNotMatch(src, /localeCompare/, "no second comparator in DataTable");
  const index = readFileSync(new URL("../../src/index.ts", import.meta.url), "utf8");
  assert.match(index, /export \* from "\.\/listQuery"/);
  assert.doesNotMatch(index, /dataTableFold/, "foldColumns stays internal");
});

const cols = [
  { key: "name" },
  { key: "phone", priority: 2 },
  { key: "city", priority: 1 },
  { key: "source", priority: 3 },
  { key: "owner", priority: 3 },
  { key: "contact", priority: 2 },
  { key: "spent" },
];
const w = { name: 200, phone: 120, city: 100, source: 90, owner: 130, contact: 100, spent: 110 }; // 850

test("foldColumns: nothing folds when the columns fit", () => {
  assert.deepEqual(foldColumns(cols, w, 850), []);
  assert.deepEqual(foldColumns(cols, w, 2000, 40), []);
  assert.deepEqual(foldColumns([{ key: "a" }, { key: "b" }], { a: 500, b: 500 }, 300), [], "no priorities: never folds");
});

test("foldColumns: priority 3 first (rightmost first), then 2, then 1, no more than needed", () => {
  assert.deepEqual(foldColumns(cols, w, 849), ["owner"]);
  assert.deepEqual(foldColumns(cols, w, 720), ["owner"]);
  assert.deepEqual(foldColumns(cols, w, 719), ["owner", "source"]);
  assert.deepEqual(foldColumns(cols, w, 630), ["owner", "source"]);
  assert.deepEqual(foldColumns(cols, w, 629), ["owner", "source", "contact"]);
  assert.deepEqual(foldColumns(cols, w, 529), ["owner", "source", "contact", "phone"]);
  assert.deepEqual(foldColumns(cols, w, 400), ["owner", "source", "contact", "phone", "city"], "all candidates folded: the rest scrolls");
});

test("foldColumns: extra width (checkbox column) counts; the first column never folds; unknown widths count as 0", () => {
  assert.deepEqual(foldColumns(cols, w, 850, 40), ["owner"]);
  assert.deepEqual(foldColumns([{ key: "a", priority: 3 }, { key: "b" }], { a: 500, b: 500 }, 300), []);
  assert.deepEqual(foldColumns([{ key: "a" }, { key: "b", priority: 1 }, { key: "c", priority: 3 }], { a: 100, b: 100 }, 150), ["c", "b"]);
});

test("foldColumns: the sorted column (keep) never folds; the next candidate folds instead", () => {
  assert.deepEqual(foldColumns(cols, w, 849, 0, "owner"), ["source"]);
  assert.deepEqual(foldColumns(cols, w, 630, 0, "source"), ["owner", "contact"]);
  assert.deepEqual(foldColumns(cols, w, 400, 0, "contact"), ["owner", "source", "phone", "city"]);
  assert.deepEqual(foldColumns(cols, w, 849, 0, "spent"), ["owner"], "a column without priority as keep changes nothing");
});
