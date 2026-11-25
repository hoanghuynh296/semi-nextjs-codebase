"use client";

// Page title and underline display-tab heading of the Semi Design System (#149, docs/DESIGN_SYSTEM.md §1, §4a).
// Titles are text-only (no subtitles). On a work page the title is 18 / 400 in the UI sans on the same row as the
// page's main action (`actions`: an inverse or primary Button, optionally a ••• Menu or RefreshButton before it).
// One-column reading pages can opt into `variant="reading"` (display face 44 / 500, text-title-xl).
import React from "react";
import { PAGE_TITLE_READING_TEXT, PAGE_TITLE_TEXT } from "./pageTitleText";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

/**
 * The page's heading (`h1`). By default (`variant="work"`) it is 18 / 400 in the UI sans on the same row as `actions`
 * (wrapping only when the row runs out of room). Pass `variant="reading"` on a one-column reading page for the 44 / 500
 * display title (`text-title-xl`). Inside `<Page title={…}>`, `<Page>` owns the spacing below this row.
 */
export function PageTitle({
  title,
  actions,
  variant = "work",
  className = "",
}: {
  title: React.ReactNode;
  /**
   * The page's own action at the right end of the title row: one `<Button variant="inverse">` (or `primary` when it is
   * the page's one commit action) with an icon and text, optionally a `RefreshButton` or `•••` `Menu` before it. Leave
   * it out on a page whose `SubpageToolbar` carries the actions.
   */
  actions?: React.ReactNode;
  /**
   * `"work"` (default): 18 / 400 UI sans (`text-figure`), for lists, workspaces and two-column pages.
   * `"reading"`: 44 / 500 display face (`text-title-xl`, lh 1.2, −0.01em), for one-column reading pages only.
   * @default "work"
   */
  variant?: "work" | "reading";
  className?: string;
}) {
  const titleCls = variant === "reading" ? PAGE_TITLE_READING_TEXT : PAGE_TITLE_TEXT;
  if (!actions) {
    return (
      <div className={cn("mb-7 min-w-0", className)}>
        <h1 className={titleCls}>{title}</h1>
      </div>
    );
  }
  return (
    <div className={cn("mb-7 min-w-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-2", className)}>
      <h1 className={cn("min-w-0 flex-1", titleCls)}>{title}</h1>
      <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">{actions}</div>
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
    <div className={`mb-7 min-w-0 ${className}`}>
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
