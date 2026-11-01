"use client";

// KPI metric card of the Semi Design System. The figure uses the brand's figure font and title weight (font-figure,
// font-title) and tabular-nums; the icon is neutral unless iconTone gives it a meaning. featured = the one big number
// a screen leads with (spans two columns in a grid, larger figure).
import React from "react";
import { Icon, TONE_TEXT, type IconName, type TileTone } from "./Icon";
import { Skeleton } from "./Skeleton";
import { CARD } from "../styles/surfaces";

export function KpiCard({
  label,
  value,
  sub,
  tone,
  hint,
  icon,
  iconTone,
  featured = false,
  loading = false,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  /** A line under the figure (trend, comparison); coloured by `tone`. */
  sub?: React.ReactNode;
  /** Colour of the figure when it is good or bad news. Leave unset for a neutral figure. */
  tone?: "danger" | "good";
  /** Becomes the card's title (tooltip). */
  hint?: string;
  /** Optional icon before the label. Most KPI rows read better without one. */
  icon?: IconName;
  /** Colour of the icon. Unset = neutral (text-muted). Give a colour only when it means something (a status), never
   * one decorative colour per card. */
  iconTone?: TileTone;
  /** The screen's main number: larger figure, spans two columns of the grid it sits in. Use one per row at most. */
  featured?: boolean;
  /** Show a shimmer skeleton in place of the value while loading. */
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={`${CARD} ${featured ? "col-span-2 p-4 sm:p-5 gap-3" : "p-3 sm:p-4 gap-2"} flex flex-col ${className}`} title={hint}>
      <div className="flex items-center gap-2 text-label font-medium text-muted min-w-0">
        {icon && <Icon name={icon} className={`w-4 h-4 shrink-0 ${iconTone ? TONE_TEXT[iconTone] : "text-muted"}`} />}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={`font-figure font-title leading-tight tracking-tight tabular-nums truncate ${
          featured ? "text-heading-lg sm:text-display" : "text-kpi sm:text-heading"
        } ${tone === "danger" ? "text-danger-fg" : tone === "good" ? "text-success-fg" : "text-contrast"}`}
      >
        {loading ? <Skeleton className={`${featured ? "h-8 w-36" : "h-6 w-28"} my-0.5`} /> : value}
      </div>
      {!loading && sub !== undefined && sub !== null && (
        <div className="text-label text-muted truncate -mt-1 tabular-nums">{sub}</div>
      )}
    </div>
  );
}
