"use client";

// Small single-choice filter sets shown in full (2–5 values, often with counts: Đang mở · Đã đóng · Tất cả, #147):
// a `raised` track (radius 8, padding 4, gap 4, h32) with h24 items (padding 6/16, 12px/600) and one solid `raised-2`
// pill (white in light theme) that slides in 300ms ease-out (motion-slide). WAI-ARIA radiogroup / radio with roving
// tabindex, ←/→, ↑/↓, Home / End, manual activation, onBeforeChange guard and sideways scroll with edge cues on phones.
import React from "react";
import {
  edgesAttr,
  TabEdgeCue,
  useTabActivation,
  useTabRowLayout,
  type TabActivation,
  type TabBeforeChange,
} from "./tabUtils";
import type { TabChangeMeta } from "./useTabParam";
import { cn } from "../styles/utils";
import { BTN_HIT } from "../styles/buttons";

export interface SegmentOption<T extends string = string> {
  key: T;
  label: React.ReactNode;
  /** Optional row count shown after the label in tabular numbers. */
  count?: number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  /** Called when the chosen option changes; receives `{ via }` so URL state hooks can replace on arrow keys. */
  onChange: (value: T, meta: TabChangeMeta) => void;
  /** Guard run before switching; return or resolve `false` to keep the current option. */
  onBeforeChange?: TabBeforeChange<T>;
  /** `"automatic"` (default) switches as arrows move; `"manual"` moves focus with arrows and commits on Enter / Space. @default "automatic" */
  activation?: TabActivation;
  /** Accessible name of the radio group ("Trạng thái"). */
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  onBeforeChange,
  activation = "automatic",
  label,
  className,
}: SegmentedControlProps<T>) {
  const optionsKey = options.map((o) => `${o.key}:${o.count ?? ""}:${Boolean(o.disabled)}`).join("|");
  const { scrollerRef, listRef, edges, pill, onScroll } = useTabRowLayout({
    activeSelector: '[role="radio"][aria-checked="true"]',
    measurePill: true,
    deps: [value, optionsKey],
  });

  const { tabStopKey, onListKeyDown, onListBlur, onItemClick } = useTabActivation({
    items: options,
    value,
    onChange,
    onBeforeChange,
    activation,
    allowVerticalArrows: true,
    listRef,
  });

  return (
    <div className={cn("relative inline-block max-w-full min-w-0 align-middle", className)}>
      <TabEdgeCue side="left" shown={edges.left} insetClass="inset-y-1" />
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        data-edges={edgesAttr(edges)}
        className="max-w-full overflow-x-auto overscroll-x-contain no-scrollbar rounded-control"
      >
        <div
          ref={listRef}
          role="radiogroup"
          aria-label={label}
          onKeyDown={onListKeyDown}
          onBlur={onListBlur}
          className="relative inline-flex items-center gap-1 p-1 h-[32px] pointer-coarse:max-sm:h-auto w-max rounded-control bg-raised"
        >
          {pill && (
            <span
              aria-hidden
              data-pill=""
              className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-control bg-raised-2 transition-slide motion-reduce:transition-none"
              style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
            />
          )}
          {options.map((o, n) => {
            const on = o.key === value;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={on}
                data-idx={n}
                disabled={o.disabled}
                tabIndex={o.key === tabStopKey ? 0 : -1}
                onClick={(e) => onItemClick(o, e)}
                className={cn(
                  "relative z-10 inline-flex items-center justify-center shrink-0 whitespace-nowrap h-[24px] px-4 py-1.5 rounded-control text-chrome font-semibold leading-none transition-hover motion-reduce:transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  BTN_HIT,
                  o.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  on ? "text-strong" : "text-muted hover:text-strong",
                )}
              >
                {o.label}
                {o.count !== undefined && (
                  <span className={cn("ml-1.5 tabular-nums font-medium", on ? "text-body" : "text-muted")}>{o.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <TabEdgeCue side="right" shown={edges.right} insetClass="inset-y-1" />
    </div>
  );
}
