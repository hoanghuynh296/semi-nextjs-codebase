"use client";

// Search and filters (#99, C-032 L3; 1.0 #149): one filter chip per facet on a single line (icon, label, count when
// active, chevron), a multi-select popover per chip, ‹ › when the row overflows, "Xoá lọc", and sort + "Chọn" (select
// mode) at the end. In selection mode, "n đã chọn" (600) and bulk actions (at most one filled button, rest in •••)
// replace the right side at the exact same height so nothing pushes the list down.
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Popover } from "./Popover";
import { Menu, type MenuItem } from "./Overlay";
import { Checkbox } from "./Choice";
import { useSemiLocale } from "./locale";
import {
  activeFilterCount,
  clearFilters,
  FILTER_PARAM_PREFIX,
  formatSort,
  parseSort,
  readFilters,
  readSort,
  writeFilters,
  writeSort,
  type FilterDef,
  type FilterSpec,
  type FilterValues,
} from "./filterParams";
import type { DataTableSort } from "./DataTable";
import type { SortDef } from "./SearchPill";
import { currentSearch, patchSearch, subscribeUrl, writeSearch } from "./urlState";
import { cn } from "../styles/utils";

/** The one filled bulk action shown directly on the filter row in selection mode; every other action goes into •••. */
export interface BulkAction {
  label: string;
  icon?: IconName;
  onClick: (selectedIds: string[]) => void;
  /** Button variant (default `"inverse"` inside a content card; never add a second brand primary). */
  variant?: "inverse" | "primary" | "subtle" | "surface";
  disabled?: boolean;
}

/**
 * Selection mode state and bulk actions shared by `FilterChipRow` (md+) and `PhoneFilterBar` (< md).
 * When `active` is true or `selected.length > 0`, the right side of the filter row swaps in place (same height, zero
 * layout shift) to `"n đã chọn"` (600), optional `•••` menu, at most one filled bulk button, and `"Xong"`.
 */
export interface ListSelection {
  /** Whether selection mode is open (via "Chọn", or automatically active while `selected.length > 0`). */
  active: boolean;
  /** Currently checked item IDs. */
  selected: string[];
  /** Enter selection mode ("Chọn"). */
  onEnter: () => void;
  /** Exit selection mode and clear checked items ("Xong"). */
  onExit: () => void;
  /** At most one filled bulk action button shown directly on the row. */
  primaryAction?: BulkAction;
  /** Every other bulk action goes into the ••• `Menu`. */
  moreActions?: MenuItem[] | ((selectedIds: string[]) => MenuItem[]);
}

/**
 * Local selection-mode state for list pages (table, card grid or phone `Item` rows): wire `active`, `selected`,
 * `onEnter` and `onExit` to `FilterChipRow` / `PhoneFilterBar` `selection`, and `toggle` / `isChecked` to rows or cards.
 */
export function useListSelection(initial: string[] = []) {
  const [state, setState] = useState<{ active: boolean; selected: string[] }>(() => ({
    active: initial.length > 0,
    selected: initial,
  }));
  const setSelected = useCallback((ids: string[]) => {
    setState((prev) => ({
      active: ids.length > 0 ? true : prev.active,
      selected: ids,
    }));
  }, []);
  const enter = useCallback(() => {
    setState((prev) => (prev.active ? prev : { ...prev, active: true }));
  }, []);
  const exit = useCallback(() => {
    setState({ active: false, selected: [] });
  }, []);
  const toggle = useCallback((id: string, checked?: boolean) => {
    setState((prev) => {
      const has = prev.selected.includes(id);
      const nextOn = checked === undefined ? !has : checked;
      const next = nextOn ? (has ? prev.selected : [...prev.selected, id]) : prev.selected.filter((x) => x !== id);
      return {
        active: next.length > 0 ? true : prev.active,
        selected: next,
      };
    });
  }, []);
  const isChecked = useCallback((id: string) => state.selected.includes(id), [state.selected]);
  return { active: state.active, selected: state.selected, enter, exit, toggle, setSelected, isChecked };
}

const CHIP =
  "shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-ui font-medium whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer";
const CHIP_ON = "bg-inverted text-on-inverted hover:bg-inverted-hover";
const CHIP_OFF = "bg-tint text-body hover:text-strong hover:bg-tint-hover";

/**
 * One filter facet as a chip. A `multi` filter opens a popover of checkboxes (aria-expanded on the chip); a `switch`
 * filter toggles on click (aria-pressed); a `single` filter opens a menu of radio items (`menuitemradio`) and always
 * reads "Hộp thư: Tất cả". Active (a value other than `clearValue`), it turns solid (`bg-inverted`) and shows the one
 * value or the count.
 */
export function FilterChip({ def, onChange }: { def: FilterDef; onChange: (selected: string[]) => void }) {
  const t = useSemiLocale();
  const on = def.selected.length > 0;
  const icon = def.icon && <Icon name={def.icon} className="w-3.5 h-3.5 shrink-0" />;
  if (def.kind === "switch") {
    return (
      <button type="button" aria-pressed={on} className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)} onClick={() => onChange(on ? [] : ["1"])}>
        {icon}
        {def.label}
      </button>
    );
  }
  if (def.kind === "single") {
    const options = def.options ?? [];
    const current = def.selected[0] ?? def.clearValue;
    const currentLabel = options.find((o) => o.value === current)?.label;
    const disabled = options.length === 0;
    const trigger = (
      <button
        type="button"
        disabled={disabled}
        className={cn(CHIP, on ? CHIP_ON : CHIP_OFF, disabled && "opacity-40 cursor-not-allowed")}
      >
        {icon}
        <span className="max-w-56 truncate">{currentLabel ? `${def.label}: ${currentLabel}` : def.label}</span>
        <Icon name="chevronDown" className="w-3.5 h-3.5 shrink-0 opacity-70" />
      </button>
    );
    if (disabled) return trigger;
    return (
      <Menu
        align="left"
        label={def.label}
        items={options.map((o) => ({
          label: o.label,
          icon: o.icon,
          radio: true,
          checked: o.value === current,
          shortcut: o.count === undefined ? undefined : String(o.count),
          onSelect: () => onChange(o.value === def.clearValue ? [] : [o.value]),
        }))}
        trigger={trigger}
      />
    );
  }
  const first = def.options?.find((o) => o.value === def.selected[0]);
  const single = on && def.selected.length === 1 && first;
  const text = !on ? def.label : single ? first.label : t.filterSelected(def.label, def.selected.length);
  return (
    <Popover
      label={def.label}
      width={240}
      className="p-0"
      trigger={
        <button type="button" aria-label={single ? `${def.label}: ${text}` : undefined} className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}>
          {icon}
          <span className="max-w-48 truncate">{text}</span>
          <Icon name="chevronDown" className="w-3.5 h-3.5 shrink-0 opacity-70" />
        </button>
      }
    >
      <FilterOptions def={def} onChange={onChange} />
      {on && (
        <div className="border-t border-divider p-1.5">
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full h-8 rounded-control text-ui font-medium text-muted hover:text-strong hover:bg-tint outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t.clearSelection}
          </button>
        </div>
      )}
    </Popover>
  );
}

/** The checkbox list of one multi filter (FilterChip's popover, FilterPanel's accordion). */
export function FilterOptions({ def, onChange, className }: { def: FilterDef; onChange: (selected: string[]) => void; className?: string }) {
  const toggle = (value: string, checked: boolean) =>
    onChange(checked ? [...def.selected, value] : def.selected.filter((s) => s !== value));
  return (
    <div role="group" aria-label={def.label} className={cn("flex flex-col gap-0.5 p-1.5 max-h-72 overflow-y-auto overscroll-contain", className)}>
      {def.options?.map((o) => (
        <div key={o.value} className="flex items-center gap-2 min-h-9 px-2 rounded-control hover:bg-tint">
          <Checkbox
            checked={def.selected.includes(o.value)}
            onChange={(c) => toggle(o.value, c)}
            label={
              <span className="inline-flex items-center gap-2">
                {o.icon && <Icon name={o.icon} className="w-4 h-4 text-muted shrink-0" />}
                {o.label}
              </span>
            }
            className="flex-1 min-w-0 py-1.5"
          />
          {o.count !== undefined && <span className="text-chrome text-muted tabular-nums">{o.count}</span>}
        </div>
      ))}
    </div>
  );
}

/**
 * The filter chips of a list page on one line. When they overflow, the row scrolls sideways and ‹ › buttons appear
 * (hidden from screen readers and the tab order: every chip is reachable by Tab, which scrolls it into view).
 * "Xoá lọc" shows while a filter is on; `leading` (the page's views as Pills) sits before the chips; `sort`,
 * `selection` ("Chọn" → in-place `"n đã chọn"` + bulk actions at the same height) and `trailing` (`ViewSwitch`) sit
 * at the right end.
 */
export function FilterChipRow({
  filters,
  onChange,
  onClear,
  leading,
  trailing,
  sort,
  selection,
  label,
  className,
}: {
  filters: FilterDef[];
  onChange: (key: string, selected: string[]) => void;
  /** Clears every filter; the "Xoá lọc" button shows while one is on. */
  onClear?: () => void;
  /**
   * Before the chips: the page's views (`<Pills>`: Đang mở · Đã đóng · Tất cả), the md+ twin of PhoneFilterBar's
   * `typeItems`. A view is not a filter: "Xoá lọc" leaves it alone. Keep it short (2–5 views); it does not scroll.
   */
  leading?: React.ReactNode;
  /** Extra tools at the end of the row (e.g. `ViewSwitch`). Replaced in place while `selection` is active. */
  trailing?: React.ReactNode;
  /** Sort menu at the right end of the filter row (1.0: replaces ResultLine's sort). */
  sort?: SortDef;
  /** Selection mode ("Chọn") and bulk actions replacing the right side at the same height (zero list shift). */
  selection?: ListSelection;
  /** Accessible name of the chip group (default "Bộ lọc"). */
  label?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"enter" | "exit" | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const selecting = Boolean(selection && (selection.active || selection.selected.length > 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [filters.length, selecting]);

  useEffect(() => {
    if (pendingFocus.current === "exit" && selecting) {
      pendingFocus.current = null;
      exitRef.current?.focus();
    } else if (pendingFocus.current === "enter" && !selecting) {
      pendingFocus.current = null;
      enterRef.current?.focus();
    }
  }, [selecting]);

  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(160, (ref.current?.clientWidth ?? 480) * 0.6), behavior: "smooth" });
  const active = activeFilterCount(filters) > 0;
  const currentSort = sort?.options.find((o) => o.value === sort.value);
  const moreItems = selection
    ? typeof selection.moreActions === "function"
      ? selection.moreActions(selection.selected)
      : selection.moreActions
    : undefined;
  const hasRight = Boolean(sort || selection || trailing);
  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-panel shadow-overlay flex items-center justify-center text-strong hover:bg-raised cursor-pointer";
  return (
    <div data-filter-row="" className={cn("min-h-9 flex items-center gap-2 min-w-0", className)}>
      {leading && <div className="shrink-0 flex items-center gap-1 pr-2 border-r border-divider">{leading}</div>}
      <div className="relative flex-1 min-w-0">
        {edges.left && (
          <button type="button" tabIndex={-1} aria-hidden onClick={() => scroll(-1)} title={t.scrollLeft} className={cn(arrow, "left-0")}>
            <Icon name="back" className="w-4 h-4" />
          </button>
        )}
        <div ref={ref} role="group" aria-label={label ?? t.filters} className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 -mx-0.5">
          {filters.map((f) => (
            <FilterChip key={f.key} def={f} onChange={(s) => onChange(f.key, s)} />
          ))}
          {active && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 h-8 px-2 rounded-control text-ui font-medium text-muted hover:text-strong outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
            >
              {t.clearFilters}
            </button>
          )}
        </div>
        {edges.right && (
          <button type="button" tabIndex={-1} aria-hidden onClick={() => scroll(1)} title={t.scrollRight} className={cn(arrow, "right-0")}>
            <Icon name="chevron" className="w-4 h-4" />
          </button>
        )}
      </div>
      {hasRight && (
        <div
          data-selection-bar={selecting ? "" : undefined}
          role={selecting ? "region" : undefined}
          aria-label={selecting ? t.bulkActions : undefined}
          className="shrink-0 flex items-center gap-1.5 pl-2 border-l border-divider"
        >
          {selecting && selection ? (
            <>
              <span role="status" aria-live="polite" aria-atomic="true" className="text-ui font-semibold text-strong tabular-nums whitespace-nowrap px-1">
                {t.nSelected(selection.selected.length)}
              </span>
              {moreItems && moreItems.length > 0 && (
                <Menu
                  label={t.moreActions}
                  items={moreItems}
                  trigger={
                    <Button variant="subtle" size="sm" iconOnly icon="more" aria-label={t.moreActions} disabled={selection.selected.length === 0} />
                  }
                />
              )}
              {selection.primaryAction && (
                <Button
                  variant={selection.primaryAction.variant ?? "inverse"}
                  size="sm"
                  icon={selection.primaryAction.icon}
                  disabled={selection.primaryAction.disabled || selection.selected.length === 0}
                  onClick={() => selection.primaryAction!.onClick(selection.selected)}
                >
                  {selection.primaryAction.label}
                </Button>
              )}
              <Button
                ref={exitRef}
                variant="ghost"
                size="sm"
                onClick={() => {
                  pendingFocus.current = "enter";
                  selection.onExit();
                }}
              >
                {t.selectDone}
              </Button>
            </>
          ) : (
            <>
              {sort && currentSort && (
                <Menu
                  label={t.sort}
                  items={sort.options.map((o) => ({
                    label: o.label,
                    radio: true,
                    checked: o.value === sort.value,
                    onSelect: () => sort.onChange(o.value),
                  }))}
                  trigger={
                    <Button variant="ghost" size="sm" icon="sliders" aria-label={`${t.sort}: ${currentSort.label}`}>
                      <span className="max-w-36 truncate">{currentSort.label}</span>
                      <Icon name="chevronDown" className="w-3.5 h-3.5 text-muted shrink-0" />
                    </Button>
                  }
                />
              )}
              {selection && (
                <Button
                  ref={enterRef}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    pendingFocus.current = "exit";
                    selection.onEnter();
                  }}
                >
                  {t.selectMode}
                </Button>
              )}
              {trailing}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Options for URL-backed sort (`?sort=key.dir`) inside `useFilterParams`. */
export interface FilterParamsSortOptions {
  /** Sort menu choices for `FilterChipRow` / `PhoneFilterBar` / `FilterPanel`; each `value` is `"key.dir"` (e.g. `"total.desc"`). */
  options?: { value: string; label: string }[];
  /** Default sort when `?sort=` is absent (never written to the URL). */
  defaultSort?: DataTableSort | null;
  /** URL param name (default `"sort"`). */
  param?: string;
  /** Optional allow-list of sortable column keys; unknown keys in the URL fall back to `defaultSort`. */
  allowedKeys?: readonly string[];
}

/**
 * Legacy URL param rewriter for `useFilterParams`:
 * - A map `{ oldParam: "target" }` rewrites `oldParam` once after hydration with `replaceState` (zero history entries).
 *   When `"target"` matches a filter spec key, values move to `<prefix><target>` (cleaned by the spec); otherwise
 *   `"target"` is written as a plain param (e.g. `{ search: "q" }`).
 * - A function `(params) => nextParams | null | undefined` handles custom migrations; returning a changed `URLSearchParams`
 *   replaces the URL once after hydration.
 */
export type LegacyParamsMap = Record<string, string> | ((params: URLSearchParams) => URLSearchParams | null | undefined);

/** Options for `useFilterParams`. */
export interface FilterParamsOptions {
  /** Prefix for filter query params (default `"f."`). */
  prefix?: string;
  /** Rewrites old URL params once after hydration via `replaceState` (no extra history entry). */
  legacy?: LegacyParamsMap;
  /** URL-backed sort (`?sort=key.dir`) shared by `FilterChipRow`, `PhoneFilterBar`, `FilterPanel` and `DataTable`. */
  sort?: FilterParamsSortOptions;
}

/** What useFilterParams returns: the filters with their state and the ways to change them (all write the URL). */
export interface FilterParamsState<K extends string = string> {
  /** The filters with `selected`, for FilterChipRow / FilterPanel. */
  filters: FilterDef[];
  /** Selected values by key, to filter the rows. */
  values: FilterValues<K>;
  /** How many filters are on (PhoneFilterBar's count). */
  activeCount: number;
  /** Set one filter (default `"push"` so Back undoes it; `"replace"` updates in place without adding a history entry). */
  onChange: (key: string, selected: string[], mode?: "push" | "replace") => void;
  /** Change several filters at once in a single history entry (default `"push"`). */
  patch: (values: Partial<FilterValues<K>>, mode?: "push" | "replace") => void;
  /** Clear every filter. */
  onClear: () => void;
  /** The current search params (the query, the sort, the view live there too). */
  params: URLSearchParams;
  /** Set or remove other params (`null` or "" removes): `setParams({ q: "tiêu" }, "replace")`. Default `push`. */
  setParams: (patch: Record<string, string | null>, mode?: "push" | "replace") => void;
  /** URL-backed sort (`?sort=key.dir`) for `<DataTable sort={f.sort} onSortChange={f.setSort} />`. */
  sort: DataTableSort | null;
  /** Update `?sort=key.dir` (`null` or `defaultSort` clears the param). Default `"push"`. */
  setSort: (next: DataTableSort | null, mode?: "push" | "replace") => void;
  /** Ready-to-pass `SortDef` for `FilterChipRow` / `PhoneFilterBar` / `FilterPanel` when `options.sort.options` is given. */
  sortDef?: SortDef;
}

/**
 * Filter and sort state in the URL, with no router hook. The server render and hydration see no params (prerender-safe:
 * no `window` in render, no `useSearchParams`, which would suspend a prerendered route); the URL is read right after.
 * Writes use `history.pushState(null, …)` / `replaceState(null, …)`, which Next's App Router turns into its own
 * navigation, so `useSearchParams` and `router.refresh()` keep the filters. It follows Back / Forward, every other
 * useFilterParams on the page, and (where the Navigation API exists, and on any re-render elsewhere) a Link or
 * `router.push` to the same route. Without the Navigation API (Firefox, Safari < 26) a hook in a layout that does
 * not re-render can miss such a navigation: there, and with a router of your own, use the pure helpers
 * (`readFilters`, `writeFilters`, `clearFilters`) on `useSearchParams`.
 */
export function useFilterParams<K extends string>(
  specs: readonly (FilterSpec & { key: K })[],
  options: FilterParamsOptions = {},
): FilterParamsState<K> {
  const { prefix = FILTER_PARAM_PREFIX, legacy, sort: sortOpt } = options;
  const search = useSyncExternalStore(subscribeUrl, currentSearch, () => "");
  // specs are usually an inline array: key the memo on their content, not their identity
  const specsKey = JSON.stringify(specs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSpecs = useMemo(() => specs, [specsKey]);
  const sortParam = sortOpt?.param;
  const defaultSortKey = sortOpt?.defaultSort?.key ?? "";
  const defaultSortDir = sortOpt?.defaultSort?.dir ?? "";
  const sortAllowedKey = sortOpt?.allowedKeys ? JSON.stringify(sortOpt.allowedKeys) : "";
  const sortOptionsKey = sortOpt?.options ? JSON.stringify(sortOpt.options) : "";
  const defaultSort = useMemo<DataTableSort | null>(
    () => (defaultSortKey && (defaultSortDir === "asc" || defaultSortDir === "desc") ? { key: defaultSortKey, dir: defaultSortDir } : null),
    [defaultSortKey, defaultSortDir],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortAllowed = useMemo(() => sortOpt?.allowedKeys, [sortAllowedKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortOptions = useMemo(() => sortOpt?.options, [sortOptionsKey]);

  // Rewrite legacy params once after hydration with `replaceState` (zero history entries).
  const legacyRef = useRef(legacy);
  legacyRef.current = legacy;
  const didRewriteLegacy = useRef(false);
  useEffect(() => {
    if (didRewriteLegacy.current) return;
    didRewriteLegacy.current = true;
    const map = legacyRef.current;
    if (!map) return;
    const raw = currentSearch();
    if (!raw || raw === "?") return;
    const current = new URLSearchParams(raw);
    if (typeof map === "function") {
      const next = map(new URLSearchParams(current));
      if (next && next.toString() !== current.toString()) writeSearch(next, "replace");
      return;
    }
    let next = new URLSearchParams(current);
    let changed = false;
    const filterPatch: Partial<FilterValues> = {};
    for (const [oldKey, targetKey] of Object.entries(map)) {
      if (!next.has(oldKey)) continue;
      const spec = stableSpecs.find((s) => s.key === targetKey);
      if (spec) {
        const destParam = prefix + spec.key;
        if (oldKey === destParam) continue;
        if (!next.has(destParam)) filterPatch[spec.key] = next.getAll(oldKey);
        next.delete(oldKey);
        changed = true;
      } else {
        if (oldKey === targetKey) continue;
        if (!next.has(targetKey)) {
          const vals = next.getAll(oldKey);
          for (const v of vals) if (v) next.append(targetKey, v);
        }
        next.delete(oldKey);
        changed = true;
      }
    }
    if (Object.keys(filterPatch).length > 0) {
      next = writeFilters(next, filterPatch, stableSpecs, prefix);
    }
    if (changed && next.toString() !== current.toString()) {
      writeSearch(next, "replace");
    }
  }, [stableSpecs, prefix]);

  return useMemo(() => {
    const filters = readFilters(search, stableSpecs, prefix);
    const sort = readSort(search, { param: sortParam, defaultSort, allowedKeys: sortAllowed });
    const setSort = (next: DataTableSort | null, mode: "push" | "replace" = "push") =>
      writeSearch((current) => writeSort(current, next, { param: sortParam, defaultSort }), mode);
    const sortDef: SortDef | undefined = sortOptions
      ? {
          value: formatSort(sort),
          options: sortOptions,
          onChange: (v) => setSort(parseSort(v, sortAllowed), "push"),
        }
      : undefined;
    return {
      filters,
      values: Object.fromEntries(filters.map((f) => [f.key, f.selected])) as FilterValues<K>,
      activeCount: activeFilterCount(filters),
      // built on the URL after a push flushed a pending search (#128), not the one read before it
      onChange: (key, selected, mode = "push") =>
        writeSearch((current) => writeFilters(current, { [key]: selected }, stableSpecs, prefix), mode),
      patch: (values, mode = "push") =>
        writeSearch((current) => writeFilters(current, values, stableSpecs, prefix), mode),
      onClear: () => writeSearch((current) => clearFilters(current, stableSpecs, prefix), "push"),
      params: new URLSearchParams(search),
      setParams: (patch, mode = "push") => patchSearch(patch, mode),
      sort,
      setSort,
      sortDef,
    };
  }, [search, stableSpecs, prefix, sortParam, defaultSort, sortAllowed, sortOptions]);
}
