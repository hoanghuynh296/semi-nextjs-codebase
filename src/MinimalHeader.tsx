"use client";

// Minimal page header (#96, L18 of the #94 study): where the page sits on the left (a Breadcrumb, or a title), and at
// most one text link plus one primary action on the right. It opens a detail or settings page inside AppShell, above
// the page's own heading (PageTitle / TextTabs). A list page has no MinimalHeader: its action sits on the title row
// (PageTitle `actions`) above a StickyContextBar, or in its SubpageToolbar.
import React from "react";
import { cn } from "../styles/utils";

export interface MinimalHeaderProps {
  /** Left side: a `Breadcrumb` (usual) or a short title. Truncates, never wraps the row. */
  left: React.ReactNode;
  /** One text link (a `Link` / `ExternalLink`: "Hướng dẫn", "Xem lịch sử"). Hidden below `sm`, so do not put the only way to something here. */
  link?: React.ReactNode;
  /** One primary action (`<Button variant="primary">`); a second action belongs in the page or a `Menu`. */
  primary?: React.ReactNode;
  className?: string;
}

export function MinimalHeader({ left, link, primary, className }: MinimalHeaderProps) {
  return (
    <header className={cn("flex items-center gap-3 min-h-12 mb-4 min-w-0", className)}>
      <div className="flex-1 min-w-0 truncate">{left}</div>
      {link && <div className="hidden sm:flex items-center shrink-0 text-chrome font-medium">{link}</div>}
      {primary && <div className="flex items-center shrink-0">{primary}</div>}
    </header>
  );
}
