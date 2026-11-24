"use client";

// Shared mechanics of PillTabs, SegmentedControl and TextTabs (internal, not exported from @semi/ui):
// sideways scroll with edge cues, keeping the active item in horizontal view without scrolling the page vertically,
// measuring the sliding active pill, manual vs automatic activation, and sync / async onBeforeChange guards on both
// button and link tabs (#121, #147).
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TabChangeMeta } from "./useTabParam";
import { cn } from "../styles/utils";

export type TabActivation = "automatic" | "manual";
export type TabBeforeChange<T extends string = string> = (key: T) => boolean | Promise<boolean>;

function isPromiseLike(value: unknown): value is PromiseLike<boolean> {
  return typeof value === "object" && value !== null && typeof (value as PromiseLike<boolean>).then === "function";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll `scroller` sideways (never vertically, so the page never jumps) to keep `activeEl` inside its box. */
export function keepInHorizontalView(scroller: HTMLElement, list: HTMLElement, activeEl: HTMLElement, smooth: boolean) {
  if (scroller.scrollWidth <= scroller.clientWidth + 1) return;
  const pad = 12;
  const left = activeEl.offsetLeft + list.offsetLeft;
  const right = left + activeEl.offsetWidth;
  if (left < scroller.scrollLeft + pad) {
    scroller.scrollTo({ left: Math.max(0, left - pad), behavior: smooth ? "smooth" : "auto" });
  } else if (right > scroller.scrollLeft + scroller.clientWidth - pad) {
    scroller.scrollTo({ left: right - scroller.clientWidth + pad, behavior: smooth ? "smooth" : "auto" });
  }
}

export interface ScrollEdges {
  left: boolean;
  right: boolean;
  scrolls: boolean;
}

/** `data-edges` value matching DataTable ("right", "left", "left right", "none", or undefined when it fits). */
export function edgesAttr(edges: ScrollEdges): string | undefined {
  if (!edges.scrolls) return undefined;
  return [edges.left && "left", edges.right && "right"].filter(Boolean).join(" ") || "none";
}

/** Measure sideways overflow edges, the sliding pill box (optional), and scroll the active item into horizontal view. */
export function useTabRowLayout({
  activeSelector,
  measurePill,
  deps,
}: {
  activeSelector: string;
  measurePill: boolean;
  deps: readonly unknown[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [edges, setEdges] = useState<ScrollEdges>({ left: false, right: false, scrolls: false });
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const measureEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    const scrolls = el.scrollWidth > el.clientWidth + 1;
    setEdges((prev) => (prev.left === left && prev.right === right && prev.scrolls === scrolls ? prev : { left, right, scrolls }));
  }, []);

  const measureAll = useCallback(() => {
    const scroller = scrollerRef.current;
    const list = listRef.current;
    if (!scroller || !list) return;
    if (measurePill) {
      const on = list.querySelector<HTMLElement>(activeSelector);
      const next = on ? { left: on.offsetLeft, width: on.offsetWidth } : null;
      setPill((prev) => {
        if (!prev && !next) return prev;
        if (prev && next && prev.left === next.left && prev.width === next.width) return prev;
        return next;
      });
    }
    measureEdges();
  }, [activeSelector, measurePill, measureEdges]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const list = listRef.current;
    if (!scroller || !list) return;
    measureAll();
    const on = list.querySelector<HTMLElement>(activeSelector);
    if (on) {
      keepInHorizontalView(scroller, list, on, mountedRef.current && !prefersReducedMotion());
      measureEdges();
    }
    mountedRef.current = true;
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureAll);
    ro?.observe(scroller);
    ro?.observe(list);
    for (const child of Array.from(list.children)) ro?.observe(child);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measureAll();
    });
    return () => {
      cancelled = true;
      ro?.disconnect();
    };
  }, deps);

  return { scrollerRef, listRef, edges, pill, onScroll: measureEdges };
}

/** Thin 2px neutral edge line shown on each overflowing side; fades in 150ms (instant under reduced motion). */
export function TabEdgeCue({
  side,
  shown,
  insetClass = "inset-y-0.5",
}: {
  side: "left" | "right";
  shown: boolean;
  insetClass?: string;
}) {
  return (
    <span
      aria-hidden
      data-edge={side}
      className={cn(
        "pointer-events-none absolute z-10 w-0.5 rounded-full bg-outline-line transition-opacity duration-150 motion-reduce:transition-none",
        insetClass,
        side === "left" ? "left-0" : "right-0",
        shown ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

export interface KeyNavItem<T extends string> {
  key: T;
  disabled?: boolean;
  href?: string;
}

/**
 * Shared roving-tabindex, manual/automatic activation and sync/async `onBeforeChange` controller for tab and segment
 * rows. In automatic mode on button items, arrow keys request a change first and move focus only once `value` actually
 * updates (so a refusing guard keeps both selection and focus in place).
 */
export function useTabActivation<T extends string>({
  items,
  value,
  onChange,
  onBeforeChange,
  activation = "automatic",
  allowVerticalArrows = false,
  listRef,
}: {
  items: readonly KeyNavItem<T>[];
  value: T;
  onChange?: (key: T, meta: TabChangeMeta) => void;
  onBeforeChange?: TabBeforeChange<T>;
  activation?: TabActivation;
  allowVerticalArrows?: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [focusedKey, setFocusedKey] = useState<T | null>(null);
  const pendingFocusKey = useRef<T | null>(null);
  const bypassLinkKey = useRef<T | null>(null);
  const guardSeq = useRef(0);

  useEffect(
    () => () => {
      guardSeq.current += 1;
      bypassLinkKey.current = null;
      pendingFocusKey.current = null;
    },
    [],
  );

  const enabled = items.filter((i) => !i.disabled);
  const activeItem = items.find((i) => i.key === value);
  const selectedStop = activeItem && !activeItem.disabled ? activeItem.key : enabled[0]?.key;
  const tabStopKey =
    focusedKey !== null && enabled.some((i) => i.key === focusedKey) ? focusedKey : selectedStop;

  const focusItem = useCallback(
    (key: T) => {
      const idx = items.findIndex((i) => i.key === key);
      if (idx < 0) return;
      listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.focus();
    },
    [items, listRef],
  );

  // Move focus to the requested item once `value` actually updates (covers sync state, deferred urlState microtasks
  // and async confirmDialog guards).
  useLayoutEffect(() => {
    if (pendingFocusKey.current !== null && pendingFocusKey.current === value) {
      const target = pendingFocusKey.current;
      pendingFocusKey.current = null;
      setFocusedKey(null);
      focusItem(target);
    }
  }, [value, focusItem]);

  const requestButtonChange = useCallback(
    (nextKey: T, via: "keyboard" | "click") => {
      const seq = ++guardSeq.current;
      if (nextKey === value) {
        if (via === "click") setFocusedKey(null);
        return;
      }
      if (onBeforeChange) {
        const res = onBeforeChange(nextKey);
        if (res === false) {
          pendingFocusKey.current = null;
          return;
        }
        if (isPromiseLike(res)) {
          void Promise.resolve(res).then(
            (ok) => {
              if (guardSeq.current !== seq) return;
              if (!ok) {
                if (pendingFocusKey.current === nextKey) pendingFocusKey.current = null;
                return;
              }
              if (via === "keyboard") pendingFocusKey.current = nextKey;
              else setFocusedKey(null);
              onChange?.(nextKey, { via });
            },
            () => {
              if (guardSeq.current === seq && pendingFocusKey.current === nextKey) pendingFocusKey.current = null;
            },
          );
          return;
        }
      }
      if (via === "keyboard") pendingFocusKey.current = nextKey;
      else setFocusedKey(null);
      onChange?.(nextKey, { via });
    },
    [value, onBeforeChange, onChange],
  );

  const onItemClick = useCallback(
    (item: KeyNavItem<T>, e: React.MouseEvent<HTMLElement>) => {
      if (item.disabled) {
        e.preventDefault();
        return;
      }
      if (item.href) {
        // Modified clicks (⌘-click, middle-click) open a new tab: leave them to the browser.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (bypassLinkKey.current === item.key) {
          bypassLinkKey.current = null;
          setFocusedKey(null);
          onChange?.(item.key, { via: "click" });
          return;
        }
        const seq = ++guardSeq.current;
        if (item.key === value) return;
        if (onBeforeChange) {
          const res = onBeforeChange(item.key);
          if (res === false) {
            e.preventDefault();
            return;
          }
          if (isPromiseLike(res)) {
            // Prevent Next's <Link> from navigating while the guard promise settles; re-click once approved.
            e.preventDefault();
            const target = e.currentTarget;
            void Promise.resolve(res).then(
              (ok) => {
                if (guardSeq.current !== seq || !ok || !target.isConnected) return;
                bypassLinkKey.current = item.key;
                try {
                  target.click();
                } finally {
                  if (bypassLinkKey.current === item.key) bypassLinkKey.current = null;
                }
              },
              () => {
                // Rejected guard refuses navigation cleanly.
              },
            );
            return;
          }
        }
        setFocusedKey(null);
        onChange?.(item.key, { via: "click" });
        return;
      }
      requestButtonChange(item.key, "click");
    },
    [value, onBeforeChange, onChange, requestButtonChange],
  );

  const onItemKeyDown = useCallback((item: KeyNavItem<T>, e: React.KeyboardEvent<HTMLElement>) => {
    // WAI-ARIA tabs: Space activates a focused tab too (native <a> only activates on Enter).
    if (item.href && e.key === " " && !item.disabled) {
      e.preventDefault();
      e.currentTarget.click();
    }
  }, []);

  const onListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!enabled.length) return;
      const isNext = e.key === "ArrowRight" || (allowVerticalArrows && e.key === "ArrowDown");
      const isPrev = e.key === "ArrowLeft" || (allowVerticalArrows && e.key === "ArrowUp");
      const isHome = e.key === "Home";
      const isEnd = e.key === "End";
      if (!isNext && !isPrev && !isHome && !isEnd) return;
      e.preventDefault();

      const activeEl = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
      const activeIdxAttr = activeEl && listRef.current?.contains(activeEl) ? activeEl.getAttribute("data-idx") : null;
      const currentFromDom = activeIdxAttr !== null ? items[Number(activeIdxAttr)]?.key : undefined;
      const originKey = currentFromDom ?? tabStopKey ?? value;
      const at = Math.max(0, enabled.findIndex((i) => i.key === originKey));

      const next = isHome
        ? enabled[0]
        : isEnd
          ? enabled[enabled.length - 1]
          : enabled[(at + (isNext ? 1 : -1) + enabled.length) % enabled.length];
      if (!next) return;

      if (activation === "manual" || next.href) {
        pendingFocusKey.current = null;
        setFocusedKey(next.key);
        focusItem(next.key);
      } else {
        requestButtonChange(next.key, "keyboard");
      }
    },
    [enabled, allowVerticalArrows, listRef, items, tabStopKey, value, activation, focusItem, requestButtonChange],
  );

  const onListBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocusedKey(null);
    }
  }, []);

  return {
    tabStopKey,
    onListKeyDown,
    onListBlur,
    onItemClick,
    onItemKeyDown,
  };
}
