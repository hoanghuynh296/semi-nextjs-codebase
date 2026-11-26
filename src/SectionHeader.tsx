"use client";

// Header of a discovery / gallery section (C-014, #191): a 20 / 500 title, an optional muted line, an actions slot on
// the right (usually a ghost "Xem tất cả" Button) and an optional pager: two subtle icon-only Buttons ‹ › that call
// your handlers or scroll a rail (any horizontal scroll container, a Carousel's track too), disabled at the ends.
// It renders the existing Button only: no colours, sizes or buttons of its own.
import React, { useCallback, useEffect, useId, useState } from "react";
import { Button } from "./Button";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

/** Pager driven by your own handlers (a Carousel of yours, pages of data). */
export interface SectionHeaderPagerHandlers {
  onPrev: () => void;
  onNext: () => void;
  /** At the start: ‹ is disabled. */
  prevDisabled?: boolean;
  /** At the end: › is disabled. */
  nextDisabled?: boolean;
  /** Names of the two buttons (default: locale `prevItem` / `nextItem`, "Mục trước" / "Mục sau"). */
  prevLabel?: string;
  nextLabel?: string;
}

/** Pager that scrolls a rail by one visible width; it disables ‹ / › at the start / end of the scroll. */
export interface SectionHeaderPagerTarget {
  /**
   * The rail: a horizontal scroll container (`overflow-x-auto`), or an element that contains one (a `Carousel`'s
   * wrapper): the first descendant whose overflow-x is auto or scroll is used.
   */
  target: React.RefObject<HTMLElement | null>;
  prevLabel?: string;
  nextLabel?: string;
}

export type SectionHeaderPager = SectionHeaderPagerHandlers | SectionHeaderPagerTarget;

export interface SectionHeaderProps {
  /** Section title (20 / 500, `text-section`). */
  title: React.ReactNode;
  /** Optional short muted line under the title. */
  description?: React.ReactNode;
  /**
   * Right slot, before the pager: usually one `<Button variant="ghost">Xem tất cả</Button>` (or a link styled with
   * `buttonClass("ghost")`). Any node.
   */
  actions?: React.ReactNode;
  /** ‹ › after the actions: handlers (`onPrev` / `onNext` + disabled flags) or a rail to scroll (`target`). */
  pager?: SectionHeaderPager;
  /** @default 2 */
  headingLevel?: 2 | 3;
  /** Id of the heading, for `aria-labelledby` on the section (one is generated otherwise). */
  id?: string;
  className?: string;
}

const isTarget = (p: SectionHeaderPager): p is SectionHeaderPagerTarget => "target" in p;

/** The element itself when it scrolls sideways, else its first descendant that does. */
function findScroller(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  const scrolls = (el: Element) => /^(auto|scroll)$/.test(getComputedStyle(el).overflowX);
  if (scrolls(root)) return root;
  for (const el of root.querySelectorAll("*")) if (scrolls(el)) return el as HTMLElement;
  return null;
}

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** ‹ / › state and step for a rail; reads the DOM after mount only (server HTML: ‹ disabled, › enabled). */
function useRailPager(target: React.RefObject<HTMLElement | null> | undefined) {
  const [ends, setEnds] = useState({ start: true, end: false });
  useEffect(() => {
    const el = findScroller(target?.current ?? null);
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const start = el.scrollLeft <= 1;
      const end = el.scrollLeft >= max - 1;
      setEnds((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    el.addEventListener("scrollend", update);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    for (const child of el.children) ro?.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      el.removeEventListener("scrollend", update);
      ro?.disconnect();
    };
  }, [target]);
  const step = useCallback(
    (dir: 1 | -1) => {
      const el = findScroller(target?.current ?? null);
      if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: reducedMotion() ? "auto" : "smooth" });
    },
    [target],
  );
  return { ends, step };
}

/**
 * Header row of a discovery or gallery section: title (and description) on the left; actions and an optional ‹ ›
 * pager on the right. Nothing renders for a slot you leave out.
 */
export function SectionHeader({ title, description, actions, pager, headingLevel = 2, id, className }: SectionHeaderProps) {
  const t = useSemiLocale();
  const autoId = useId();
  const headingId = id ?? autoId;
  const H = `h${headingLevel}` as const;
  const rail = useRailPager(pager && isTarget(pager) ? pager.target : undefined);

  let prev: { onClick: () => void; disabled: boolean } | null = null;
  let next: { onClick: () => void; disabled: boolean } | null = null;
  if (pager && isTarget(pager)) {
    prev = { onClick: () => rail.step(-1), disabled: rail.ends.start };
    next = { onClick: () => rail.step(1), disabled: rail.ends.end };
  } else if (pager) {
    prev = { onClick: pager.onPrev, disabled: !!pager.prevDisabled };
    next = { onClick: pager.onNext, disabled: !!pager.nextDisabled };
  }

  return (
    <div data-semi="SectionHeader" data-section-header="" className={cn("flex justify-between gap-x-4 gap-y-2 min-w-0", description ? "items-end" : "items-center", className)}>
      <div className="min-w-0 flex flex-col gap-1">
        <H id={headingId} className="text-section text-strong min-w-0">
          {title}
        </H>
        {description && <p className="text-ui text-muted">{description}</p>}
      </div>
      {(actions || pager) && (
        <div className="shrink-0 flex items-center gap-2">
          {actions}
          {prev && next && (
            <div role="group" aria-labelledby={headingId} className="flex items-center gap-1">
              <Button iconOnly variant="subtle" size="sm" shape="round" icon="back" aria-label={pager?.prevLabel ?? t.prevItem} onClick={prev.onClick} disabled={prev.disabled} />
              <Button iconOnly variant="subtle" size="sm" shape="round" icon="chevron" aria-label={pager?.nextLabel ?? t.nextItem} onClick={next.onClick} disabled={next.disabled} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
