"use client";

// Internal (not exported from index): a clamped / truncated title that can be read in full on touch screens, where the
// native `title` tooltip never shows (#196). The toggle only renders after mount and only while the title is cut (or
// expanded), so the server HTML has none and nothing shifts for a title that fits.
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn, FOCUS_RING, HIT_AREA } from "../styles/utils";

/**
 * Whether the heading is cut (taller or wider than its box) and whether the user expanded it. `resetKey` (the title, the
 * open item) collapses it again for a new item.
 */
export function useClampToggle<T extends HTMLElement>(resetKey: unknown) {
  const ref = useRef<T>(null);
  const [cut, setCut] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [resetKey]);
  useEffect(() => {
    const el = ref.current;
    // expanded: keep the toggle so the title can be clamped again
    if (!el || expanded) return;
    const check = () => setCut(el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, resetKey]);
  return { ref, cut: cut || expanded, expanded, toggle: () => setExpanded((v) => !v) };
}

/** The 24px chevron button beside a cut title: `aria-expanded`, `aria-controls` the heading, 44px hit area on touch. */
export function ClampToggle({
  expanded,
  onToggle,
  controls,
  label,
  className,
}: {
  expanded: boolean;
  onToggle: () => void;
  /** id of the heading it expands. */
  controls: string;
  /** Accessible name (default locale `fullTitle`). */
  label?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  return (
    <button
      type="button"
      data-title-toggle=""
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={label ?? t.fullTitle}
      onClick={onToggle}
      className={cn(
        "relative shrink-0 w-6 h-6 rounded-chip flex items-center justify-center text-muted hover:text-strong hover:bg-item-hover transition-hover cursor-pointer",
        HIT_AREA,
        FOCUS_RING,
        className,
      )}
    >
      <Icon name="chevronDown" className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
    </button>
  );
}
