"use client";

// A thin divider between groups of content, horizontal or vertical, optionally with a short label in the middle.
import React from "react";
import { cn } from "../styles/utils";

export function Separator({
  orientation = "horizontal",
  label,
  decorative = true,
  className,
}: {
  orientation?: "horizontal" | "vertical";
  /** Short text in the middle of a horizontal line ("hoặc"). */
  label?: React.ReactNode;
  /** true (default): purely visual, hidden from screen readers. false: announced as a separator. */
  decorative?: boolean;
  className?: string;
}) {
  const a11y = decorative ? { "aria-hidden": true } : { role: "separator", "aria-orientation": orientation };
  if (orientation === "vertical") return <div {...a11y} className={cn("w-px self-stretch bg-divider shrink-0", className)} />;
  if (label)
    return (
      <div {...a11y} className={cn("flex items-center gap-3 text-caption text-muted", className)}>
        <span className="h-px flex-1 bg-divider" />
        <span className="shrink-0">{label}</span>
        <span className="h-px flex-1 bg-divider" />
      </div>
    );
  return <div {...a11y} className={cn("h-px w-full bg-divider", className)} />;
}
