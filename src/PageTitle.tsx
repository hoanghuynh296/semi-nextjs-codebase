"use client";

// Page title and underline display-tab heading of the Semi Design System (docs/DESIGN_SYSTEM.md §1, §4a).
// Titles are text-only (no subtitles). The page's own action (one primary or secondary, plus a RefreshButton) can sit
// at the right end of the title row (`actions`, a list page above its StickyContextBar); filters go in the toolbar or
// the StickyContextBar below.
import React from "react";
import { PAGE_TITLE_TEXT } from "./pageTitleText";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

/**
 * The page's display heading (its `h1`). With `actions`, the title row of a list page: the title on the left, the
 * page's action on the right; below `sm` the actions wrap onto their own row under the title.
 */
export function PageTitle({
  title,
  actions,
  className = "",
}: {
  title: React.ReactNode;
  /**
   * The page's own action at the right end of the title row: one `<Button variant="primary">` (or `inverse`) with an
   * icon and text, optionally a `RefreshButton` before it. More actions go in a ⋯ `Menu` as the last item. Below `sm`
   * they wrap under the title. Leave it out on a page whose `SubpageToolbar` carries the actions.
   */
  actions?: React.ReactNode;
  className?: string;
}) {
  if (!actions) {
    return (
      <div className={`mb-6 sm:mb-7 min-w-0 ${className}`}>
        <h1 className={`pb-2 ${PAGE_TITLE_TEXT}`}>{title}</h1>
      </div>
    );
  }
  return (
    <div className={cn("mb-6 sm:mb-7 min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-stack", className)}>
      <h1 className={cn("min-w-0 sm:flex-1 sm:pb-2", PAGE_TITLE_TEXT)}>{title}</h1>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:pb-2">{actions}</div>
    </div>
  );
}

export interface PageTabOption<T extends string = string> {
  key: T;
  label: React.ReactNode;
}

/**
 * Underline display tabs used when a view groups 2–4 sibling sub-pages (e.g. "Máy in / Job in", "Sản phẩm / Danh mục").
 * @deprecated Use `TextTabs` (big display tabs with brand underline, roving tabindex, href and guard support) or `PillTabs` (5+ sections).
 */
export function PageTabsTitle<T extends string = string>({
  tabs,
  value,
  onChange,
  ariaLabel: ariaLabelProp,
  className = "",
}: {
  tabs: PageTabOption<T>[];
  value: T;
  onChange: (key: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const ariaLabel = ariaLabelProp ?? t.views;
  return (
    <div className={`mb-6 sm:mb-7 min-w-0 ${className}`}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const isOn = value === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isOn}
              onClick={() => onChange(tab.key)}
              className={`relative pb-2 font-display text-section sm:text-tab-xl leading-[1.15] font-title tracking-tight whitespace-nowrap transition cursor-pointer shrink-0 ${
                isOn ? "text-strong" : "text-muted hover:text-strong"
              }`}
            >
              {tab.label}
              {isOn && <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
