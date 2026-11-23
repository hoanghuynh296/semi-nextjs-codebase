// Search and order of lists, as pure functions (no React, no window: they run on the server, in a test or in a memo).
// normalizeSearch is the matching of Command and DataTable (people type without Vietnamese marks); searchRows and
// sortRows are the order DataTable shows its rows in (#124): DataTable itself uses them, so a list that opens its
// rows in a DetailOverlay walks the same filtered, sorted order (‹ › and "n / N") without copying the comparator.
//   const shown = sortRows(searchRows(rows, columns, q), columns, sort); // what the table shows, all pages
import type { DataTableColumn, DataTableSort } from "./DataTable";

/** Lowercase, no Vietnamese marks (đ → d): "Đơn hàng" matches "don hang". */
export const normalizeSearch = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();

type Value = string | number | null | undefined;
const valueOf = <T>(col: DataTableColumn<T>, row: T): Value => (col.value ? col.value(row) : (row as Record<string, unknown>)[col.key]) as Value;

/**
 * The rows DataTable keeps for `search`: every word of the query (case and Vietnamese marks ignored) must appear in the
 * searchable columns' values (`value`, else `row[key]`; `searchable: false` columns are left out). An empty query
 * returns `rows` itself.
 */
export function searchRows<T>(rows: T[], columns: DataTableColumn<T>[], query: string): T[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return rows;
  const cols = columns.filter((c) => c.searchable !== false);
  return rows.filter((row) => {
    const hay = cols.map((c) => normalizeSearch(String(valueOf(c, row) ?? ""))).join(" ");
    return words.every((w) => hay.includes(w));
  });
}

/**
 * The rows in DataTable's order for `sort`: numbers by value, text in Vietnamese order with numbers inside compared as
 * numbers ("SO-9" before "SO-10"), empty values (`null` / `undefined`) last in both directions, ties in their input
 * order. No sort, or a key no column has, returns `rows` itself.
 */
export function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: DataTableSort | null | undefined): T[] {
  const col = sort && columns.find((c) => c.key === sort.key);
  if (!sort || !col) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = valueOf(col, a);
    const y = valueOf(col, b);
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "vi", { numeric: true })) * dir;
  });
}
