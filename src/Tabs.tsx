"use client";

// In-page tabs for sections of one record inside a card or dialog (WAI-ARIA tabs: ←/→/Home/End move, the active tab is
// the only tab stop). For 5+ page sections or sections with icons use PillTabs; for 2–4 sibling views use TextTabs; for
// 2–5 filter values use SegmentedControl.
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
  label,
  className,
  panelClassName = "pt-4",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  /** Accessible name of the tab list. */
  label?: string;
  className?: string;
  panelClassName?: string;
}) {
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const enabled = items.filter((i) => !i.disabled);
  const active = items.find((i) => i.key === value);

  // the tab in the tab order: the selected one, or the first enabled tab when the value matches none (or a disabled one)
  const focusKey = active && !active.disabled ? active.key : enabled[0]?.key;
  // ids and lookups use the position, so a key with spaces or quotes is fine
  const idx = (key: T) => items.findIndex((i) => i.key === key);
  const move = (dir: 1 | -1 | "first" | "last") => {
    const at = enabled.findIndex((i) => i.key === (focusKey ?? value));
    const next = dir === "first" ? enabled[0] : dir === "last" ? enabled[enabled.length - 1] : enabled[(at + dir + enabled.length) % enabled.length];
    if (!next) return;
    onChange(next.key);
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx(next.key)}"]`)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, 1 | -1 | "first" | "last"> = { ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" };
    if (map[e.key] !== undefined) {
      e.preventDefault();
      move(map[e.key]);
    }
  };

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex items-center gap-5 border-b border-divider no-scrollbar overflow-x-auto"
      >
        {items.map((it, n) => {
          const on = it.key === value;
          return (
            <button
              key={it.key}
              data-idx={n}
              id={`${base}-tab-${n}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={on && it.content !== undefined ? `${base}-panel-${n}` : undefined}
              tabIndex={it.key === focusKey ? 0 : -1}
              disabled={it.disabled}
              onClick={() => onChange(it.key)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap text-ui font-medium transition-hover cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 h-9 -mb-px border-b-2",
                FOCUS_RING,
                on ? "border-strong text-strong" : "border-transparent text-muted hover:text-strong",
              )}
            >
              {it.icon && <Icon name={it.icon} className="w-3.5 h-3.5" />}
              {it.label}
              {it.count !== undefined && <span className="text-chrome tabular-nums text-muted">{it.count}</span>}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div
          role="tabpanel"
          id={`${base}-panel-${idx(active.key)}`}
          aria-labelledby={`${base}-tab-${idx(active.key)}`}
          tabIndex={0}
          className={cn("rounded-control", FOCUS_RING, panelClassName)}
        >
          {active.content}
        </div>
      )}
    </div>
  );
}
