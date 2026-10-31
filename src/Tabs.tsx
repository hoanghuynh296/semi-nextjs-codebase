"use client";

// In-page tabs (WAI-ARIA tabs: ←/→/Home/End move, the active tab is the only tab stop). For switching between 2–4
// sibling pages use PageTabsTitle; for a filter with no panels use Pills.
import React, { useId, useRef } from "react";
import { Icon, type IconName } from "./Icon";
import { cn, FOCUS_RING } from "../styles/utils";

export interface TabItem<T extends string> {
  key: T;
  label: React.ReactNode;
  icon?: IconName;
  /** Small count after the label (tabular-nums). */
  count?: number;
  disabled?: boolean;
  /** Panel content; omit to render the panel yourself. */
  content?: React.ReactNode;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = "underline",
  label,
  className,
  panelClassName = "pt-4",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  /** underline = section tabs inside a card or page · segmented = compact switch inside a toolbar. */
  variant?: "underline" | "segmented";
  /** Accessible name of the tab list. */
  label?: string;
  className?: string;
  panelClassName?: string;
}) {
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const enabled = items.filter((i) => !i.disabled);
  const active = items.find((i) => i.key === value);

  const move = (dir: 1 | -1 | "first" | "last") => {
    const idx = enabled.findIndex((i) => i.key === value);
    const next = dir === "first" ? enabled[0] : dir === "last" ? enabled[enabled.length - 1] : enabled[(idx + dir + enabled.length) % enabled.length];
    if (!next) return;
    onChange(next.key);
    listRef.current?.querySelector<HTMLElement>(`[data-key="${next.key}"]`)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, 1 | -1 | "first" | "last"> = { ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" };
    if (map[e.key] !== undefined) {
      e.preventDefault();
      move(map[e.key]);
    }
  };

  const seg = variant === "segmented";
  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          "flex items-center no-scrollbar overflow-x-auto",
          seg ? "inline-flex gap-0.5 bg-field p-0.5 h-[34px] rounded-lg border border-line" : "gap-5 border-b border-divider",
        )}
      >
        {items.map((it) => {
          const on = it.key === value;
          return (
            <button
              key={it.key}
              data-key={it.key}
              id={`${base}-tab-${it.key}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={on && it.content !== undefined ? `${base}-panel-${it.key}` : undefined}
              tabIndex={on ? 0 : -1}
              disabled={it.disabled}
              onClick={() => onChange(it.key)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap text-label font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0",
                FOCUS_RING,
                seg
                  ? cn("h-full px-2.5 rounded-lg", on ? "bg-raised text-contrast" : "text-muted hover:text-contrast")
                  : cn("h-9 -mb-px border-b-2", on ? "border-accent text-contrast" : "border-transparent text-muted hover:text-contrast"),
              )}
            >
              {it.icon && <Icon name={it.icon} className="w-3.5 h-3.5" />}
              {it.label}
              {it.count !== undefined && <span className="text-caption tabular-nums text-muted">{it.count}</span>}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div
          role="tabpanel"
          id={`${base}-panel-${active.key}`}
          aria-labelledby={`${base}-tab-${active.key}`}
          tabIndex={0}
          className={cn("outline-none", panelClassName)}
        >
          {active.content}
        </div>
      )}
    </div>
  );
}
