"use client";

// Search and filters (#99, C-032 L3): one filter chip per facet on a single line (icon, label, count when active,
// chevron), a multi-select popover per chip, ‹ › when the row overflows, "Xoá lọc", and the view tools at the end.
// The chips are controlled: the page owns the state, usually in the URL (useFilterParams or the filterParams helpers).
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "./Icon";
import { Popover } from "./Popover";
import { Menu } from "./Overlay";
import { Checkbox } from "./Choice";
import { useSemiLocale } from "./locale";
import { activeFilterCount, clearFilters, readFilters, toQueryString, writeFilters, type FilterDef, type FilterSpec, type FilterValues } from "./filterParams";
import { currentSearch, patchSearch, subscribeUrl, writeSearch } from "./urlState";
import { cn } from "../styles/utils";

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
    const current = def.selected[0] ?? def.clearValue;
    const currentLabel = def.options?.find((o) => o.value === current)?.label;
    return (
      <Menu
        align="left"
        label={def.label}
        items={(def.options ?? []).map((o) => ({
          label: o.label,
          icon: o.icon,
          radio: true,
          checked: o.value === current,
          shortcut: o.count === undefined ? undefined : String(o.count),
          onSelect: () => onChange(o.value === def.clearValue ? [] : [o.value]),
        }))}
        trigger={
          <button type="button" className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}>
            {icon}
            <span className="max-w-56 truncate">{currentLabel ? `${def.label}: ${currentLabel}` : def.label}</span>
            <Icon name="chevronDown" className="w-3.5 h-3.5 shrink-0 opacity-70" />
          </button>
        }
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
 * "Xoá lọc" shows while a filter is on; `leading` (the page's views as Pills) sits before the chips and `trailing`
 * (ViewSwitch) at the end, each behind a divider; neither scrolls with the chips.
 */
export function FilterChipRow({
  filters,
  onChange,
  onClear,
  leading,
  trailing,
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
  /** Tools at the end of the row: ViewSwitch, a sort that is not in a ResultLine. */
  trailing?: React.ReactNode;
  /** Accessible name of the chip group (default "Bộ lọc"). */
  label?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
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
  }, [filters.length]);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(160, (ref.current?.clientWidth ?? 480) * 0.6), behavior: "smooth" });
  const active = activeFilterCount(filters) > 0;
  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-panel shadow-overlay flex items-center justify-center text-strong hover:bg-raised cursor-pointer";
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
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
      {trailing && <div className="shrink-0 flex items-center gap-1 pl-2 border-l border-divider">{trailing}</div>}
    </div>
  );
}

/** What useFilterParams returns: the filters with their state and the ways to change them (all write the URL). */
export interface FilterParamsState<K extends string = string> {
  /** The filters with `selected`, for FilterChipRow / FilterPanel. */
  filters: FilterDef[];
  /** Selected values by key, to filter the rows. */
  values: FilterValues<K>;
  /** How many filters are on (PhoneFilterBar's count). */
  activeCount: number;
  /** Set one filter (a new history entry, so Back undoes it). */
  onChange: (key: string, selected: string[]) => void;
  /** Clear every filter. */
  onClear: () => void;
  /** The current search params (the query, the sort, the view live there too). */
  params: URLSearchParams;
  /** Set or remove other params (`null` or "" removes): `setParams({ q: "tiêu" }, "replace")`. Default `push`. */
  setParams: (patch: Record<string, string | null>, mode?: "push" | "replace") => void;
}

/**
 * Filter state in the URL, with no router hook. The server render and hydration see no params (prerender-safe: no
 * `window` in render, no `useSearchParams`, which would suspend a prerendered route); the URL is read right after.
 * Writes use `history.pushState(null, …)` / `replaceState(null, …)`, which Next's App Router turns into its own
 * navigation, so `useSearchParams` and `router.refresh()` keep the filters. It follows Back / Forward, every other
 * useFilterParams on the page, and (where the Navigation API exists, and on any re-render elsewhere) a Link or
 * `router.push` to the same route. Without the Navigation API (Firefox, Safari < 26) a hook in a layout that does
 * not re-render can miss such a navigation: there, and with a router of your own, use the pure helpers
 * (`readFilters`, `writeFilters`, `clearFilters`) on `useSearchParams`.
 */
export function useFilterParams<K extends string>(specs: readonly (FilterSpec & { key: K })[], options: { prefix?: string } = {}): FilterParamsState<K> {
  const { prefix } = options;
  const search = useSyncExternalStore(subscribeUrl, currentSearch, () => "");
  // specs are usually an inline array: key the memo on their content, not their identity
  const specsKey = JSON.stringify(specs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSpecs = useMemo(() => specs, [specsKey]);
  return useMemo(() => {
    const filters = readFilters(search, stableSpecs, prefix);
    return {
      filters,
      values: Object.fromEntries(filters.map((f) => [f.key, f.selected])) as FilterValues<K>,
      activeCount: activeFilterCount(filters),
      // built on the URL after a push flushed a pending search (#128), not the one read before it
      onChange: (key, selected) => writeSearch((current) => writeFilters(current, { [key]: selected }, stableSpecs, prefix), "push"),
      onClear: () => writeSearch((current) => clearFilters(current, stableSpecs, prefix), "push"),
      params: new URLSearchParams(search),
      setParams: (patch, mode = "push") => patchSearch(patch, mode),
    };
  }, [search, stableSpecs, prefix]);
}
