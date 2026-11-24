"use client";

// Default tabs for pages with 5+ sections or sections with icons (settings-like pages, #147): no track, h30 fully
// round pills (16px icon + 4px gap + 12px/600 label), inactive muted, active strong, with one item-hover pill that
// slides in 300ms ease-out (motion-slide). Scrolls sideways with edge cues when overflowing; WAI-ARIA tablist / tab /
// tabpanel with roving tabindex, ←/→, Home / End, manual activation and sync / async onBeforeChange guards (#121).
import React, { useId } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
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

export type { TabActivation, TabBeforeChange };

export interface PillTabItem<T extends string = string> {
  key: T;
  label: React.ReactNode;
  icon?: IconName;
  /** Makes the tab a link (URL-driven routes); onBeforeChange can still refuse navigation. */
  href?: string;
  disabled?: boolean;
  /** Panel content for this tab; omit when passing `children` or rendering the panel yourself via `idPrefix`. */
  content?: React.ReactNode;
}

export type PillTab<T extends string = string> = PillTabItem<T>;

export interface PillTabsProps<T extends string = string> {
  items: PillTabItem<T>[];
  value: T;
  /** Called when the active tab changes; receives `{ via }` so URL state hooks can replace on arrow keys. */
  onChange?: (key: T, meta: TabChangeMeta) => void;
  /** Guard run before switching (button AND href tabs); return or resolve `false` to stay on the current tab. */
  onBeforeChange?: TabBeforeChange<T>;
  /** `"automatic"` (default) switches as arrows move; `"manual"` moves focus with arrows and commits on Enter / Space. @default "automatic" */
  activation?: TabActivation;
  /** Accessible name of the tab list ("Cấu hình"). */
  label: string;
  /**
   * Optional id prefix when the page renders its own `role="tabpanel"` below: tab `${idPrefix}-tab-${key}` controls
   * panel `${idPrefix}-panel`. Omit when passing `children` or item `content` (ids are generated automatically).
   */
  idPrefix?: string;
  /** Active panel content; omit to use per-item `content` or render the panel yourself. */
  children?: React.ReactNode;
  className?: string;
  panelClassName?: string;
}

export function PillTabs<T extends string = string>({
  items,
  value,
  onChange,
  onBeforeChange,
  activation = "automatic",
  label,
  idPrefix,
  children,
  className,
  panelClassName = "pt-7",
}: PillTabsProps<T>) {
  const base = useId();
  const itemsKey = items.map((i) => `${i.key}:${Boolean(i.disabled)}`).join("|");
  const { scrollerRef, listRef, edges, pill, onScroll } = useTabRowLayout({
    activeSelector: '[role="tab"][aria-selected="true"]',
    measurePill: true,
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

  const activeIdx = Math.max(0, items.findIndex((i) => i.key === value));
  const activeItem = items[activeIdx];
  const panelBody = children !== undefined ? children : activeItem?.content;
  const hasOwnPanel = panelBody !== undefined;
  const tabId = (it: PillTabItem<T>, n: number) => (idPrefix ? `${idPrefix}-tab-${it.key}` : `${base}-tab-${n}`);
  const panelId = idPrefix ? `${idPrefix}-panel` : `${base}-panel`;

  return (
    <div className={cn("min-w-0 max-w-full", className)}>
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
            className="relative inline-flex items-center w-max p-0.5"
          >
            {pill && (
              <span
                aria-hidden
                data-pill=""
                className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-full bg-item-hover transition-slide motion-reduce:transition-none"
                style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
              />
            )}
            {items.map((it, n) => {
              const on = it.key === value;
              const sharedClass = cn(
                "relative z-10 inline-flex items-center gap-1 shrink-0 whitespace-nowrap h-[30px] px-4 py-1.5 rounded-full text-chrome font-semibold leading-none transition-hover motion-reduce:transition-opacity",
                it.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                FOCUS_RING,
                on ? "text-strong" : "text-muted hover:text-strong",
              );
              const commonProps = {
                "data-idx": n,
                id: tabId(it, n),
                role: "tab" as const,
                "aria-selected": on,
                "aria-controls": on && (hasOwnPanel || Boolean(idPrefix)) ? panelId : undefined,
                "aria-disabled": it.disabled || undefined,
                tabIndex: it.key === tabStopKey ? 0 : -1,
                onClick: (e: React.MouseEvent<HTMLElement>) => onItemClick(it, e),
                onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onItemKeyDown(it, e),
                className: sharedClass,
              };
              const inner = (
                <>
                  {it.icon && <Icon name={it.icon} className="w-4 h-4 shrink-0" />}
                  {it.label}
                </>
              );
              return it.href && !it.disabled ? (
                <Link key={it.key} href={it.href} {...commonProps}>
                  {inner}
                </Link>
              ) : (
                <button key={it.key} type="button" disabled={it.disabled} {...commonProps}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
        <TabEdgeCue side="right" shown={edges.right} insetClass="inset-y-1" />
      </div>
      {hasOwnPanel && activeItem && (
        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={tabId(activeItem, activeIdx)}
          tabIndex={0}
          className={cn("rounded-control", FOCUS_RING, panelClassName)}
        >
          {panelBody}
        </div>
      )}
    </div>
  );
}
