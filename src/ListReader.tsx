"use client";

// 1.0 list + reader layout and general reader header (#149, #118, owner decision 2026-11-23):
// - List card + reader card, each its own scroller (`overflow-y-auto overscroll-contain`), filling the content
//   column's remaining height on `AppShell page="fixed"` / `Page fixed` (zero hand-tuned calc in apps).
// - Open item lives in the URL (`useDetailParam` → `?open=`, Back closes) and feeds `RouteHeader` breadcrumbs via
//   `useRecordCrumb(recordTitle)`.
// - Below `lg`, the reader replaces the list with a Back button (`ReaderHeader` reads `onClose` from context).
// - Reader header (general pattern for mail, tickets, chat): one row, wrapping title on the left, [•••] menu then one
//   main action on the right, top-aligned, identical button height (`h-control`), sticky while the body scrolls; every
//   other action goes into •••.
import React, { createContext, useContext, useEffect, useRef } from "react";
import { Button } from "./Button";
import { EmptyState } from "./Feedback";
import type { IconName } from "./Icon";
import { Menu, type MenuItem } from "./Overlay";
import { useRecordCrumb } from "./RouteHeader";
import { useSemiLocale } from "./locale";
import { CARD } from "../styles/surfaces";
import { cn } from "../styles/utils";

type ReaderContextValue = { onClose?: () => void };
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
 * - Left: below-`lg` Back button (wired automatically from `ListReaderLayout`'s `onClose`) + wrapping `title` (never
 *   truncated) and optional muted `meta` line underneath.
 * - Right: `[•••]` `Menu` (all secondary / overflow actions) then one main `action`, top-aligned (`items-start`),
 *   both buttons at identical `md` (`h-control`) height.
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
  /** Subject or record title on the left; wraps cleanly onto multiple lines. */
  title: React.ReactNode;
  /** Optional quiet meta line directly under the title (sender, timestamp, ticket id). */
  meta?: React.ReactNode;
  /** The one main action on the right (e.g. Trả lời / Reply), or a custom button element at `size="md"`. */
  action?: ReaderMainAction | React.ReactNode;
  /** Every other reader action (Chuyển tiếp, Lưu trữ, Đóng ticket, Xoá…) goes into this `•••` Menu. */
  moreActions?: MenuItem[];
  /** Accessible name of the `•••` menu (default locale `moreActions`). */
  moreLabel?: string;
  /** Back handler below `lg` (defaults to the enclosing `ListReaderLayout`'s `onClose`). */
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
  const H = `h${headingLevel}` as const;
  const isMainAction = (a: unknown): a is ReaderMainAction =>
    Boolean(a) && typeof a === "object" && !React.isValidElement(a) && typeof (a as ReaderMainAction).label === "string";

  return (
    <header
      data-reader-header=""
      className={cn(
        "sticky top-0 z-sticky shrink-0 bg-app border-b border-divider px-4 sm:px-5 py-3 flex items-start gap-3 min-w-0",
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
          className="lg:hidden -ml-1.5"
        />
      )}
      <div className="min-w-0 flex-1 pt-1">
        <H className="text-lead font-medium text-strong break-words">{title}</H>
        {meta && <div className="text-chrome text-muted mt-0.5">{meta}</div>}
      </div>
      {(moreActions?.length || action) && (
        <div className="shrink-0 flex items-center gap-2">
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

const LIST_WIDTH = {
  sm: "lg:grid-cols-[18rem_minmax(0,1fr)]",
  md: "lg:grid-cols-[22rem_minmax(0,1fr)]",
  lg: "lg:grid-cols-[25rem_minmax(0,1fr)]",
} as const;

/**
 * List + reader layout (#149, #118): a list card on the left and a reader card on the right, each its own independent
 * scroll container (`overflow-y-auto overscroll-contain`), filling the remaining height of `AppShell page="fixed"` /
 * `Page fixed` with zero hand-tuned `calc()`. Drive `open` and `onClose` from `useDetailParam()` (`?open=`, Back
 * closes); pass `recordTitle` to add the open record to `RouteHeader` breadcrumbs via `useRecordCrumb`.
 * Below `lg`, opening an item swaps the reader in place of the list (with `ReaderHeader`'s Back button).
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
}: {
  /** List items (e.g. `Item` rows with `selected={openId === id}`). Scrolls inside the list card. */
  list: React.ReactNode;
  /** The open record (`<ReaderHeader … />` + body). Shown when `open` is true. */
  reader: React.ReactNode;
  /** True while an item is open (`openId !== null` from `useDetailParam()`). */
  open: boolean;
  /** Identifier of the open item (resets reader scroll to top when switching items). */
  openKey?: string | null;
  /** Close handler (`useDetailParam().close`, wired to `ReaderHeader`'s below-`lg` Back button). */
  onClose?: () => void;
  /** Open record label pushed into `RouteHeader` breadcrumbs via `useRecordCrumb` while `open` is true. */
  recordTitle?: string | null;
  /** Empty state shown in the reader card on `lg+` when no item is open. */
  empty?: React.ReactNode;
  /** Width of the list card from `lg`: `"sm"` 288px, `"md"` 352px (default), `"lg"` 400px. */
  listWidth?: "sm" | "md" | "lg";
  /** Accessible name of the list region (default locale `listLabel`). */
  listLabel?: string;
  /** Accessible name of the reader region (default locale `readerLabel`). */
  readerLabel?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const readerRef = useRef<HTMLElement>(null);
  useRecordCrumb(open ? recordTitle : null);

  useEffect(() => {
    if (open) readerRef.current?.scrollTo?.({ top: 0 });
  }, [open, openKey]);

  return (
    <ReaderContext.Provider value={{ onClose }}>
      <div
        data-list-reader=""
        className={cn("flex-1 min-h-0 min-w-0 grid grid-cols-1 gap-group", LIST_WIDTH[listWidth], className)}
      >
        <section
          aria-label={listLabel ?? t.listLabel}
          data-reader-list=""
          className={cn(
            CARD,
            "min-h-0 flex flex-col overflow-y-auto overscroll-contain divide-y divide-divider",
            open && "max-lg:hidden",
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
            !open && "max-lg:hidden",
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
    </ReaderContext.Provider>
  );
}
