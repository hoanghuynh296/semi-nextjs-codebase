"use client";

// Text tabs as the page heading (#96, L19 of the #94 study): 2–4 sibling views named in display type, the current one
// bright and the others dim, no underline or tab chrome. WAI-ARIA tabs: ←/→/Home/End move between tabs and the
// current one is the only tab stop. Buttons switch at once (onChange); tabs with `href` are links (URL-driven: the URL
// picks the tab, ←/→ move focus, Enter follows the link).
import React, { useId, useRef } from "react";
import Link from "next/link";
import { cn, FOCUS_RING } from "../styles/utils";

export interface TextTabItem<T extends string = string> {
  key: T;
  label: React.ReactNode;
  /** Makes the tab a link (URL-driven tabs, e.g. `?view=archived` or a sibling route). */
  href?: string;
}

export interface TextTabsProps<T extends string = string> {
  items: TextTabItem<T>[];
  /** The current tab (read it from the URL for linked tabs). */
  value: T;
  /** Called with the tab chosen; tabs with `href` call it too, then navigate. */
  onChange?: (key: T) => void;
  /** Accessible name of the tab list ("Đơn hàng"). */
  label: string;
  /** Wrap the tabs in the page's `h1` (default): they are the page heading. Set false when the page has its own h1. */
  heading?: boolean;
  /** The current tab's content, rendered in the tab panel. Omit to render the content yourself below. */
  children?: React.ReactNode;
  className?: string;
  panelClassName?: string;
}

export function TextTabs<T extends string = string>({
  items,
  value,
  onChange,
  label,
  heading = true,
  children,
  className,
  panelClassName = "pt-4",
}: TextTabsProps<T>) {
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const current = Math.max(0, items.findIndex((i) => i.key === value));
  const hasPanel = children !== undefined;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const tabs = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
    const at = tabs.indexOf(document.activeElement as HTMLElement);
    const map: Record<string, number> = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in map) || !tabs.length) return;
    e.preventDefault();
    const n = (map[e.key] + tabs.length) % tabs.length;
    tabs[n].focus();
    // buttons follow focus (automatic activation); links wait for Enter, so moving never reloads a route
    if (!items[n].href) onChange?.(items[n].key);
  };

  const list = (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex items-baseline gap-x-5 sm:gap-x-7 overflow-x-auto no-scrollbar"
    >
      {items.map((it, n) => {
        const on = n === current;
        const props = {
          id: `${base}-tab-${n}`,
          role: "tab",
          "aria-selected": on,
          "aria-controls": on && hasPanel ? `${base}-panel` : undefined,
          tabIndex: on ? 0 : -1,
          onClick: () => onChange?.(it.key),
          className: cn(
            "shrink-0 whitespace-nowrap font-display text-heading sm:text-display leading-[1.15] font-title tracking-tight rounded-control transition cursor-pointer",
            FOCUS_RING,
            on ? "text-contrast" : "text-muted hover:text-body",
          ),
        } as const;
        return it.href ? (
          <Link key={it.key} href={it.href} {...props}>
            {it.label}
          </Link>
        ) : (
          <button key={it.key} type="button" {...props}>
            {it.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("mb-6 sm:mb-7 min-w-0", className)}>
      {heading ? <h1 className="m-0 min-w-0">{list}</h1> : list}
      {hasPanel && (
        <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${current}`} tabIndex={0} className={cn("rounded-control", FOCUS_RING, panelClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
