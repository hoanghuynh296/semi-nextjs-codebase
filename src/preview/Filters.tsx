"use client";

// PREVIEW (#94 L2, L3, L4, L11, L17): sticky search + result line + sort, one-line filter chip row with ‹ › and a
// multi-select popover per chip, the view switch at the end of the row, and the phone variant (segmented bar + a
// full-screen filter panel). Filter state lives in the URL: these components are controlled, the page owns the params.
import React, { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../Icon";
import { Popover } from "../Popover";
import { Checkbox, Switch } from "../Choice";
import { Menu } from "../Overlay";
import { useDialog } from "../a11y";
import { cn } from "../../styles/utils";

export interface FilterOption {
  value: string;
  label: string;
  icon?: IconName;
  count?: number;
}

export interface FilterDef {
  key: string;
  label: string;
  icon?: IconName;
  /** Multi-select options; omit for a boolean filter (`kind: "switch"`). */
  options?: FilterOption[];
  kind?: "multi" | "switch";
  selected: string[];
}

export interface SortDef {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** L17: pins its children (search, result line, chips) to the top of the scrolling main panel. */
export function StickyContextBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("sticky top-0 max-md:top-14 z-sticky bg-panel-2 px-4 sm:px-6 pt-3 pb-2 flex flex-col gap-2", className)}>{children}</div>
  );
}

/** L2: wide pill search with clear; optional trailing tools (image / voice search, ⌘K hint). */
export function SearchPill({
  value,
  onChange,
  placeholder,
  shortcut,
  trailing,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Shown on the right while empty, e.g. "⌘K". */
  shortcut?: string;
  trailing?: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 h-11 px-4 rounded-full bg-tint focus-within:ring-2 focus-within:ring-focus">
      <Icon name="search" className="w-[18px] h-[18px] text-muted shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        type="search"
        className="flex-1 min-w-0 bg-transparent outline-none text-ui text-contrast placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Xoá tìm kiếm"
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-contrast hover:bg-tint"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      ) : (
        shortcut && <kbd className="hidden sm:inline-flex h-6 px-1.5 items-center rounded-chip bg-tint text-caption text-muted font-sans">{shortcut}</kbd>
      )}
      {trailing}
    </div>
  );
}

/** L2: "query · N kết quả" on the left, sort on the right. */
export function ResultLine({ query, count, unit = "kết quả", sort }: { query?: string; count: number; unit?: string; sort?: SortDef }) {
  const current = sort?.options.find((o) => o.value === sort.value);
  return (
    <div className="flex items-center gap-3 min-h-7 text-label">
      <p className="flex-1 min-w-0 truncate text-muted" aria-live="polite">
        {query ? (
          <>
            <span className="text-contrast font-medium">“{query}”</span> ·{" "}
          </>
        ) : null}
        <span className="tabular-nums">{count.toLocaleString("vi-VN")}</span> {unit}
      </p>
      {sort && current && (
        <Menu
          label="Sắp xếp"
          items={sort.options.map((o) => ({ label: o.label, icon: o.value === sort.value ? "check" : undefined, onSelect: () => sort.onChange(o.value) }))}
          trigger={
            <button type="button" className="inline-flex items-center gap-1.5 h-7 px-2 rounded-control text-label font-medium text-body hover:text-contrast hover:bg-tint">
              <Icon name="sliders" className="w-3.5 h-3.5 text-muted" />
              {current.label}
              <Icon name="chevronDown" className="w-3.5 h-3.5 text-muted" />
            </button>
          }
        />
      )}
    </div>
  );
}

/** L3: one filter chip (icon, label, count, chevron) opening a small multi-select popover. */
export function FilterChip({ def, onChange }: { def: FilterDef; onChange: (selected: string[]) => void }) {
  const on = def.selected.length > 0;
  const chip = cn(
    "shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-label font-medium whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-focus",
    on ? "bg-inverted text-on-inverted" : "bg-tint text-body hover:text-contrast hover:bg-tint-hover",
  );
  if (def.kind === "switch") {
    return (
      <button type="button" aria-pressed={on} className={chip} onClick={() => onChange(on ? [] : ["1"])}>
        {def.icon && <Icon name={def.icon} className="w-3.5 h-3.5" />}
        {def.label}
      </button>
    );
  }
  const first = def.options?.find((o) => o.value === def.selected[0]);
  return (
    <Popover
      label={def.label}
      width={240}
      trigger={
        <button type="button" className={chip}>
          {def.icon && <Icon name={def.icon} className="w-3.5 h-3.5" />}
          {on ? (def.selected.length === 1 ? first?.label : `${def.label} · ${def.selected.length}`) : def.label}
          <Icon name="chevronDown" className="w-3.5 h-3.5 opacity-70" />
        </button>
      }
    >
      <div className="flex flex-col gap-0.5 p-1.5 max-h-72 overflow-y-auto">
        {def.options?.map((o) => (
          <label key={o.value} className="flex items-center gap-2 px-2 py-1.5 rounded-control hover:bg-tint cursor-pointer">
            <Checkbox
              checked={def.selected.includes(o.value)}
              onChange={(c) => onChange(c ? [...def.selected, o.value] : def.selected.filter((s) => s !== o.value))}
              aria-label={o.label}
            />
            {o.icon && <Icon name={o.icon} className="w-4 h-4 text-muted" />}
            <span className="flex-1 text-label text-contrast">{o.label}</span>
            {o.count !== undefined && <span className="text-caption text-muted tabular-nums">{o.count}</span>}
          </label>
        ))}
      </div>
      {on && (
        <div className="border-t border-divider p-1.5">
          <button type="button" onClick={() => onChange([])} className="w-full h-8 rounded-control text-label font-medium text-muted hover:text-contrast hover:bg-tint">
            Bỏ chọn
          </button>
        </div>
      )}
    </Popover>
  );
}

/** L3 + L11: the chip row on one line, ‹ › when it overflows, trailing tools (view switch) at the end. */
export function FilterChipRow({
  filters,
  onChange,
  onClear,
  trailing,
}: {
  filters: FilterDef[];
  onChange: (key: string, selected: string[]) => void;
  onClear?: () => void;
  trailing?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  const active = filters.some((f) => f.selected.length > 0);
  const arrow =
    "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-panel-4 shadow-overlay flex items-center justify-center text-contrast hover:bg-raised z-10";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative flex-1 min-w-0">
        {edges.left && (
          <button type="button" onClick={() => scroll(-1)} aria-label="Cuộn trái" className={cn(arrow, "left-0")}>
            <Icon name="back" className="w-4 h-4" />
          </button>
        )}
        <div ref={ref} className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth" role="group" aria-label="Bộ lọc">
          {filters.map((f) => (
            <FilterChip key={f.key} def={f} onChange={(s) => onChange(f.key, s)} />
          ))}
          {active && onClear && (
            <button type="button" onClick={onClear} className="shrink-0 h-8 px-2 text-label font-medium text-muted hover:text-contrast">
              Xoá lọc
            </button>
          )}
        </div>
        {edges.right && (
          <button type="button" onClick={() => scroll(1)} aria-label="Cuộn phải" className={cn(arrow, "right-0")}>
            <Icon name="chevron" className="w-4 h-4" />
          </button>
        )}
      </div>
      {trailing && <div className="shrink-0 flex items-center gap-1 pl-2 border-l border-divider">{trailing}</div>}
    </div>
  );
}

export type ViewMode = "list" | "grid";
export type Density = "comfortable" | "compact";

/** L11: list ↔ grid and density, at the end of the filter row. */
export function ViewSwitch({
  view,
  onViewChange,
  density,
  onDensityChange,
}: {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  density?: Density;
  onDensityChange?: (d: Density) => void;
}) {
  const seg = (on: boolean) =>
    cn(
      "w-8 h-8 rounded-control flex items-center justify-center transition outline-none focus-visible:ring-2 focus-visible:ring-focus",
      on ? "bg-tint-hover text-contrast" : "text-muted hover:text-contrast",
    );
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Kiểu xem">
      <button type="button" aria-pressed={view === "list"} aria-label="Danh sách" title="Danh sách" className={seg(view === "list")} onClick={() => onViewChange("list")}>
        <Icon name="menu" className="w-4 h-4" />
      </button>
      <button type="button" aria-pressed={view === "grid"} aria-label="Lưới" title="Lưới" className={seg(view === "grid")} onClick={() => onViewChange("grid")}>
        <Icon name="grid" className="w-4 h-4" />
      </button>
      {density && onDensityChange && (
        <button
          type="button"
          aria-pressed={density === "compact"}
          aria-label={density === "compact" ? "Thoáng" : "Gọn"}
          title={density === "compact" ? "Thoáng" : "Gọn"}
          className={seg(false)}
          onClick={() => onDensityChange(density === "compact" ? "comfortable" : "compact")}
        >
          <Icon name={density === "compact" ? "expand" : "shrink"} className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/** L4: phone segmented bar: type selector · Filters (count) · settings. */
export function PhoneFilterBar({
  typeLabel,
  typeItems,
  activeCount,
  onOpenFilters,
  onOpenSettings,
}: {
  typeLabel: string;
  typeItems: { label: string; onSelect: () => void }[];
  activeCount: number;
  onOpenFilters: () => void;
  onOpenSettings?: () => void;
}) {
  const seg = "h-10 flex items-center justify-center gap-1.5 text-label font-medium text-contrast hover:bg-tint-hover outline-none focus-visible:ring-2 focus-visible:ring-focus";
  return (
    <div className="flex items-stretch rounded-full bg-tint overflow-hidden divide-x divide-divider">
      <div className="flex-1 min-w-0 flex">
        <Menu
          align="left"
          label="Loại"
          items={typeItems}
          trigger={
            <button type="button" className={cn(seg, "flex-1 px-3")}>
              <span className="truncate">{typeLabel}</span>
              <Icon name="chevronDown" className="w-3.5 h-3.5 text-muted" />
            </button>
          }
        />
      </div>
      <button type="button" onClick={onOpenFilters} className={cn(seg, "flex-1 px-3")}>
        <Icon name="filter" className="w-4 h-4" />
        Bộ lọc
        {activeCount > 0 && (
          <span className="h-5 min-w-5 px-1 rounded-full bg-inverted text-on-inverted text-caption tabular-nums leading-5">{activeCount}</span>
        )}
      </button>
      {onOpenSettings && (
        <button type="button" onClick={onOpenSettings} aria-label="Sắp xếp và kiểu xem" className={cn(seg, "w-12")}>
          <Icon name="sliders" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/** L4: the full-screen filter panel of phones: sort first, then one accordion per filter, booleans as switches. */
export function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
  onClear,
  sort,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterDef[];
  onChange: (key: string, selected: string[]) => void;
  onClear: () => void;
  sort?: SortDef;
  resultCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [openKeys, setOpenKeys] = useState<string[]>(() => filters.filter((f) => f.selected.length > 0).map((f) => f.key).slice(0, 2));
  useDialog(ref, open, onClose);
  if (!open) return null;
  const section = "border-b border-divider";
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Bộ lọc" className="fixed inset-0 z-modal bg-panel-4 flex flex-col">
      <div className="flex items-center h-14 px-2 shrink-0 border-b border-divider">
        <button type="button" onClick={onClose} aria-label="Đóng" className="w-10 h-10 rounded-control flex items-center justify-center text-contrast hover:bg-tint">
          <Icon name="close" className="w-5 h-5" />
        </button>
        <h2 className="flex-1 text-center text-ui-lg font-semibold text-contrast">Bộ lọc</h2>
        <button type="button" onClick={onClear} className="h-10 px-3 rounded-control text-label font-medium text-muted hover:text-contrast">
          Xoá lọc
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sort && (
          <div className={cn(section, "px-4 py-3")}>
            <div className="text-caption font-semibold uppercase tracking-wide text-muted pb-2">Sắp xếp</div>
            <div className="flex flex-wrap gap-2">
              {sort.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={o.value === sort.value}
                  onClick={() => sort.onChange(o.value)}
                  className={cn(
                    "h-9 px-3 rounded-full text-label font-medium",
                    o.value === sort.value ? "bg-inverted text-on-inverted" : "bg-tint text-body",
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
            <div key={f.key} className={cn(section, "px-4 py-3")}>
              <Switch checked={f.selected.length > 0} onChange={(c) => onChange(f.key, c ? ["1"] : [])} label={f.label} />
            </div>
          ))}
        {filters
          .filter((f) => f.kind !== "switch")
          .map((f) => {
            const isOpen = openKeys.includes(f.key);
            return (
              <div key={f.key} className={section}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenKeys(isOpen ? openKeys.filter((k) => k !== f.key) : [...openKeys, f.key])}
                  className="w-full flex items-center gap-3 min-h-14 px-4 text-left"
                >
                  {f.icon && <Icon name={f.icon} className="w-5 h-5 text-muted" />}
                  <span className="flex-1 text-ui font-medium text-contrast">{f.label}</span>
                  {f.selected.length > 0 && <span className="text-label text-muted tabular-nums">{f.selected.length}</span>}
                  <Icon name={isOpen ? "chevronUp" : "chevronDown"} className="w-4 h-4 text-muted" />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 flex flex-col gap-1">
                    {f.options?.map((o) => (
                      <div key={o.value} className="flex items-center gap-2 min-h-10">
                        <Checkbox
                          checked={f.selected.includes(o.value)}
                          onChange={(c) => onChange(f.key, c ? [...f.selected, o.value] : f.selected.filter((s) => s !== o.value))}
                          label={o.label}
                          className="flex-1"
                        />
                        {o.count !== undefined && <span className="text-caption text-muted tabular-nums">{o.count}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <div className="shrink-0 p-3 border-t border-divider pb-[max(12px,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onClose} className="w-full h-12 rounded-control bg-accent text-on-accent text-ui font-semibold hover:bg-accent-hover">
          Xem {resultCount.toLocaleString("vi-VN")} kết quả
        </button>
      </div>
    </div>
  );
}
