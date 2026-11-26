"use client";

// Page title of the Semi Design System (#149, docs/DESIGN_SYSTEM.md §1, §4a).
// Titles are text-only (no subtitles). On a work page the title is 18 / 400 in the UI sans on the same row as the
// page's main action (`actions`: an inverse or primary Button, optionally a ••• Menu or RefreshButton before it).
// One-column reading pages can opt into `variant="reading"` (display face 44 / 500, text-title-xl).
import React from "react";
import { PAGE_TITLE_READING_TEXT, PAGE_TITLE_TEXT } from "./pageTitleText";
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
      <div data-semi="PageTitle" className={cn("mb-7 min-w-0", className)}>
        <h1 className={titleCls}>{title}</h1>
      </div>
    );
  }
  return (
    <div data-semi="PageTitle" className={cn("mb-7 min-w-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-2", className)}>
      <h1 className={cn("min-w-0 flex-1", titleCls)}>{title}</h1>
      <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">{actions}</div>
    </div>
  );
}
