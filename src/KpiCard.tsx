"use client";

// KPI metric card of the Semi Design System (ported from 3D Noobs Studio jobs/ui.tsx).
// Uses text-[18px] sm:text-[22px] tabular-nums for the primary figure, flat coloured icon in the label row,
// and an inline Skeleton shimmer while loading.
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
  iconTone = "sky",
  loading = false,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "danger" | "good";
  hint?: string;
  icon?: IconName;
  iconTone?: TileTone;
  /** Show a shimmer skeleton in place of the value while loading. */
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={`${CARD} p-3 sm:p-4 flex flex-col gap-2 ${className}`} title={hint}>
      <div className="flex items-center gap-2 text-[12px] font-medium text-gray-400 min-w-0">
        {icon && <Icon name={icon} className={`w-4 h-4 shrink-0 ${TONE_TEXT[iconTone]}`} />}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={`text-[18px] sm:text-[22px] leading-tight font-semibold tracking-tight tabular-nums truncate ${
          tone === "danger" ? "text-rose-300" : tone === "good" ? "text-emerald-300" : "text-white"
        }`}
      >
        {loading ? <Skeleton className="h-6 w-28 my-0.5" /> : value}
      </div>
      {!loading && sub !== undefined && sub !== null && (
        <div className="text-[12px] text-gray-500 truncate -mt-1 tabular-nums">{sub}</div>
      )}
    </div>
  );
}
