"use client";

// A scrolling region with a fixed size (a long list in a card, a wide table, a log). Semi hides scrollbars, so the
// region shows a line on each edge that has more content, can show a thin scrollbar, and is reachable by keyboard.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../styles/utils";

export function ScrollArea({
  label,
  orientation = "vertical",
  scrollbar = false,
  className,
  children,
}: {
  /** Accessible name of the region (it is focusable when it scrolls, so keyboard users can scroll it). */
  label: string;
  orientation?: "vertical" | "horizontal" | "both";
  /** Show a thin scrollbar (hidden everywhere else in Semi). */
  scrollbar?: boolean;
  /** Give it a size here: "h-64", "max-h-80", "w-full". */
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false, left: false, right: false, scrolls: false });
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const y = orientation !== "horizontal";
    const x = orientation !== "vertical";
    const top = y && el.scrollTop > 0;
    const bottom = y && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    const left = x && el.scrollLeft > 0;
    const right = x && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    const scrolls = (y && el.scrollHeight > el.clientHeight + 1) || (x && el.scrollWidth > el.clientWidth + 1);
    setEdges((e) => (e.top === top && e.bottom === bottom && e.left === left && e.right === right && e.scrolls === scrolls ? e : { top, bottom, left, right, scrolls }));
  }, [orientation]);
  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [measure]);
  const line = "pointer-events-none absolute bg-line-hover transition-opacity";
  return (
    <div className={cn("relative min-h-0 min-w-0", className)}>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={edges.scrolls ? 0 : undefined}
        onScroll={measure}
        className={cn(
          "h-full w-full overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
          orientation === "vertical" ? "overflow-y-auto overflow-x-hidden" : orientation === "horizontal" ? "overflow-x-auto overflow-y-hidden" : "overflow-auto",
          scrollbar && "[scrollbar-width:thin] [scrollbar-color:var(--color-line-hover)_transparent]",
        )}
      >
        {children}
      </div>
      <span aria-hidden className={cn(line, "inset-x-0 top-0 h-px", edges.top ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn(line, "inset-x-0 bottom-0 h-px", edges.bottom ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn(line, "inset-y-0 left-0 w-px", edges.left ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn(line, "inset-y-0 right-0 w-px", edges.right ? "opacity-100" : "opacity-0")} />
    </div>
  );
}
