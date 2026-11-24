"use client";

// Big text tabs as the page heading for 2–4 top-level views of a discovery or reading page (#96, #147):
// display face (`font-display text-tab-xl`, 24px below sm / 28px from sm, weight 400, lh 1.2, tracking -0.01em),
// every tab in `text-strong`, inactive at opacity 0.2 (raised on hover / keyboard focus in 150ms), active with a 2px
// brand underline at 6px offset under the word only, gaps 16 / 20 / 24, 28px to the intro below. WAI-ARIA tabs with
// overflow edge cues, manual activation and sync / async onBeforeChange guards on both button and link tabs (#121).
import React, { useId } from "react";
import Link from "next/link";
import {
  edgesAttr,
  TabEdgeCue,
  useTabActivation,
  useTabRowLayout,
  type TabActivation,
  type TabBeforeChange,
} from "./tabUtils";
import type { TabChangeMeta } from "./useTabParam";
import { cn, FOCUS_RING } from "../styles/utils";

export interface TextTabItem<T extends string = string> {
  key: T;
  label: React.ReactNode;
  /** Makes the tab a link (URL-driven tabs, e.g. `?view=archived` or a sibling route). */
  href?: string;
  disabled?: boolean;
}

export interface TextTabsProps<T extends string = string> {
  items: TextTabItem<T>[];
  /** The current tab (read it from the URL for linked tabs, or via `useTabParam`). */
  value: T;
  /** Called with the tab chosen; tabs with `href` call it too, then navigate unless `onBeforeChange` refuses. */
  onChange?: (key: T, meta: TabChangeMeta) => void;
  /** Guard run before switching (button AND href tabs); return or resolve `false` to keep the current tab. */
  onBeforeChange?: TabBeforeChange<T>;
  /** `"automatic"` (default) switches button tabs as arrows move; `"manual"` moves focus with arrows and commits on Enter / Space. @default "automatic" */
  activation?: TabActivation;
  /** Accessible name of the tab list ("Khám phá"). */
  label: string;
  /** Wrap the tabs in the page's `h1` (default): they are the page heading. Set false when the page has its own h1. */
  heading?: boolean;
  /** The current tab's content, rendered in the tab panel (28px below the tab row by default). Omit to render content below. */
  children?: React.ReactNode;
  className?: string;
  panelClassName?: string;
}

export function TextTabs<T extends string = string>({
  items,
  value,
  onChange,
  onBeforeChange,
  activation = "automatic",
  label,
  heading = true,
  children,
  className,
  panelClassName = "pt-7",
}: TextTabsProps<T>) {
  const base = useId();
  const itemsKey = items.map((i) => `${i.key}:${Boolean(i.disabled)}`).join("|");
  const { scrollerRef, listRef, edges, onScroll } = useTabRowLayout({
    activeSelector: '[role="tab"][aria-selected="true"]',
    measurePill: false,
    deps: [value, itemsKey],
  });

  const { tabStopKey, onListKeyDown, onListBlur, onItemClick, onItemKeyDown } = useTabActivation({
    items,
    value,
    onChange,
    onBeforeChange,
    activation,
    listRef,
  });

  const current = Math.max(0, items.findIndex((i) => i.key === value));
  const hasPanel = children !== undefined;

  const list = (
    <div className="relative max-w-full min-w-0">
      <TabEdgeCue side="left" shown={edges.left} insetClass="inset-y-1" />
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        data-edges={edgesAttr(edges)}
        className="max-w-full overflow-x-auto overscroll-x-contain no-scrollbar"
      >
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          onKeyDown={onListKeyDown}
          onBlur={onListBlur}
          className="flex flex-nowrap items-end gap-x-4 sm:gap-x-5 md:gap-x-6 pt-0.5 pb-2 px-0.5 w-max"
        >
          {items.map((it, n) => {
            const on = n === current;
            const props = {
              "data-idx": n,
              id: `${base}-tab-${n}`,
              role: "tab" as const,
              "aria-selected": on,
              "aria-controls": on && hasPanel ? `${base}-panel` : undefined,
              "aria-disabled": it.disabled || undefined,
              tabIndex: it.key === tabStopKey ? 0 : -1,
              onClick: (e: React.MouseEvent<HTMLElement>) => onItemClick(it, e),
              onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onItemKeyDown(it, e),
              className: cn(
                "shrink-0 whitespace-nowrap font-display text-tab-xl font-normal text-strong rounded-control underline decoration-2 underline-offset-6 transition-opacity duration-150",
                it.disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer",
                FOCUS_RING,
                on ? "opacity-100 decoration-primary" : "opacity-20 hover:opacity-50 focus-visible:opacity-100 decoration-transparent",
              ),
            };
            return it.href && !it.disabled ? (
              <Link key={it.key} href={it.href} {...props}>
                {it.label}
              </Link>
            ) : (
              <button key={it.key} type="button" disabled={it.disabled} {...props}>
                {it.label}
              </button>
            );
          })}
        </div>
      </div>
      <TabEdgeCue side="right" shown={edges.right} insetClass="inset-y-1" />
    </div>
  );

  return (
    <div data-text-tabs="" className={cn("mb-7 min-w-0", className)}>
      {heading ? <h1 className="m-0 min-w-0">{list}</h1> : list}
      {hasPanel && (
        <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${current}`} tabIndex={0} className={cn("rounded-control", FOCUS_RING, panelClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
