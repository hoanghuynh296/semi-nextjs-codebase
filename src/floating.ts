"use client";

// Position a fixed layer (menu, tooltip) next to its trigger so it is never clipped by a scrolling panel or a modal.
// Flips above when there is no room below; stays inside the viewport with an 8px margin.
import type React from "react";
import { cloneElement, useCallback, useLayoutEffect, useState, type RefObject } from "react";

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

type AnyHandler = (e: { defaultPrevented?: boolean }) => void;
type AnyRef = ((el: HTMLElement | null) => void | (() => void)) | { current: HTMLElement | null } | null | undefined;

/** One callback ref that sets every ref given (the trigger's own `ref` and ours). */
export function composeRefs(...refs: AnyRef[]) {
  return (el: HTMLElement | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(el);
      else if (r) r.current = el;
    }
  };
}

/**
 * Clone a trigger element with our props without losing its own: event handlers run theirs first, then ours unless
 * theirs called `preventDefault()`; refs are composed; `aria-describedby` ids are joined. Used by Popover, HoverCard,
 * Tooltip and Menu, whose `trigger` is the app's own Button.
 */
export function cloneTrigger(child: React.ReactElement, ours: Record<string, unknown>) {
  const theirs = (child.props ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...ours };
  for (const [k, v] of Object.entries(ours)) {
    const t = theirs[k];
    if (k === "ref") merged.ref = composeRefs(t as AnyRef, v as AnyRef);
    else if (/^on[A-Z]/.test(k) && typeof t === "function" && typeof v === "function")
      merged[k] = (e: { defaultPrevented?: boolean }) => {
        (t as AnyHandler)(e);
        if (!e?.defaultPrevented) (v as AnyHandler)(e);
      };
    else if (k === "aria-describedby") merged[k] = [t, v].filter(Boolean).join(" ") || undefined;
  }
  return cloneElement(child as React.ReactElement<Record<string, unknown>>, merged);
}
