"use client";

// Search and filters (#99, C-032 L11): list ↔ grid and the density toggle, at the end of the filter row.
import React from "react";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export type ViewMode = "list" | "grid";
export type ViewDensity = "comfortable" | "compact";

/**
 * Two toggle buttons (list, grid; aria-pressed) and an optional density toggle. Put it in FilterChipRow's `trailing`;
 * keep the choice in the URL (`?view=grid`) or per person (localStorage) as the page needs.
 */
export function ViewSwitch({
  view,
  onViewChange,
  density,
  onDensityChange,
  className,
}: {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  /** Shows the density toggle when given with `onDensityChange`. */
  density?: ViewDensity;
  onDensityChange?: (density: ViewDensity) => void;
  className?: string;
}) {
  const t = useSemiLocale();
  const seg = (on: boolean) =>
    cn(
      "w-8 h-8 rounded-control flex items-center justify-center transition outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer",
      on ? "bg-tint-hover text-strong" : "text-muted hover:text-strong hover:bg-tint",
    );
  const compact = density === "compact";
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="group" aria-label={t.viewMode}>
      <button type="button" aria-pressed={view === "list"} aria-label={t.viewList} title={t.viewList} className={seg(view === "list")} onClick={() => onViewChange("list")}>
        <Icon name="menu" className="w-4 h-4" />
      </button>
      <button type="button" aria-pressed={view === "grid"} aria-label={t.viewGrid} title={t.viewGrid} className={seg(view === "grid")} onClick={() => onViewChange("grid")}>
        <Icon name="grid" className="w-4 h-4" />
      </button>
      {density && onDensityChange && (
        <button
          type="button"
          aria-pressed={compact}
          aria-label={t.densityCompact}
          title={compact ? t.densityComfortable : t.densityCompact}
          className={seg(compact)}
          onClick={() => onDensityChange(compact ? "comfortable" : "compact")}
        >
          <Icon name={compact ? "expand" : "shrink"} className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
