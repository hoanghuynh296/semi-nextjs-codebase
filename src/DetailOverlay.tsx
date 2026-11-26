"use client";

// An item of a list opens over the list (L9) instead of on its own page: its own URL (`?open=<id>`), ‹ › (and ← →)
// through the current result set with "n / N", close / Esc / Back returns to the list at the same scroll position
// (the list never unmounts). The side panel holds the actions (SplitButton + an icon row + ⋯). Existing detail routes
// stay as deep-link targets.
import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useDialog } from "./a11y";
import { currentSearch, navigationApi, patchSearch, subscribeUrl } from "./urlState";
import { useSemiLocale } from "./locale";
import { ClampToggle, useClampToggle } from "./clampedTitle";
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

// History entries this page opened (pushed). With the Navigation API an entry keeps its key across Back / Forward and
// replaceState, so close knows the entry is ours after Back then Forward too. Without it (Firefox, Safari < 26) only
// the entry pushed last while the list is mounted is known (by its full address).
const OWN_KEY = "semi:detail-entries";
let lastPushedHref: string | null = null;

function ownEntries(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(OWN_KEY) || "[]");
  } catch {
    return [];
  }
}

function markOwnEntry() {
  lastPushedHref = window.location.href;
  const key = navigationApi()?.currentEntry?.key;
  if (!key) return;
  try {
    sessionStorage.setItem(OWN_KEY, JSON.stringify([...ownEntries().filter((k) => k !== key), key].slice(-50)));
  } catch {
    /* storage blocked: the in-memory mark below still covers the common case */
  }
}

function isOwnEntry() {
  const key = navigationApi()?.currentEntry?.key;
  if (key) return ownEntries().includes(key);
  // no Navigation API: only the entry this list pushed last, at exactly this address (‹ › keep it current)
  return lastPushedHref !== null && lastPushedHref === window.location.href;
}

/**
 * Open an item of the DetailOverlay on this route from anywhere (a CommandPalette item, a notification): a new
 * history entry with `?<key>=<id>`, read at once by useDetailParam. Use it instead of `router.push("?open=…")` to the
 * same route: without the Navigation API (Firefox, Safari < 26) the hook cannot hear Next's own same-route navigation
 * unless the list re-renders. For another route, navigate there with the param in the URL (the hook reads it on mount).
 */
export function openDetail(id: string, key = "open") {
  patchSearch({ [key]: id }, "push");
  markOwnEntry();
}

/**
 * The open item of a DetailOverlay in the URL, on the same URL state as useFilterParams (Next App Router safe: `null`
 * history state, deferred listeners, no `useSearchParams`; it follows Back / Forward). Keep the other list state
 * (filters, query, sort) in the URL too, so a shared link opens the same item over the same results. Opening is a
 * history entry, ‹ › replace it, and close goes back when the entry is one this page opened (also after Back then
 * Forward), else removes the param (a deep link), so the list never gets a duplicate entry.
 */
export function useDetailParam(key = "open"): DetailParamState {
  const search = useSyncExternalStore(subscribeUrl, currentSearch, () => "");
  const openId = useMemo(() => new URLSearchParams(search).get(key), [search, key]);
  const open = useCallback((id: string) => openDetail(id, key), [key]);
  const show = useCallback(
    (id: string) => {
      const own = lastPushedHref === window.location.href;
      patchSearch({ [key]: id }, "replace");
      if (own) lastPushedHref = window.location.href;
    },
    [key],
  );
  // a list that unmounts (another route) forgets the entry it pushed: coming back by a link is not "ours"
  useEffect(
    () => () => {
      lastPushedHref = null;
    },
    [],
  );
  const close = useCallback(() => {
    if (isOwnEntry()) {
      lastPushedHref = null;
      window.history.back();
    } else patchSearch({ [key]: null }, "replace");
  }, [key]);
  return { openId, open, show, close };
}

/** The round icon button of the header (close, copy link, ‹ ›). */
const NAV =
  "w-9 h-9 shrink-0 rounded-full bg-tint text-strong hover:bg-tint-hover flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-focus";

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
  /** The record's title: one line (3 in a narrow dialog); when cut, a chevron toggle beside it shows it whole (#196). */
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
  // a cut title (one line, or 3 in a narrow dialog) gets a toggle that shows it in full (no tooltip on touch, #196);
  // collapsed again for another item or a new opening
  const clamp = useClampToggle<HTMLHeadingElement>(`${shown}:${index ?? ""}:${typeof title === "string" ? title : ""}`);
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

  // at an end the button just pressed turns disabled and would drop focus to the body: hand it to the other one
  const prevBtn = useRef<HTMLButtonElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const hasPrev = Boolean(onPrev);
  const hasNext = Boolean(onNext);
  const lastFocus = useRef<"prev" | "next" | null>(null);
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      lastFocus.current = e.target === prevBtn.current ? "prev" : e.target === nextBtn.current ? "next" : null;
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);
  useEffect(() => {
    // (Chrome blurs a disabled button only at the next frame, so do not wait for activeElement to change)
    if (lastFocus.current === "next" && !hasNext) prevBtn.current?.focus();
    else if (lastFocus.current === "prev" && !hasPrev) nextBtn.current?.focus();
  }, [hasPrev, hasNext]);

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
        {/* One row (56px) while the title keeps 60% of it; in a narrow dialog the counter and ‹ › wrap to a row under
            the title, which then may take up to 3 lines (#188) */}
        <div data-detail-header="" className="@container/detail-header flex flex-wrap items-center gap-2 min-h-14 py-1 px-3 sm:px-4 border-b border-divider shrink-0">
          <button type="button" onClick={onClose} aria-label={t.close} title={`${t.close} (Esc)`} className={NAV}>
            <Icon name="close" className="w-4 h-4" />
          </button>
          <div data-detail-title="" className="flex-1 min-w-[calc(60%+2.25rem)] px-1">
            <div className="flex items-end gap-1 min-w-0">
              <h2
                ref={clamp.ref}
                id={titleId}
                title={typeof title === "string" ? title : undefined}
                className={cn(
                  "flex-1 min-w-0 text-ui font-medium text-strong",
                  clamp.expanded
                    ? "whitespace-normal break-words"
                    : "truncate @max-[36rem]/detail-header:whitespace-normal @max-[36rem]/detail-header:break-words @max-[36rem]/detail-header:line-clamp-3",
                )}
              >
                {title}
              </h2>
              {clamp.cut && <ClampToggle expanded={clamp.expanded} onToggle={clamp.toggle} controls={titleId} />}
            </div>
            {subtitle && <div className="text-ui text-muted truncate">{subtitle}</div>}
          </div>
          <div data-detail-nav="" className="ml-auto shrink-0 flex items-center gap-2">
            {onCopyLink && (
              <button type="button" onClick={onCopyLink} aria-label={t.copyLink} title={t.copyLink} className={cn(NAV, "max-sm:hidden")}>
                <Icon name="copy" className="w-4 h-4" />
              </button>
            )}
            {counted && (
              <span className="text-chrome text-muted tabular-nums px-1">
                <span aria-hidden>
                  {index + 1} / {total}
                </span>
                <span className="sr-only">{t.itemOf(index + 1, total)}</span>
              </span>
            )}
            {(onPrev || onNext || counted) && (
              <>
                <button ref={prevBtn} type="button" onClick={onPrev} disabled={!onPrev} aria-label={t.prevItem} title={`${t.prevItem} (←)`} aria-keyshortcuts="ArrowLeft" className={NAV}>
                  <Icon name="back" className="w-4 h-4" />
                </button>
                <button ref={nextBtn} type="button" onClick={onNext} disabled={!onNext} aria-label={t.nextItem} title={`${t.nextItem} (→)`} aria-keyshortcuts="ArrowRight" className={NAV}>
                  <Icon name="chevron" className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
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
