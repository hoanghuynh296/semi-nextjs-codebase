"use client";

// A data table that sorts, filters, selects and pages rows on the client, built on Table. Feed it rows and column
// definitions; it keeps sort / page / selection state itself unless you control them.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "./Choice";
import { EmptyState } from "./Feedback";
import { Icon } from "./Icon";
import { Pagination } from "./Pagination";
import { Skeleton } from "./Skeleton";
import { skeletonCellClass } from "./skeletonShape";
import { TABLE, TBody, TD, TH, THead, TR } from "./Table";
import { foldColumns } from "./dataTableFold";
import { searchRows, sortRows } from "./listQuery";
import { useSemiLocale } from "./locale";
import { FOCUS_RING, HIT_AREA, cn } from "../styles/utils";

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
  /**
   * Let the column fold when the table is narrower than its columns need (measured on the table's own box, not the
   * viewport: a tablet next to the rail, a split view). Its value then shows on the first column's second line
   * (header read to screen readers). 3 folds first, then 2, then 1, the rightmost first within a priority. Columns
   * without it, and the first column, never fold. Default: never folds.
   */
  priority?: 1 | 2 | 3;
}

export interface DataTableSort {
  key: string;
  dir: "asc" | "desc";
}

/**
 * Sort by a column header (click again to reverse; aria-sort on the header), filter with `search` (every searchable
 * column, case and Vietnamese marks ignored), select rows with a checkbox column (select-all on the page, bulk
 * actions bar), page with Pagination. Shows skeleton rows while `loading` and an EmptyState when nothing is left.
 * When the columns do not fit its own box, columns with a `priority` fold into the first column's second line; what
 * still does not fit scrolls sideways, with a strong line (outline-line) on each edge that has columns past it and the table
 * focusable to scroll by keyboard. The sorted column never folds. Folding is measured after hydration, so a table
 * with priorities may shift once on first load at a narrow width.
 * The order it shows is `sortRows(searchRows(rows, columns, search), columns, sort)` (for DetailOverlay ‹ ›).
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
  stickyFirstColumn = false,
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
  /**
   * Keep the first column (and the checkbox column) in place while the table scrolls sideways, so every row stays
   * named. The table then sits on `bg-card`.
   */
  stickyFirstColumn?: boolean;
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
  const filtered = useMemo(() => searchRows(rows, columns, search), [rows, columns, search]);
  const sorted = useMemo(() => sortRows(filtered, columns, sort), [filtered, columns, sort]);
  const pages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const visible = useMemo(() => (pageSize > 0 ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted), [sorted, page, pageSize]);
  const visibleIds = visible.map(getRowId);
  const onPage = visibleIds.filter((id) => selected.includes(id)).length;

  // Fit (#130): measured on the scroll box, so the table folds by its own width, not the viewport's. The columns'
  // minimum widths are read with the table at min-content (one line per cell; the folded line takes no width), so
  // the result does not depend on what is folded now and cannot flip back and forth.
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const widths = useRef<Record<string, number>>({});
  const [folded, setFolded] = useState<string[]>([]);
  const [edges, setEdges] = useState({ left: false, right: false, scrolls: false });
  const [lead, setLead] = useState({ check: 0, first: 0 }); // widths of the sticky cells (checkbox, first column)
  const canFold = columns.some((c, i) => i > 0 && c.priority != null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  // the sorted column never folds: its header is the only control that shows and changes the sort
  const sortKeyRef = useRef(sort?.key);
  sortKeyRef.current = sort?.key;
  // which edges have more columns past them (the edge lines); on scroll only this runs
  const measureEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 0;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    const scrolls = el.scrollWidth > el.clientWidth + 1;
    setEdges((e) => (e.left === left && e.right === right && e.scrolls === scrolls ? e : { left, right, scrolls }));
  }, []);
  const measure = useCallback(() => {
    const el = scrollRef.current;
    const table = tableRef.current;
    if (!el || !table) return;
    if (canFold) {
      const prev = table.style.width;
      const x = el.scrollLeft; // the min-content pass can clamp it
      table.style.width = "min-content";
      let sum = 0;
      for (const th of Array.from(table.querySelectorAll<HTMLElement>("thead th[data-col]"))) {
        const w = th.getBoundingClientRect().width;
        widths.current[th.dataset.col!] = w;
        sum += w;
      }
      const extra = table.getBoundingClientRect().width - sum;
      table.style.width = prev;
      el.scrollLeft = x;
      // offsetWidth: the edge lines (a border shown only while it scrolls) must not change what fits
      const next = foldColumns(columnsRef.current, widths.current, el.offsetWidth, extra, sortKeyRef.current);
      setFolded((f) => (f.join("\n") === next.join("\n") ? f : next));
    }
    measureEdges();
    if (stickyFirstColumn) {
      const check = table.querySelector<HTMLElement>("thead th[data-check]")?.getBoundingClientRect().width ?? 0;
      const first = table.querySelector<HTMLElement>("thead th[data-col]")?.getBoundingClientRect().width ?? 0;
      setLead((l) => (l.check === check && l.first === first ? l : { check, first }));
    }
  }, [canFold, stickyFirstColumn, measureEdges]);
  useLayoutEffect(() => {
    measure();
    const el = scrollRef.current;
    const table = tableRef.current;
    if (!el || !table) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(table);
    return () => ro.disconnect();
  }, [measure]);
  // New rows, columns or fonts can change the minimum widths, also of folded columns: show every column again and
  // measure them all (layout effects run before paint, so the unfolded table is never seen). Then each fold
  // re-measures, which also updates the scroll edges.
  const [fontsReady, setFontsReady] = useState(0);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    const done = () => setFontsReady((n) => n + 1);
    fonts.addEventListener?.("loadingdone", done);
    return () => fonts.removeEventListener?.("loadingdone", done);
  }, []);
  const foldedRef = useRef(folded);
  foldedRef.current = folded;
  useLayoutEffect(() => {
    if (canFold && foldedRef.current.length) setFolded([]);
    else measure();
  }, [measure, canFold, visible, columns, loading, selectable, fontsReady]);
  useLayoutEffect(measure, [measure, folded]);

  const shown = folded.length ? columns.filter((c) => !folded.includes(c.key)) : columns;
  const foldedCols = folded.length ? columns.filter((c) => folded.includes(c.key)) : [];
  const sticky = stickyFirstColumn && edges.scrolls;
  // The scroll cue: a solid 2px outline-line on each edge that has columns past it, on the scroll box's own border (so
  // the focus ring, an inset ring, stays whole inside it). With a sticky column the left line is that column's edge.
  const edgeLines =
    edges.scrolls &&
    cn(
      "border-r-2",
      edges.right ? "border-r-outline-line" : "border-r-transparent",
      !sticky && cn("border-l-2", edges.left ? "border-l-outline-line" : "border-l-transparent"),
    );
  const pinned = (isFirst: boolean, left: number) =>
    sticky
      ? {
          // the pinned column's edge is a ::before line, not a border: a collapsed table's borders do not move with a sticky cell
          className: cn(
            "sticky z-sticky",
            isFirst && cn("before:pointer-events-none before:absolute before:inset-y-0 before:right-0", edges.left ? "before:w-0.5 before:bg-outline-line" : "before:w-px before:bg-line"),
          ),
          style: { left },
        }
      : { className: undefined, style: undefined };
  // a sticky body cell paints the card under the row's own fill, so scrolled cells do not show through it
  const pinnedBody = (isSel: boolean) =>
    sticky &&
    cn(
      "bg-card after:pointer-events-none after:absolute after:inset-0 after:-z-10",
      isSel
        ? cn("after:bg-item-checked", onRowClick && "group-hover/row:after:bg-item-selected")
        : onRowClick && "group-hover/row:after:bg-item-hover",
    );

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
          <span className="text-ui font-medium text-strong tabular-nums">{t.selectedCount(selected.length)}</span>
          <span className="ml-auto flex flex-wrap gap-2">{bulkActions(selected)}</span>
        </div>
      )}
      <div className={cn("rounded-card border border-line overflow-hidden", stickyFirstColumn && "bg-card")}>
        {/* scrolls sideways when the columns still do not fit: focusable then, so the arrow keys scroll it */}
        <div
          ref={scrollRef}
          onScroll={measureEdges}
          role={edges.scrolls ? "region" : undefined}
          aria-label={edges.scrolls ? label : undefined}
          tabIndex={edges.scrolls ? 0 : undefined}
          data-edges={edges.scrolls ? [edges.left && "left", edges.right && "right"].filter(Boolean).join(" ") || "none" : undefined}
          className={cn("w-full overflow-x-auto overscroll-x-contain isolate outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus", edgeLines)}
        >
          <table ref={tableRef} className={TABLE} aria-busy={loading || undefined}>
            <caption className="sr-only">{label}</caption>
            <THead>
              <TR>
                {selectable && (
                  <TH data-check="" {...pinned(false, 0)} className={cn("w-10", pinned(false, 0).className)}>
                    <Checkbox
                      checked={onPage > 0 && onPage === visibleIds.length}
                      indeterminate={onPage > 0 && onPage < visibleIds.length}
                      onChange={togglePage}
                      disabled={loading || visibleIds.length === 0}
                      aria-label={t.selectAll}
                    />
                  </TH>
                )}
                {shown.map((c, ci) => {
                  const active = sort?.key === c.key;
                  const pin = ci === 0 ? pinned(true, lead.check) : null;
                  return (
                    <TH
                      key={c.key}
                      data-col={c.key}
                      align={c.numeric ? "right" : "left"}
                      aria-sort={c.sortable ? (active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none") : undefined}
                      className={pin?.className}
                      style={pin?.style}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={cn("relative inline-flex items-center gap-1 rounded-chip hover:text-strong", active && "text-strong", c.numeric && "flex-row-reverse", HIT_AREA, FOCUS_RING)}
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
                    // shaped like the real rows (first column long, numbers short and right-aligned); hidden from AT,
                    // the table says aria-busy
                    <TR key={`s${i}`} aria-hidden>
                      {selectable && (
                        <TD {...pinned(false, 0)} className={cn(pinned(false, 0).className, pinnedBody(false))}>
                          <Skeleton className="w-4 h-4 !rounded-chip" />
                        </TD>
                      )}
                      {shown.map((c, ci) => {
                        const pin = ci === 0 ? pinned(true, lead.check) : null;
                        return (
                          <TD key={c.key} numeric={c.numeric} className={cn(pin?.className, pin && pinnedBody(false))} style={pin?.style}>
                            <Skeleton className={cn("h-3.5", skeletonCellClass(ci, i, c.numeric))} />
                          </TD>
                        );
                      })}
                    </TR>
                  ))
                : visible.map((row) => {
                    const id = getRowId(row);
                    const isSel = selected.includes(id);
                    return (
                      <TR
                        key={id}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        aria-selected={selectable ? isSel : undefined}
                        // a checked row keeps its fill on hover (one step stronger), like its pinned cell
                        className={cn("group/row", isSel && cn("bg-item-checked", onRowClick && "hover:!bg-item-selected"))}
                      >
                        {selectable && (
                          <TD onClick={(e) => e.stopPropagation()} {...pinned(false, 0)} className={cn(pinned(false, 0).className, pinnedBody(isSel))}>
                            <Checkbox checked={isSel} onChange={(on) => toggleRow(id, on)} aria-label={t.selectRow} />
                          </TD>
                        )}
                        {shown.map((c, ci) => {
                          const pin = ci === 0 ? pinned(true, lead.check) : null;
                          const content = c.cell ? c.cell(row) : (valueOf(c, row) ?? "");
                          return (
                            <TD key={c.key} numeric={c.numeric} wrap={c.wrap} className={cn(pin?.className, pin && pinnedBody(isSel))} style={pin?.style}>
                              {ci === 0 && foldedCols.length > 0 ? (
                                <>
                                  <div>{content}</div>
                                  {/* the folded values: w-0 + min-w-full, so this line wraps in the column's width
                                      instead of widening it */}
                                  <div className="w-0 min-w-full whitespace-normal text-ui text-muted mt-0.5" data-folded="">
                                    {foldedCols.map((f) => {
                                      // no value, no "Header: " (a cell() may draw an element even for an empty value)
                                      const raw = valueOf(f, row);
                                      if (raw == null || raw === "") return null;
                                      const v = f.cell ? f.cell(row) : raw;
                                      return (
                                        <span key={f.key} className="mr-3 inline-block">
                                          <span className="sr-only">{f.header}: </span>
                                          {v}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                content
                              )}
                            </TD>
                          );
                        })}
                      </TR>
                    );
                  })}
            </TBody>
          </table>
        </div>
        {!loading && visible.length === 0 && <div className="border-t border-divider">{empty ?? <EmptyState icon="search" title={t.noData} className="!border-0" />}</div>}
      </div>
      {pageSize > 0 && pages > 1 && !loading && <Pagination page={page} pages={pages} onChange={setPage} className="justify-end" />}
    </div>
  );
}
