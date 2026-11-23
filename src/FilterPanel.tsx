"use client";

// Search and filters (#99, C-032 L4; closes #57): the phone filter bar (type · Bộ lọc · settings as one segmented
// pill) and the filter panel it opens: full screen on phones, a side sheet from `sm`, with the sort first, booleans as
// switches, one accordion per multi filter (a radio group for a single one), and "Xem N kết quả" at the bottom.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { Menu, type MenuItem } from "./Overlay";
import { RadioGroup, Switch } from "./Choice";
import { FilterOptions } from "./FilterChipRow";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import type { FilterDef } from "./filterParams";
import type { SortDef } from "./SearchPill";
import { cn } from "../styles/utils";

const SEG =
  "h-10 flex items-center justify-center gap-1.5 text-label font-medium text-contrast hover:bg-tint-hover outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus cursor-pointer";

/**
 * The filter controls of a phone list page in one row: an optional type menu (the page's views), "Bộ lọc" with the
 * active count (opens FilterPanel) and an optional settings button (sort and view). Show it below `md` in place of
 * FilterChipRow (`md:hidden` / `max-md:hidden` around each).
 */
export function PhoneFilterBar({
  typeLabel,
  typeItems,
  activeCount,
  onOpenFilters,
  filtersOpen,
  onOpenSettings,
  className,
}: {
  /** The current view's name ("Tất cả"); shown with `typeItems`. */
  typeLabel?: string;
  /** The views to switch between (a Menu). */
  typeItems?: MenuItem[];
  /** How many filters are on (activeFilterCount); shown on the button. */
  activeCount: number;
  onOpenFilters: () => void;
  /** Whether the panel is open (aria-expanded on the button). */
  filtersOpen?: boolean;
  /** Opens the sort and view settings; the button shows when given. */
  onOpenSettings?: () => void;
  className?: string;
}) {
  const t = useSemiLocale();
  return (
    <div className={cn("flex items-stretch rounded-full bg-tint overflow-hidden divide-x divide-divider", className)}>
      {typeItems && typeLabel && (
        <div className="flex-1 min-w-0 flex">
          <Menu
            align="left"
            label={typeLabel}
            items={typeItems}
            trigger={
              <button type="button" className={cn(SEG, "flex-1 min-w-0 px-3")}>
                <span className="truncate">{typeLabel}</span>
                <Icon name="chevronDown" className="w-3.5 h-3.5 shrink-0 text-muted" />
              </button>
            }
          />
        </div>
      )}
      <button
        type="button"
        onClick={onOpenFilters}
        aria-haspopup="dialog"
        aria-expanded={filtersOpen}
        className={cn(SEG, "flex-1 min-w-0 px-3")}
      >
        <Icon name="filter" className="w-4 h-4 shrink-0" />
        {t.filters}
        {activeCount > 0 && (
          <span className="h-5 min-w-5 px-1 rounded-full bg-inverted text-on-inverted text-caption tabular-nums leading-5 text-center">
            {activeCount}
          </span>
        )}
      </button>
      {onOpenSettings && (
        <button type="button" onClick={onOpenSettings} aria-label={t.viewOptions} title={t.viewOptions} className={cn(SEG, "w-12 shrink-0")}>
          <Icon name="sliders" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * The full filter set in a modal panel: full screen on phones, a right side sheet from `sm` (also the "Bộ lọc" panel
 * of a desktop page with more filters than its chip row shows). Changes apply at once (the list behind updates);
 * "Xem N kết quả" closes. Focus moves in, is trapped, and returns to the opener; Escape closes.
 */
export function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
  onClear,
  sort,
  resultCount,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterDef[];
  onChange: (key: string, selected: string[]) => void;
  onClear: () => void;
  /** Sort choices, shown first as a row of chips. */
  sort?: SortDef;
  /** Rows matching now, on the bottom button ("Xem 12 kết quả"); without it the button says "Đóng". */
  resultCount?: number;
  /** Heading (default "Bộ lọc"). */
  title?: string;
  /** More settings under the filters (a ViewSwitch, a date range). */
  children?: React.ReactNode;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { titleId } = useDialog(ref, open && mounted, onClose);
  // the accordions of filters that are on start open (at most two), every time the panel opens
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  useEffect(() => {
    if (open) setOpenKeys(filters.filter((f) => f.kind !== "switch" && f.selected.length > 0).map((f) => f.key).slice(0, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open || !mounted) return null;
  const section = "border-b border-divider";
  const label = title ?? t.filters;
  return createPortal(
    <div className="fixed inset-0 z-modal">
      <div className="max-sm:hidden absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-0 sm:left-auto sm:w-full sm:max-w-md bg-panel sm:border-l sm:border-line sm:shadow-overlay flex flex-col slide-panel-in"
      >
        <div className="flex items-center h-14 px-2 shrink-0 border-b border-divider box-content pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="w-11 h-11 rounded-control flex items-center justify-center text-contrast hover:bg-tint outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
          <h2 id={titleId} className="flex-1 text-center text-ui-lg font-semibold text-contrast truncate">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClear}
            className="h-11 px-3 rounded-control text-label font-medium text-muted hover:text-contrast outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
          >
            {t.clearFilters}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {sort && (
            <div className={cn(section, "px-4 py-3")} role="group" aria-labelledby={`${titleId}-sort`}>
              <h3 id={`${titleId}-sort`} className="text-label font-semibold text-muted pb-2">
                {t.sort}
              </h3>
              <div className="flex flex-wrap gap-2">
                {sort.options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={o.value === sort.value}
                    onClick={() => sort.onChange(o.value)}
                    className={cn(
                      "h-9 px-3 rounded-full text-label font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer",
                      o.value === sort.value ? "bg-inverted text-on-inverted" : "bg-tint text-body hover:bg-tint-hover hover:text-contrast",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {filters
            .filter((f) => f.kind === "switch")
            .map((f) => (
              <div key={f.key} className={cn(section, "px-4 py-3 min-h-14 flex items-center")}>
                <Switch checked={f.selected.length > 0} onChange={(c) => onChange(f.key, c ? ["1"] : [])} label={f.label} className="w-full" />
              </div>
            ))}
          {filters
            .filter((f) => f.kind !== "switch")
            .map((f) => {
              const isOpen = openKeys.includes(f.key);
              const bodyId = `${titleId}-${f.key}`;
              const single = f.kind === "single";
              const current = single ? (f.selected[0] ?? f.clearValue) : undefined;
              const summary = single ? f.options?.find((o) => o.value === current)?.label : f.selected.length > 0 ? f.selected.length : undefined;
              return (
                <div key={f.key} className={section}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={bodyId}
                      onClick={() => setOpenKeys(isOpen ? openKeys.filter((k) => k !== f.key) : [...openKeys, f.key])}
                      className="w-full flex items-center gap-3 min-h-14 px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus cursor-pointer hover:bg-tint"
                    >
                      {f.icon && <Icon name={f.icon} className="w-5 h-5 text-muted shrink-0" />}
                      <span className="flex-1 min-w-0 truncate text-ui font-medium text-contrast">{f.label}</span>
                      {summary !== undefined && <span className="max-w-40 truncate text-label text-muted tabular-nums">{summary}</span>}
                      <Icon name={isOpen ? "chevronUp" : "chevronDown"} className="w-4 h-4 text-muted shrink-0" />
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={bodyId}>
                      {single ? (
                        <div role="group" aria-label={f.label} className="px-4 pb-4 pt-1">
                          <RadioGroup
                            name={bodyId}
                            value={current ?? ""}
                            onChange={(v) => onChange(f.key, v === f.clearValue ? [] : [v])}
                            options={(f.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
                            className="[&>div]:gap-4"
                          />
                        </div>
                      ) : (
                        <FilterOptions def={f} onChange={(s) => onChange(f.key, s)} className="max-h-none px-2.5 pb-3 pt-0" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          {children && <div className="px-4 py-3">{children}</div>}
        </div>
        <div className="shrink-0 p-3 border-t border-divider pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-control bg-action text-on-action text-ui font-semibold hover:bg-action-hover outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus cursor-pointer"
          >
            {resultCount === undefined ? t.close : t.showResults(resultCount)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
