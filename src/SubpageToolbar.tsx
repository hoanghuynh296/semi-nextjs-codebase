"use client";

// Unified sticky sub-page toolbar row (docs/DESIGN_SYSTEM.md §4a):
// - Optional title: the page title shares the row with filters and actions (instead of a PageTitle above)
// - Left slot: filter pills / chips / CustomSelect dropdowns
// - Right slot: icon-only add CTA (BTN_INVERSE BTN_ICON) + SearchInput + RefreshButton (+ optional extra controls)
// - Phone layout (#57, opt-in): `filters` (or `left` with `collapseFilters`) go behind a "Bộ lọc · N" button and
//   `secondaryActions` into a ⋯ menu, so below `sm` the toolbar is at most two rows (title, then search + buttons).
import React, { useState } from "react";
import { useSemiLocale } from "./locale";
import { Icon, type IconName } from "./Icon";
import { SearchInput } from "./SearchInput";
import { RefreshButton } from "./RefreshButton";
import { BTN_ICON, BTN_INVERSE, BTN_SUBTLE } from "../styles/buttons";
import { STICKY_TOOLBAR } from "../styles/surfaces";
import { PAGE_TITLE_TEXT } from "./pageTitleText";
import { Menu, type MenuItem } from "./Overlay";
import { Drawer } from "./Drawer";
import { FilterChip } from "./FilterChipRow";
import { FilterPanel } from "./FilterPanel";
import { activeFilterCount, type FilterDef } from "./filterParams";
import { cn } from "../styles/utils";

/** Typed filters of a SubpageToolbar (see `filters`). */
export interface ToolbarFilters {
  filters: FilterDef[];
  onChange: (key: string, selected: string[]) => void;
  onClear: () => void;
  /** Rows matching now, on the panel's bottom button. */
  resultCount?: number;
}

export function SubpageToolbar({
  title,
  left,
  right,
  onPrimaryAction,
  primaryActionLabel: primaryActionLabelProp,
  primaryActionIcon = "plus",
  searchValue,
  onSearchChange,
  searchPlaceholder: searchPlaceholderProp,
  onRefresh,
  filters,
  collapseFilters = false,
  filterCount,
  secondaryActions,
  className = "",
}: {
  /**
   * The page title, on the same row as the filters and actions (the page then has no PageTitle). A string becomes
   * the page's h1 in PageTitle type; pass a `TextTabs` for sibling views. Leave it out to keep the title on its own
   * row above (PageTitle + SubpageToolbar). On narrow screens the filters and actions wrap below the title.
   */
  title?: React.ReactNode;
  /** Filter controls on the left (SegmentedControl, Chip, CustomSelect). */
  left?: React.ReactNode;
  /** Optional extra controls on the right (placed before the primary icon button). */
  right?: React.ReactNode;
  /** Click handler for the icon-only primary CTA button (e.g. "Thêm"). */
  onPrimaryAction?: () => void;
  /** Accessible title & aria-label for the icon-only primary CTA button. */
  primaryActionLabel?: string;
  /** Icon for the primary CTA button (default: "plus"). */
  primaryActionIcon?: IconName;
  /** Search query value (renders a SearchInput when onSearchChange is provided). */
  searchValue?: string;
  /** Search change handler. */
  onSearchChange?: (val: string) => void;
  /** Placeholder for SearchInput. */
  searchPlaceholder?: string;
  /** Async or sync reload callback (renders RefreshButton when provided). */
  onRefresh?: () => Promise<unknown> | unknown;
  /**
   * Typed filters (C-026): up to two show as chips; with more, and always below `sm`, a "Bộ lọc · N" button opens a
   * FilterPanel and the active ones show as chips beside it. Use instead of hand-made chips in `left`.
   */
  filters?: ToolbarFilters;
  /** Below `sm`, move `left` into a bottom sheet opened by a "Bộ lọc" button (above `sm` it renders as before). */
  collapseFilters?: boolean;
  /** Active filters in `left`, shown on that button ("Bộ lọc · 2") when `collapseFilters` is set. */
  filterCount?: number;
  /** Text actions that are not the primary one: buttons from `sm`, a ⋯ menu below it (the primary stays visible). */
  secondaryActions?: MenuItem[];
  className?: string;
}) {
  const t = useSemiLocale();
  const [sheet, setSheet] = useState(false);
  const typed = filters?.filters ?? [];
  const typedActive = activeFilterCount(typed);
  // more than two typed filters collapse into the panel at every width (C-026); below sm they always do
  const typedCollapsed = typed.length > 2;
  const count = filters ? typedActive : (filterCount ?? 0);
  // the opt-in phone layout (#57): one row of controls below sm; without these props the toolbar wraps as before
  const phoneLayout = Boolean(filters || collapseFilters || secondaryActions?.length);
  const filterButton = (extra: string) => (
    <button
      type="button"
      onClick={() => setSheet(true)}
      aria-haspopup="dialog"
      aria-expanded={sheet}
      className={cn(BTN_SUBTLE, "shrink-0 gap-1.5", count > 0 && "!bg-inverted !text-on-inverted", extra)}
    >
      <Icon name="filter" className="w-4 h-4" />
      {t.filterCount(count)}
    </button>
  );
  const primaryActionLabel = primaryActionLabelProp ?? t.add;
  const searchPlaceholder = searchPlaceholderProp ?? t.search;
  return (
    <div
      className={`${STICKY_TOOLBAR} flex flex-wrap items-center justify-between gap-2.5 min-w-0 ${
        title ? "gap-x-4 mb-5 sm:mb-6" : "mb-5"
      } ${className}`}
    >
      {title &&
        (typeof title === "string" ? (
          <h1 className={`min-w-0 max-w-full shrink ${PAGE_TITLE_TEXT}`}>{title}</h1>
        ) : (
          // Custom title nodes (such as TextTabs) keep their own bottom margin on a row of their own; on the toolbar row the row spaces them.
          <div className="min-w-0 max-w-full shrink *:!mb-0">{title}</div>
        ))}
      {(left || !title || filters) && (
        <div className={cn("flex items-center gap-2 flex-wrap min-w-0", (collapseFilters || filters) && "max-sm:hidden")}>
          {/* with collapseFilters, `left` lives in one place at a time: here, or in the sheet while it is open */}
          {!(collapseFilters && sheet) && left}
          {filters && typedCollapsed && filterButton("")}
          {filters &&
            typed
              .filter((f) => !typedCollapsed || f.selected.length > 0)
              .map((f) => <FilterChip key={f.key} def={f} onChange={(sel) => filters.onChange(f.key, sel)} />)}
        </div>
      )}
      <div className={cn("flex flex-wrap items-center gap-2 ml-auto shrink-0 max-sm:w-full max-sm:justify-end", phoneLayout && "max-sm:flex-nowrap")}>
        {(collapseFilters || filters) && filterButton("sm:hidden max-sm:mr-auto")}
        {right}
        {secondaryActions?.filter((a) => !a.hidden).map((a, i) => (
          <button key={i} type="button" onClick={a.onSelect} disabled={Boolean(a.disabled)} title={typeof a.disabled === "string" ? a.disabled : undefined} className={cn(BTN_SUBTLE, "max-sm:hidden gap-1.5", a.danger && "text-danger-fg")}>
            {a.icon && <Icon name={a.icon} className="w-4 h-4" />}
            {a.label}
          </button>
        ))}
        {secondaryActions && secondaryActions.length > 0 && (
          <span className="sm:hidden">
            <Menu items={secondaryActions} label={t.moreActions} />
          </span>
        )}
        {onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className={`${BTN_INVERSE} ${BTN_ICON}`}
            title={primaryActionLabel}
            aria-label={primaryActionLabel}
          >
            <Icon name={primaryActionIcon} className="w-4 h-4" />
          </button>
        )}
        {onSearchChange !== undefined && (
          <SearchInput
            value={searchValue ?? ""}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}
        {onRefresh && <RefreshButton onRefresh={onRefresh} />}
      </div>
      {filters ? (
        <FilterPanel
          open={sheet}
          onClose={() => setSheet(false)}
          filters={typed}
          onChange={filters.onChange}
          onClear={filters.onClear}
          resultCount={filters.resultCount}
        />
      ) : (
        collapseFilters && (
          <Drawer open={sheet} onClose={() => setSheet(false)} title={t.filters} side="bottom">
            <div className="flex flex-col items-start gap-3 [&>*]:max-w-full">{left}</div>
          </Drawer>
        )
      )}
    </div>
  );
}
