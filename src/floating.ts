"use client";

// Position a fixed layer (menu, tooltip) next to its trigger so it is never clipped by a scrolling panel or a modal.
// Flips above when there is no room below; stays inside the viewport with an 8px margin.
import { useCallback, useLayoutEffect, useState, type RefObject } from "react";

export interface AnchoredPosition {
  left: number;
  top?: number;
  bottom?: number;
  minWidth: number;
  maxHeight: number;
}

export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  { align = "left", minWidth = 180, gap = 4, preferAbove = false }: { align?: "left" | "right" | "center"; minWidth?: number; gap?: number; preferAbove?: boolean } = {},
) {
  const [pos, setPos] = useState<AnchoredPosition | null>(null);

  const place = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(r.width, minWidth), vw - 16);
    const rawLeft = align === "right" ? r.right - width : align === "center" ? r.left + r.width / 2 - width / 2 : r.left;
    const left = Math.min(Math.max(8, rawLeft), vw - width - 8);
    const below = vh - r.bottom - 8;
    const above = r.top - 8;
    const goAbove = preferAbove ? above >= 120 || above > below : below < 240 && above > below;
    if (goAbove) setPos({ left, bottom: vh - r.top + gap, minWidth: width, maxHeight: Math.min(320, above - gap) });
    else setPos({ left, top: r.bottom + gap, minWidth: width, maxHeight: Math.min(320, below - gap) });
  }, [anchorRef, align, minWidth, gap, preferAbove]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return pos;
}
