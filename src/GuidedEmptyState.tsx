"use client";

// The first-use state of a page that needs a few steps before it is useful (#94 L13, docs/DESIGN_SYSTEM.md §13): the
// EmptyState variant "guided". A step carousel ("Bước 1 / 4") or numbered steps, the one primary action, and rows of
// ready starting points by category, each with "Xem tất cả".
import React, { useRef, useState } from "react";
import Link from "next/link";
import { Icon, IconTile, type IconName, type TileTone } from "./Icon";
import { useSemiLocale } from "./locale";
import { useOverflowing } from "./useOverflowing";
import { EMPTY_PHONE_CAP } from "../styles/surfaces";
import { cn, FOCUS_RING } from "../styles/utils";

export interface GuideStep {
  title: string;
  /** One or two sentences: what to do and what it gives. */
  body: string;
  /** Shown large in the carousel's visual and small beside a numbered step. */
  icon: IconName;
}

export interface GuideTemplate {
  title: string;
  /** One short line ("Mẫu cột có sẵn, 2 phút"). */
  hint: string;
  icon: IconName;
  /** Tile colour; grey by default (colour only for the few that need telling apart). */
  tone?: TileTone;
  /** A link (`next/link`) to the starting point, or `onClick`. */
  href?: string;
  onClick?: () => void;
}

export interface GuideTemplateGroup {
  /** Row heading ("Theo mặt hàng"). */
  category: string;
  items: GuideTemplate[];
  /** "Xem tất cả" at the end of the heading: a link or a handler. */
  seeAllHref?: string;
  onSeeAll?: () => void;
  /** Default "Xem tất cả". */
  seeAllLabel?: string;
}

const NAV = cn(
  "w-8 h-8 pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11 rounded-full bg-tint text-strong hover:bg-tint-hover flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-tint",
  FOCUS_RING,
);
const TILE = cn("flex items-start gap-3 p-card rounded-card bg-card text-left hover:bg-tint-hover transition-colors min-w-0", FOCUS_RING);

export function GuidedEmptyState({
  title,
  steps,
  layout = "carousel",
  action,
  tutorial,
  templates,
  headingLevel = 2,
  className,
}: {
  /** The one sentence: what is missing and what to do ("Chưa có nhà cung cấp nào. Thêm nhà cung cấp đầu tiên để hỏi giá."). */
  title: React.ReactNode;
  /** Two to five steps. */
  steps: GuideStep[];
  /** `carousel` (default): one step at a time with a visual, ‹ › and "Bước n / N". `steps`: every step as a numbered list. */
  layout?: "carousel" | "steps";
  /** The one primary action that fills the page (a filled Button). Hide the page's own primary while this shows. */
  action?: React.ReactNode;
  /** Link to the full guide, top right from `sm`. */
  tutorial?: { label: string; href: string };
  /** Rows of ready starting points under the guide. */
  templates?: GuideTemplateGroup[];
  /** Level of the title (2 inside a page, default); category headings are one below. */
  headingLevel?: 1 | 2 | 3;
  className?: string;
}) {
  const t = useSemiLocale();
  const [i, setI] = useState(0);
  const [ref, over] = useOverflowing<HTMLElement>();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const H = `h${headingLevel}` as const;
  const H2 = `h${Math.min(headingLevel + 1, 6)}` as "h2" | "h3" | "h4";
  const at = Math.min(i, steps.length - 1);
  const s = steps[at];
  const go = (to: number) => {
    setI(to);
    // the arrow that was pressed turns disabled at an end: keep focus on the one that still works
    if (to === 0) nextRef.current?.focus();
    else if (to === steps.length - 1) prevRef.current?.focus();
  };
  const titleText = typeof title === "string" ? title : undefined;
  return (
    <div data-empty="guided" className={cn("flex flex-col gap-section", className)}>
      <section
        ref={ref}
        aria-label={titleText}
        tabIndex={over ? 0 : undefined}
        className={cn("rounded-panel bg-card p-card sm:p-panel flex flex-col gap-group", EMPTY_PHONE_CAP, FOCUS_RING)}
      >
        <div className="flex items-start gap-3">
          <H className="flex-1 min-w-0 text-lead font-title font-medium text-strong">{title}</H>
          {tutorial && (
            <Link href={tutorial.href} className={cn("max-sm:hidden shrink-0 inline-flex items-center gap-1 text-ui font-medium text-strong hover:underline rounded-chip", FOCUS_RING)}>
              {tutorial.label}
              <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        {layout === "carousel" && s ? (
          <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-group items-center">
            <div className="max-sm:hidden aspect-[16/10] rounded-card bg-panel-2 flex items-center justify-center" aria-hidden>
              <IconTile name={s.icon} size="lg" tone="gray" />
            </div>
            <div className="flex flex-col gap-3 min-w-0">
              <div aria-live="polite" className="flex flex-col gap-2">
                <span className="text-overline text-muted tabular-nums">{t.stepOf(at + 1, steps.length)}</span>
                <H2 className="text-lead font-medium text-strong">{s.title}</H2>
                <p className="text-ui text-body">{s.body}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {steps.length > 1 && (
                  <>
                    <button ref={prevRef} type="button" className={NAV} onClick={() => go(at - 1)} disabled={at === 0} aria-label={t.prevStep} title={t.prevStep}>
                      <Icon name="back" className="w-4 h-4" />
                    </button>
                    <button ref={nextRef} type="button" className={NAV} onClick={() => go(at + 1)} disabled={at === steps.length - 1} aria-label={t.nextStep} title={t.nextStep}>
                      <Icon name="chevron" className="w-4 h-4" />
                    </button>
                  </>
                )}
                {action && <div className="ml-auto">{action}</div>}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-stack">
              {steps.map((st, n) => (
                <li key={st.title} className="flex items-start gap-3 min-w-0">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-tint text-ui font-semibold text-strong tabular-nums flex items-center justify-center" aria-hidden>
                    {n + 1}
                  </span>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <H2 className="text-ui font-medium text-strong">
                      <span className="sr-only">{t.stepOf(n + 1, steps.length)}: </span>
                      {st.title}
                    </H2>
                    <p className="text-ui text-muted">{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {action && <div>{action}</div>}
          </>
        )}
      </section>
      {templates?.map((g) => (
        <section key={g.category} aria-label={g.category} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <H2 className="flex-1 min-w-0 text-ui font-medium text-strong">{g.category}</H2>
            {(g.seeAllHref || g.onSeeAll) &&
              (g.seeAllHref ? (
                <Link href={g.seeAllHref} className={cn("text-ui font-medium text-muted hover:text-strong inline-flex items-center gap-1 rounded-chip", FOCUS_RING)}>
                  {g.seeAllLabel ?? t.seeAll}
                  <Icon name="chevron" className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button type="button" onClick={g.onSeeAll} className={cn("text-ui font-medium text-muted hover:text-strong inline-flex items-center gap-1 rounded-chip", FOCUS_RING)}>
                  {g.seeAllLabel ?? t.seeAll}
                  <Icon name="chevron" className="w-3.5 h-3.5" />
                </button>
              ))}
          </div>
          {/* phones: one row that scrolls sideways (snap), so the starting points add one row, not a column of cards */}
          <ul className="max-sm:flex max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:pb-1 sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-stack">
            {g.items.map((it) => {
              const body = (
                <>
                  <IconTile name={it.icon} tone={it.tone ?? "gray"} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-ui font-medium text-strong">{it.title}</span>
                    <span className="block text-chrome text-muted">{it.hint}</span>
                  </span>
                </>
              );
              return (
                <li key={it.title} className="flex min-w-0 max-sm:w-[78%] max-sm:shrink-0 max-sm:snap-start">
                  {it.href ? (
                    <Link href={it.href} className={cn(TILE, "flex-1")}>
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={it.onClick} className={cn(TILE, "flex-1")}>
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
