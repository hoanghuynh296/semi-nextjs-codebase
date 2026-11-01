"use client";

// Panels side by side (or stacked) with handles to resize them: an editor beside a preview, a list beside details.
// Sizes are percentages; a handle moves by drag or arrow keys and can remember the layout (storageKey).
import React, { Children, useEffect, useRef, useState } from "react";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export function ResizablePanels({
  direction = "horizontal",
  defaultSizes,
  minSize = 15,
  storageKey,
  className,
  children,
}: {
  direction?: "horizontal" | "vertical";
  /** Starting sizes in %, one per panel (default: equal). */
  defaultSizes?: number[];
  /** Smallest size of a panel in %. */
  minSize?: number;
  /** Remember the sizes in localStorage under this key. */
  storageKey?: string;
  /** Height for direction="vertical" (e.g. "h-96"). */
  className?: string;
  /** One child per panel (2 or more). */
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  const panels = Children.toArray(children);
  const n = panels.length;
  const [sizes, setSizes] = useState<number[]>(() => defaultSizes?.length === n ? defaultSizes : Array(n).fill(100 / n));
  const ref = useRef<HTMLDivElement>(null);
  const horizontal = direction === "horizontal";
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved) && saved.length === n) setSizes(saved);
    } catch {}
  }, [storageKey, n]);
  const commit = (next: number[]) => {
    setSizes(next);
    if (storageKey)
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
  };
  const move = (i: number, delta: number, base = sizes) => {
    const a = base[i];
    const b = base[i + 1];
    const d = Math.max(minSize - a, Math.min(b - minSize, delta));
    const next = [...base];
    next[i] = Number((a + d).toFixed(2));
    next[i + 1] = Number((b - d).toFixed(2));
    commit(next);
  };
  const onPointerDown = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const box = ref.current!.getBoundingClientRect();
    const total = horizontal ? box.width : box.height;
    const start = horizontal ? e.clientX : e.clientY;
    const base = sizes;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => move(i, (((horizontal ? ev.clientX : ev.clientY) - start) / total) * 100, base);
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  };
  return (
    <div ref={ref} className={cn("flex w-full min-h-0 rounded-card border border-line overflow-hidden", horizontal ? "flex-row" : "flex-col", className)}>
      {panels.map((panel, i) => (
        <React.Fragment key={i}>
          <div className="min-w-0 min-h-0 overflow-auto" style={{ flexBasis: `${sizes[i]}%`, flexGrow: 0, flexShrink: 0 }}>
            {panel}
          </div>
          {i < n - 1 && (
            <div
              role="separator"
              tabIndex={0}
              aria-orientation={horizontal ? "vertical" : "horizontal"}
              aria-valuenow={Math.round(sizes[i])}
              aria-valuemin={minSize}
              aria-valuemax={Math.round(sizes[i] + sizes[i + 1] - minSize)}
              aria-label={t.resize}
              onPointerDown={onPointerDown(i)}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 2;
                const delta = { ArrowRight: step, ArrowDown: step, ArrowLeft: -step, ArrowUp: -step }[e.key];
                if (delta === undefined || (horizontal ? e.key.includes("Up") || e.key.includes("Down") : e.key.includes("Left") || e.key.includes("Right"))) return;
                e.preventDefault();
                move(i, delta);
              }}
              className={cn(
                "group relative shrink-0 bg-line outline-none focus-visible:bg-focus hover:bg-line-hover touch-none",
                horizontal ? "w-px cursor-col-resize before:absolute before:inset-y-0 before:-inset-x-1.5" : "h-px cursor-row-resize before:absolute before:inset-x-0 before:-inset-y-1.5",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
