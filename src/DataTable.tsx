"use client";

// A data table that sorts, filters, selects and pages rows on the client, built on Table. Feed it rows and column
// definitions; it keeps sort / page / selection state itself unless you control them.
import React, { useEffect, useMemo, useState } from "react";
import { Checkbox } from "./Choice";
import { EmptyState } from "./Feedback";
import { Icon } from "./Icon";
import { Pagination } from "./Pagination";
import { Skeleton } from "./Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "./Table";
import { normalizeSearch } from "./Command";
import { useSemiLocale } from "./locale";
import { FOCUS_RING, cn } from "../styles/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Value used to sort and search (default: row[key]). */
  value?: (row: T) => string | number | null | undefined;
  /** What the cell shows (default: the value). */
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Right-aligned tabular figures (money, counts). */
  numeric?: boolean;
  /** Let long text wrap (notes, descriptions). */
  wrap?: boolean;
  /** Leave the column out of the search (default: searched). */
  searchable?: boolean;
}

export interface DataTableSort {
  key: string;
  dir: "asc" | "desc";
}

/**
 * Sort by a column header (click again to reverse; aria-sort on the header), filter with `search` (every searchable
 * column, case and Vietnamese marks ignored), select rows with a checkbox column (select-all on the page, bulk
 * actions bar), page with Pagination. Shows skeleton rows while `loading` and an EmptyState when nothing is left.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  label,
  search = "",
  sort: sortProp,
  defaultSort,
  onSortChange,
  selectable = false,
  selected: selectedProp,
  onSelectedChange,
  bulkActions,
  pageSize = 0,
  loading = false,
  empty,
  onRowClick,
  className,
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Accessible name of the table (a visually hidden caption). */
  label: string;
  /** Filter text, usually from the toolbar's SearchInput. */
  search?: string;
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort;
  onSortChange?: (sort: DataTableSort | null) => void;
  /** Add a checkbox column. */
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Shown above the table while rows are selected: buttons that act on the selection. */
  bulkActions?: (ids: string[]) => React.ReactNode;
  /** Rows per page; 0 shows all rows. */
  pageSize?: number;
  loading?: boolean;
  /** Shown when there are no rows (or none match the search). */
  empty?: React.ReactNode;
  /** Make rows clickable (open the record). Keep a link or button in the row for keyboard users. */
  onRowClick?: (row: T) => void;
  className?: string;
}) {
  const t = useSemiLocale();
  const [ownSort, setOwnSort] = useState<DataTableSort | null>(defaultSort ?? null);
  const sort = sortProp === undefined ? ownSort : sortProp;
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const selected = selectedProp ?? ownSelected;
  const setSelected = (ids: string[]) => {
    if (selectedProp === undefined) setOwnSelected(ids);
    onSelectedChange?.(ids);
  };
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [search, sort?.key, sort?.dir, pageSize]);

  const valueOf = (col: DataTableColumn<T>, row: T) => (col.value ? col.value(row) : (row as Record<string, unknown>)[col.key]) as string | number | null | undefined;
  const filtered = useMemo(() => {
    const words = normalizeSearch(search).split(/\s+/).filter(Boolean);
    if (!words.length) return rows;
    const cols = columns.filter((c) => c.searchable !== false);
    return rows.filter((row) => {
      const hay = cols.map((c) => normalizeSearch(String(valueOf(c, row) ?? ""))).join(" ");
      return words.every((w) => hay.includes(w));
    });
  }, [rows, columns, search]); // eslint-disable-line react-hooks/exhaustive-deps
  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const dir = sort!.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = valueOf(col, a);
      const y = valueOf(col, b);
      if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "vi", { numeric: true })) * dir;
    });
  }, [filtered, sort, columns]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const visible = pageSize > 0 ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;
  const visibleIds = visible.map(getRowId);
  const onPage = visibleIds.filter((id) => selected.includes(id)).length;

  const toggleSort = (key: string) => {
    const next: DataTableSort | null = !sort || sort.key !== key ? { key, dir: "asc" } : sort.dir === "asc" ? { key, dir: "desc" } : null;
    if (sortProp === undefined) setOwnSort(next);
    onSortChange?.(next);
  };
  const toggleRow = (id: string, on: boolean) => setSelected(on ? [...selected, id] : selected.filter((x) => x !== id));
  const togglePage = (on: boolean) => setSelected(on ? [...new Set([...selected, ...visibleIds])] : selected.filter((id) => !visibleIds.includes(id)));

  return (
    <div className={cn("space-y-3", className)}>
      {selectable && selected.length > 0 && bulkActions && (
        <div role="region" aria-label={t.selectedCount(selected.length)} className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-field px-3 py-2">
          <span className="text-label font-medium text-contrast tabular-nums">{t.selectedCount(selected.length)}</span>
          <span className="ml-auto flex flex-wrap gap-2">{bulkActions(selected)}</span>
        </div>
      )}
      <div className="rounded-card border border-line overflow-hidden">
        <Table aria-busy={loading || undefined}>
          <caption className="sr-only">{label}</caption>
          <THead>
            <TR>
              {selectable && (
                <TH className="w-10">
                  <Checkbox
                    checked={onPage > 0 && onPage === visibleIds.length}
                    indeterminate={onPage > 0 && onPage < visibleIds.length}
                    onChange={togglePage}
                    disabled={loading || visibleIds.length === 0}
                    label={<span className="sr-only">{t.selectAll}</span>}
                  />
                </TH>
              )}
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <TH key={c.key} align={c.numeric ? "right" : "left"} aria-sort={c.sortable ? (active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none") : undefined}>
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn("inline-flex items-center gap-1 rounded-chip hover:text-contrast", active && "text-contrast", c.numeric && "flex-row-reverse", FOCUS_RING)}
                      >
                        {c.header}
                        <Icon name={active && sort!.dir === "desc" ? "chevronDown" : "chevronUp"} className={cn("w-3.5 h-3.5", active ? "opacity-100" : "opacity-40")} />
                      </button>
                    ) : (
                      c.header
                    )}
                  </TH>
                );
              })}
            </TR>
          </THead>
          <TBody>
            {loading
              ? Array.from({ length: Math.min(pageSize || 5, 5) }, (_, i) => (
                  <TR key={`s${i}`}>
                    {selectable && <TD />}
                    {columns.map((c) => (
                      <TD key={c.key}>
                        <Skeleton className="h-3.5 w-24" />
                      </TD>
                    ))}
                  </TR>
                ))
              : visible.map((row) => {
                  const id = getRowId(row);
                  const isSel = selected.includes(id);
                  return (
                    <TR key={id} onClick={onRowClick ? () => onRowClick(row) : undefined} aria-selected={selectable ? isSel : undefined} className={cn(isSel && "bg-primary-500/5")}>
                      {selectable && (
                        <TD onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSel} onChange={(on) => toggleRow(id, on)} label={<span className="sr-only">{t.selectRow}</span>} />
                        </TD>
                      )}
                      {columns.map((c) => (
                        <TD key={c.key} numeric={c.numeric} wrap={c.wrap}>
                          {c.cell ? c.cell(row) : (valueOf(c, row) ?? "")}
                        </TD>
                      ))}
                    </TR>
                  );
                })}
          </TBody>
        </Table>
        {!loading && visible.length === 0 && <div className="border-t border-divider">{empty ?? <EmptyState icon="search" title={t.noData} className="!border-0" />}</div>}
      </div>
      {pageSize > 0 && pages > 1 && !loading && <Pagination page={page} pages={pages} onChange={setPage} className="justify-end" />}
    </div>
  );
}
