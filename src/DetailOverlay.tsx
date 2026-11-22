"use client";

// An item of a list opens over the list (L9) instead of on its own page: its own URL (`?open=<id>`), ‹ › (and ← →)
// through the current result set with "n / N", close / Esc / Back returns to the list at the same scroll position
// (the list never unmounts). The side panel holds the actions (SplitButton + an icon row + ⋯). Existing detail routes
// stay as deep-link targets.
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useDialog } from "./a11y";
import { useFilterParams } from "./FilterChipRow";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

/** What useDetailParam returns: the open id and the ways to change it (all write the URL). */
export interface DetailParamState {
  /** The id in the URL (`?open=`), or null when nothing is open (also during the server render and hydration). */
  openId: string | null;
  /** Open an item: a new history entry, so Back closes it. */
  open: (id: string) => void;
  /** Move to another item (‹ ›): replaces the entry, so Back still goes to the list. */
  show: (id: string) => void;
  /** Close: goes back when this page opened the item (the list's entry), else removes the param. */
  close: () => void;
}

/**
 * The open item of a DetailOverlay in the URL, built on useFilterParams (Next App Router safe: `null` history state,
 * no `useSearchParams`, the URL is read after hydration; it follows Back / Forward). Keep the other list state
 * (filters, query, sort) in the URL too, so a shared link opens the same item over the same results.
 */
export function useDetailParam(key = "open"): DetailParamState {
  const { params, setParams } = useFilterParams([]);
  const openId = params.get(key);
  // did this page push the entry? then close = Back (a deep link has nothing behind it to go back to)
  const pushed = useRef(false);
  useEffect(() => {
    if (!openId) pushed.current = false;
  }, [openId]);
  const open = useCallback(
    (id: string) => {
      pushed.current = true;
      setParams({ [key]: id }, "push");
    },
    [key, setParams],
  );
  const show = useCallback((id: string) => setParams({ [key]: id }, "replace"), [key, setParams]);
  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else setParams({ [key]: null }, "replace");
  }, [key, setParams]);
  return { openId, open, show, close };
}

/** The round icon button of the header (close, copy link, ‹ ›). */
const NAV =
  "w-9 h-9 shrink-0 rounded-full bg-tint text-contrast hover:bg-tint-hover flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-focus";

export function DetailOverlay({
  open,
  onClose,
  title,
  subtitle,
  index,
  total,
  onPrev,
  onNext,
  onCopyLink,
  label,
  children,
  side,
  related,
}: {
  /** Drive it from the URL: `open={openId !== null}` with useDetailParam. */
  open: boolean;
  /** Close button, Escape and a click on the backdrop. With useDetailParam pass its `close`. */
  onClose: () => void;
  title: React.ReactNode;
  /** One line under the title (region, category). */
  subtitle?: React.ReactNode;
  /** Place of the item in the current result set (0-based) and its size: shows "n / N". */
  index?: number;
  total?: number;
  /** Previous / next item of the result set; leave out at the ends (the button is disabled). ← → do the same. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Shows a "copy link" button (the URL already opens this item). */
  onCopyLink?: () => void;
  /** Accessible name of the dialog when `title` is not plain text. */
  label?: string;
  /** The item itself. */
  children: React.ReactNode;
  /** The action panel: a SplitButton, a row of icon buttons, a ⋯ Menu, then facts. Right column from `lg`, below the content before. */
  side?: React.ReactNode;
  /** Related items, under the main content. */
  related?: React.ReactNode;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const shown = open && mounted;
  useDialog(ref, shown, onClose);

  // the list keeps its scroll: remember it on open, put it back if anything moved it while the overlay was up
  useLayoutEffect(() => {
    if (!shown) return;
    const y = window.scrollY;
    return () => {
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y });
      });
    };
  }, [shown]);

  // ← → step through the results (not while typing, not with a modifier)
  const prevRef = useRef(onPrev);
  const nextRef = useRef(onNext);
  prevRef.current = onPrev;
  nextRef.current = onNext;
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='menu'], [role='listbox'], [role='slider']")) return;
      const go = e.key === "ArrowLeft" ? prevRef.current : e.key === "ArrowRight" ? nextRef.current : undefined;
      if (!go || !ref.current?.contains(el)) return;
      e.preventDefault();
      go();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown]);

  // a new item starts at its top
  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 });
    scrollRef.current?.querySelectorAll<HTMLElement>("[data-detail-scroll]").forEach((el) => el.scrollTo?.({ top: 0 }));
  }, [index, title]);

  if (!shown) return null;
  const counted = index !== undefined && total !== undefined && total > 0;
  return createPortal(
    <div className="fixed inset-0 z-modal flex items-stretch justify-center sm:p-4 lg:p-6">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={label ? undefined : titleId}
        aria-label={label}
        className="relative w-full max-w-[1240px] flex flex-col bg-panel-3 sm:rounded-panel shadow-overlay overflow-hidden"
      >
        <div className="flex items-center gap-2 h-14 px-3 sm:px-4 border-b border-divider shrink-0">
          <button type="button" onClick={onClose} aria-label={t.close} title={`${t.close} (Esc)`} className={NAV}>
            <Icon name="close" className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 px-1">
            <h2 id={titleId} className="text-ui font-semibold text-contrast truncate">
              {title}
            </h2>
            {subtitle && <div className="text-caption text-muted truncate">{subtitle}</div>}
          </div>
          {onCopyLink && (
            <button type="button" onClick={onCopyLink} aria-label={t.copyLink} title={t.copyLink} className={cn(NAV, "max-sm:hidden")}>
              <Icon name="copy" className="w-4 h-4" />
            </button>
          )}
          {counted && (
            <span className="text-label text-muted tabular-nums px-1" aria-label={t.itemOf(index + 1, total)}>
              {index + 1} / {total}
            </span>
          )}
          {(onPrev || onNext || counted) && (
            <>
              <button type="button" onClick={onPrev} disabled={!onPrev} aria-label={t.prevItem} title={`${t.prevItem} (←)`} aria-keyshortcuts="ArrowLeft" className={NAV}>
                <Icon name="back" className="w-4 h-4" />
              </button>
              <button type="button" onClick={onNext} disabled={!onNext} aria-label={t.nextItem} title={`${t.nextItem} (→)`} aria-keyshortcuts="ArrowRight" className={NAV}>
                <Icon name="chevron" className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div data-detail-scroll className="lg:overflow-y-auto lg:overscroll-contain p-4 sm:p-6 flex flex-col gap-6 min-w-0">
            {children}
            {related}
          </div>
          {side && (
            <aside data-detail-scroll aria-label={t.actions} className="lg:overflow-y-auto lg:overscroll-contain p-4 sm:p-6 lg:bg-panel-4 flex flex-col gap-5 max-lg:border-t max-lg:border-divider">
              {side}
            </aside>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
