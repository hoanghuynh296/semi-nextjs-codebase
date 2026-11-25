"use client";

// Legacy single-choice pill group; deprecated in 1.0 (#147) in favour of SegmentedControl (2–5 filter values with
// counts and a sliding raised-2 pill) and PillTabs (5+ sections or sections with icons). Kept exported so existing
// blocks and consumer apps continue to compile until migrated.
import React from "react";
import { SEGMENT_ON } from "../styles/utils";

/** @deprecated Use `SegmentedControl` (2–5 filter values, with `label`) or `PillTabs` (5+ sections or sections with icons). */
export function Pills<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: { key: T; label: React.ReactNode; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 bg-panel p-0.5 h-control rounded-control border border-line shrink-0 ${className}`}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          title={o.title}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`px-2.5 h-full rounded-control text-ui font-medium whitespace-nowrap transition-hover cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus ${
            value === o.key ? SEGMENT_ON : "text-muted hover:text-strong"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
