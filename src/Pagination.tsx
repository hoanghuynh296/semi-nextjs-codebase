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

const BTN = "min-w-[32px] h-8 px-2 rounded-lg text-label font-medium tabular-nums inline-flex items-center justify-center transition";

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
  return (
    <nav aria-label={t.pagination} className={`flex items-center justify-center gap-1 flex-wrap ${className}`}>
      <button
        type="button"
        aria-label={t.prevPage}
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={`${BTN} text-muted hover:text-contrast hover:bg-raised disabled:opacity-40 disabled:pointer-events-none`}
      >
        <Icon name="back" className="w-4 h-4" />
      </button>
      {pageWindow(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="min-w-[24px] text-center text-label text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Trang ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
            className={`${BTN} ${p === page ? "bg-primary-500/15 text-accent-fg font-semibold" : "text-muted hover:text-contrast hover:bg-raised"}`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        aria-label={t.nextPage}
        disabled={page >= pages}
        onClick={() => go(page + 1)}
        className={`${BTN} text-muted hover:text-contrast hover:bg-raised disabled:opacity-40 disabled:pointer-events-none`}
      >
        <Icon name="chevron" className="w-4 h-4" />
      </button>
    </nav>
  );
}
