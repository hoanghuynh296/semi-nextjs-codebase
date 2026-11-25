"use client";

// Page-number pager: ‹ 1 … 4 [5] 6 … 12 ›. Current page = primary tint, others neutral (Dashboard style).
import React from "react";
import { useSemiLocale } from "./locale";
import { Icon } from "./Icon";

/** Page numbers to show around `page` (1-based); `null` = an ellipsis. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const from = Math.max(2, Math.min(page - 1, pages - 4));
  const to = Math.min(pages - 1, Math.max(page + 1, 5));
  if (from > 2) out.push(null);
  for (let p = from; p <= to; p++) out.push(p);
  if (to < pages - 1) out.push(null);
  out.push(pages);
  return out;
}

/** Phone window (a touch phone, below sm): first, current, last, so the 44px buttons fit one 320px row. */
function phonePageWindow(page: number, pages: number): (number | null)[] {
  if (pages <= 4) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  if (page > 2) out.push(null);
  if (page !== 1 && page !== pages) out.push(page);
  if (page < pages - 1) out.push(null);
  out.push(pages);
  return out;
}

// 32px drawn; on a touch phone (pointer-coarse + max-sm) each button grows to 44 × 44 (BTN_HIT: a dense row, so real
// size rather than a pseudo-element that would cover a neighbour) and the phone window keeps them on one row.
const BTN = "min-w-[32px] h-8 pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11 px-2 rounded-control text-ui font-medium tabular-nums inline-flex items-center justify-center transition-hover";

export function Pagination({
  page,
  pages,
  onChange,
  className = "",
}: {
  /** Current page, 1-based. */
  page: number;
  pages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const t = useSemiLocale();
  if (pages <= 1) return null;
  const go = (p: number) => p >= 1 && p <= pages && p !== page && onChange(p);
  const numbers = (items: (number | null)[]) =>
    items.map((p, i) =>
      p === null ? (
        <span key={`gap-${i}`} className="min-w-[24px] text-center text-ui text-muted" aria-hidden>
          …
        </span>
      ) : (
        <button
          key={p}
          type="button"
          aria-label={t.pageN(p)}
          aria-current={p === page ? "page" : undefined}
          onClick={() => go(p)}
          className={`${BTN} ${p === page ? "bg-item-selected text-strong font-semibold" : "text-muted hover:text-strong hover:bg-raised"}`}
        >
          {p}
        </button>
      ),
    );
  return (
    <nav aria-label={t.pagination} className={`flex items-center justify-center gap-1 flex-wrap ${className}`}>
      <button
        type="button"
        aria-label={t.prevPage}
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={`${BTN} text-muted hover:text-strong hover:bg-raised disabled:opacity-40 disabled:pointer-events-none`}
      >
        <Icon name="back" className="w-4 h-4" />
      </button>
      {/* the wide window on desktops, tablets and mice; the phone window on a touch phone (one of them is display: none) */}
      <span className="contents pointer-coarse:max-sm:hidden">{numbers(pageWindow(page, pages))}</span>
      <span className="hidden pointer-coarse:max-sm:contents">{numbers(phonePageWindow(page, pages))}</span>
      <button
        type="button"
        aria-label={t.nextPage}
        disabled={page >= pages}
        onClick={() => go(page + 1)}
        className={`${BTN} text-muted hover:text-strong hover:bg-raised disabled:opacity-40 disabled:pointer-events-none`}
      >
        <Icon name="chevron" className="w-4 h-4" />
      </button>
    </nav>
  );
}
