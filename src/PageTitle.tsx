"use client";

// Page title and underline display-tab heading of the Semi Design System (docs/DESIGN_SYSTEM.md §1, §4a).
// Titles are text-only (no subtitles, no text action buttons on the title row — actions belong in SubpageToolbar).
import React from "react";
import { useSemiLocale } from "./locale";

export function PageTitle({
  title,
  className = "",
}: {
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 sm:mb-7 min-w-0 ${className}`}>
      <h1 className="pb-2 font-display text-heading sm:text-display leading-[1.15] font-semibold text-contrast tracking-tight truncate">
        {title}
      </h1>
    </div>
  );
}

export interface PageTabOption<T extends string = string> {
  key: T;
  label: React.ReactNode;
}

/**
 * Underline display tabs used when a view groups 2–4 sibling sub-pages (e.g. "Máy in / Job in", "Sản phẩm / Danh mục").
 * Replaces putting a separate <Pills> bar directly under a <PageTitle>.
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
              className={`relative pb-2 font-display text-heading sm:text-display leading-[1.15] font-semibold tracking-tight whitespace-nowrap transition cursor-pointer shrink-0 ${
                isOn ? "text-contrast" : "text-muted hover:text-contrast"
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
