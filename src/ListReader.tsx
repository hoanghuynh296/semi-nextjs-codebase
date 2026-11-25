"use client";

// 1.0 list + reader layout and general reader header (#149, #118, owner decision 2026-11-23):
// - List card + reader card, each its own scroller (`overflow-y-auto overscroll-contain`), filling the content
//   column's remaining height on `AppShell page="fixed"` / `Page fixed` (zero hand-tuned calc in apps).
// - Open item lives in the URL (`useDetailParam` → `?open=`, Back closes) and feeds `RouteHeader` breadcrumbs via
//   `useRecordCrumb(recordTitle)`.
// - When the layout is narrower than list + 16px + a 360px reader (a container query on the layout, #188), the reader
//   replaces the list with a Back button (`ReaderHeader` reads `onClose` from context).
// - Reader header (general pattern for mail, tickets, chat): one row, wrapping title on the left (at least 70% of the
//   row, clamped to 3 lines), [•••] menu then one main action on the right, top-aligned, identical button height
//   (`h-control`), sticky while the body scrolls; every other action goes into •••. When the actions do not fit beside
//   a 70% title (a narrow pane), they move to a row under the title (#188).
import React, { createContext, useContext, useEffect, useId, useLayoutEffect, useRef } from "react";
import { Button } from "./Button";
import { EmptyState } from "./Feedback";
import type { IconName } from "./Icon";
import { Menu, type MenuItem } from "./Overlay";
import { useRecordCrumb } from "./RouteHeader";
import { ClampToggle, useClampToggle } from "./clampedTitle";
import { useSemiLocale } from "./locale";
import { CARD } from "../styles/surfaces";
import { cn } from "../styles/utils";

// The width (container query on the layout, not the viewport) from which list and reader sit side by side: the list
// width + the 16px gap + a 360px reader (#188). Below it the reader replaces the list (with ReaderHeader's Back).
type ReaderContextValue = { onClose?: () => void; backHidden?: string };
const ReaderContext = createContext<ReaderContextValue>({});

/** The single main action on the right of `ReaderHeader`, beside the `•••` menu. */
export interface ReaderMainAction {
  label: string;
  icon?: IconName;
  onClick: () => void;
  /** Button variant (default `"inverse"`). */
  variant?: "inverse" | "primary" | "subtle" | "surface";
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Sticky one-row header of a reader pane (general pattern for mail, tickets, chat; owner decision 2026-11-23):
 * - Left: Back button while the reader replaces the list (wired automatically from `ListReaderLayout`'s `onClose`;
 *   below `lg` with your own `onBack`) + wrapping `title` (at least 70% of the row; clamped to 3 lines, the full text
 *   in the native tooltip when it is a string) and optional muted `meta` line underneath.
 * - Right: `[•••]` `Menu` (all secondary / overflow actions) then one main `action`, top-aligned (`items-start`),
 *   both buttons at identical `md` (`h-control`) height. In a narrow pane, where they do not fit beside a 70% title,
 *   they move to their own row under the title, on the right (#188).
 * - Stays sticky (`sticky top-0 z-sticky bg-app`) while the reader body scrolls underneath.
 */
export function ReaderHeader({
  title,
  meta,
  action,
  moreActions,
  moreLabel,
  onBack,
  backLabel,
  headingLevel = 2,
  className,
}: {
  /** Subject or record title on the left; wraps, at most 3 lines (a string also shows in full as the native tooltip). */
  title: React.ReactNode;
  /** Optional quiet meta line directly under the title (sender, timestamp, ticket id). */
  meta?: React.ReactNode;
  /** The one main action on the right (e.g. Trả lời / Reply), or a custom button element at `size="md"`. */
  action?: ReaderMainAction | React.ReactNode;
  /** Every other reader action (Chuyển tiếp, Lưu trữ, Đóng ticket, Xoá…) goes into this `•••` Menu. */
  moreActions?: MenuItem[];
  /** Accessible name of the `•••` menu (default locale `moreActions`). */
  moreLabel?: string;
  /** Back handler (defaults to the enclosing `ListReaderLayout`'s `onClose`). Inside a `ListReaderLayout` the button shows while the reader replaces the list; outside one, below `lg`. */
  onBack?: () => void;
  /** Accessible name of the phone Back button (default locale `backToList`). */
  backLabel?: string;
  /** Heading level for the reader title (default 2: the page `h1` sits above). */
  headingLevel?: 1 | 2 | 3;
  className?: string;
}) {
  const t = useSemiLocale();
  const ctx = useContext(ReaderContext);
  const handleBack = onBack ?? ctx.onClose;
  // inside a ListReaderLayout the Back button follows the layout's split (also with an app's own onBack: at 1024 with
  // a rail + SubNav the list is hidden while the viewport is lg); outside one, below lg
  const backHidden = ctx.backHidden ?? "lg:hidden";
  const H = `h${headingLevel}` as const;
  const titleId = useId();
  // a title cut at 3 lines gets a toggle that shows it in full (touch screens never show the native tooltip, #196)
  const clamp = useClampToggle<HTMLHeadingElement>(title);
  const isMainAction = (a: unknown): a is ReaderMainAction =>
    Boolean(a) && typeof a === "object" && !React.isValidElement(a) && typeof (a as ReaderMainAction).label === "string";

  return (
    <header
      data-reader-header=""
      className={cn(
        "sticky top-0 z-sticky shrink-0 bg-app border-b border-divider px-4 sm:px-5 py-3 flex flex-wrap items-start gap-x-3 gap-y-2 min-w-0",
        className,
      )}
    >
      {handleBack && (
        <Button
          variant="ghost"
          size="md"
          iconOnly
          icon="back"
          aria-label={backLabel ?? t.backToList}
          onClick={handleBack}
          className={cn(backHidden, "-ml-1.5")}
        />
      )}
      {/* flex-wrap + a 70% minimum: the title keeps most of the row and the actions wrap under it when they do not fit */}
      <div data-reader-title="" className="min-w-[70%] flex-1 pt-1">
        <div className="flex items-end gap-1 min-w-0">
          {/* tabIndex -1: ListReaderLayout moves focus here when the reader replaces the focused list row */}
          <H
            tabIndex={-1}
            className={cn("flex-1 min-w-0 text-lead font-medium text-strong break-words outline-none", !clamp.expanded && "line-clamp-3")}
            ref={clamp.ref}
            id={titleId}
            data-reader-focus=""
            title={typeof title === "string" ? title : undefined}
          >
            {title}
          </H>
          {clamp.cut && <ClampToggle expanded={clamp.expanded} onToggle={clamp.toggle} controls={titleId} />}
        </div>
        {meta && <div className="text-chrome text-muted mt-0.5">{meta}</div>}
      </div>
      {(moreActions?.length || action) && (
        <div data-reader-actions="" className="shrink-0 ml-auto flex items-center gap-2">
          {moreActions && moreActions.length > 0 && (
            <Menu
              label={moreLabel ?? t.moreActions}
              items={moreActions}
              trigger={
                <Button variant="subtle" size="md" iconOnly icon="more" aria-label={moreLabel ?? t.moreActions} />
              }
            />
          )}
          {action
            ? isMainAction(action)
              ? (
                <Button
                  variant={action.variant ?? "inverse"}
                  size="md"
                  icon={action.icon}
                  disabled={action.disabled}
                  loading={action.loading}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )
              : action
            : null}
        </div>
      )}
    </header>
  );
}

// Side by side from list + 16px gap + 360px reader (container query on the layout's own width, #188); literal classes
// for Tailwind. `hide`: the pane not shown while single; `back`: hides ReaderHeader's Back while side by side.
const SPLIT = {
  sm: {
    grid: "@min-[41.5rem]/reader-layout:grid-cols-[18rem_minmax(0,1fr)]",
    hide: "@max-[41.5rem]/reader-layout:hidden",
    back: "@min-[41.5rem]/reader-layout:hidden",
  },
  md: {
    grid: "@min-[45.5rem]/reader-layout:grid-cols-[22rem_minmax(0,1fr)]",
    hide: "@max-[45.5rem]/reader-layout:hidden",
    back: "@min-[45.5rem]/reader-layout:hidden",
  },
  lg: {
    grid: "@min-[48.5rem]/reader-layout:grid-cols-[25rem_minmax(0,1fr)]",
    hide: "@max-[48.5rem]/reader-layout:hidden",
    back: "@min-[48.5rem]/reader-layout:hidden",
  },
} as const;

/**
 * List + reader layout (#149, #118): a list card on the left and a reader card on the right, each its own independent
 * scroll container (`overflow-y-auto overscroll-contain`), filling the remaining height of `AppShell page="fixed"` /
 * `Page fixed` with zero hand-tuned `calc()`. Drive `open` and `onClose` from `useDetailParam()` (`?open=`, Back
 * closes); pass `recordTitle` to add the open record to `RouteHeader` breadcrumbs via `useRecordCrumb`.
 * When the layout itself is narrower than the list + 16px + a 360px reader (a container query, not the viewport: a rail,
 * a sub-nav or a side panel all count), opening an item swaps the reader in place of the list (with `ReaderHeader`'s
 * Back button), so the reader never drops below 360px (#188).
 */
export function ListReaderLayout({
  list,
  reader,
  open,
  openKey,
  onClose,
  recordTitle,
  empty,
  listWidth = "md",
  listLabel,
  readerLabel,
  className,
  gridClassName,
}: {
  /** List items (e.g. `Item` rows with `selected={openId === id}`). Scrolls inside the list card. */
  list: React.ReactNode;
  /** The open record (`<ReaderHeader … />` + body). Shown when `open` is true. */
  reader: React.ReactNode;
  /** True while an item is open (`openId !== null` from `useDetailParam()`). */
  open: boolean;
  /** Identifier of the open item (resets reader scroll to top when switching items). */
  openKey?: string | null;
  /** Close handler (`useDetailParam().close`, wired to `ReaderHeader`'s Back button while the reader replaces the list). */
  onClose?: () => void;
  /** Open record label pushed into `RouteHeader` breadcrumbs via `useRecordCrumb` while `open` is true. */
  recordTitle?: string | null;
  /** Empty state shown in the reader card, while list and reader sit side by side, when no item is open. */
  empty?: React.ReactNode;
  /** Width of the list card side by side: `"sm"` 288px, `"md"` 352px (default), `"lg"` 400px. Side by side from 664 / 728 / 776px of layout width. */
  listWidth?: "sm" | "md" | "lg";
  /** Accessible name of the list region (default locale `listLabel`). */
  listLabel?: string;
  /** Accessible name of the reader region (default locale `readerLabel`). */
  readerLabel?: string;
  /** Classes of the outer element (`data-list-reader`, the container the split is measured on): size and placement. */
  className?: string;
  /** Classes of the inner grid that holds the two panes (gap, columns). Before 1.1 `className` landed here. */
  gridClassName?: string;
}) {
  const t = useSemiLocale();
  const readerRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  /** The row that opened the reader (or was focused last), to give focus back when the list returns. */
  const lastRow = useRef<HTMLElement | null>(null);
  useRecordCrumb(open ? recordTitle : null);

  useEffect(() => {
    if (open) readerRef.current?.scrollTo?.({ top: 0 });
  }, [open, openKey]);

  // remember the open row while it is marked (Item: aria-current="true")
  useEffect(() => {
    if (!open) return;
    const row = listRef.current?.querySelector<HTMLElement>('[aria-current="true"], [aria-selected="true"]');
    if (row) lastRow.current = row;
  }, [open, openKey]);

  // One pane replacing the other (narrow layout) hides the focused element: move focus to what took its place, so it
  // never drops to <body>. Side by side nothing moves.
  const wasOpen = useRef(open);
  useLayoutEffect(() => {
    if (wasOpen.current === open) return;
    wasOpen.current = open;
    const active = document.activeElement as HTMLElement | null;
    const lost = (pane: HTMLElement | null) =>
      !active || active === document.body || !active.isConnected || Boolean(pane?.contains(active));
    const hidden = (el: HTMLElement | null) => !!el && el.getClientRects().length === 0;
    if (open && hidden(listRef.current) && lost(listRef.current)) {
      const pane = readerRef.current;
      const target = pane?.querySelector<HTMLElement>("[data-reader-focus]") ?? pane;
      if (target === pane && pane && !pane.hasAttribute("tabindex")) pane.tabIndex = -1;
      target?.focus({ preventScroll: true });
    } else if (!open && hidden(readerRef.current) && lost(readerRef.current)) {
      const list = listRef.current;
      const row =
        (lastRow.current?.isConnected && list?.contains(lastRow.current) ? lastRow.current : null) ??
        list?.querySelector<HTMLElement>('[aria-current="true"], [aria-selected="true"], a[href], button:not([disabled]), [tabindex="0"]');
      row?.focus();
    }
  }, [open]);

  const split = SPLIT[listWidth];
  return (
    <ReaderContext.Provider value={{ onClose, backHidden: split.back }}>
      {/* the container: its width (not the viewport) decides side by side or one pane */}
      <div data-list-reader="" className={cn("@container/reader-layout flex-1 min-h-0 min-w-0 flex flex-col", className)}>
        <div className={cn("flex-1 min-h-0 min-w-0 grid grid-cols-1 gap-group", split.grid, gridClassName)}>
          <section
            ref={listRef}
            onFocus={(e) => {
              if (e.target !== e.currentTarget) lastRow.current = e.target as HTMLElement;
            }}
            aria-label={listLabel ?? t.listLabel}
            data-reader-list=""
            className={cn(
              CARD,
              "min-h-0 flex flex-col overflow-y-auto overscroll-contain divide-y divide-divider",
              open && split.hide,
            )}
          >
            {list}
          </section>
          <section
            ref={readerRef}
            aria-label={readerLabel ?? t.readerLabel}
            data-reader-pane=""
            className={cn(
              CARD,
              "min-h-0 flex flex-col overflow-y-auto overscroll-contain [--semi-app:var(--semi-card)]",
              !open && split.hide,
            )}
          >
            {open ? (
              reader
            ) : (
              <div data-reader-empty="" className="flex-1 flex items-center justify-center p-6">
                {empty ?? <EmptyState icon="mail" title={t.readerEmpty} className="!border-0" />}
              </div>
            )}
          </section>
        </div>
      </div>
    </ReaderContext.Provider>
  );
}
