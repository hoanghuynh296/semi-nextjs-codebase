"use client";

// Scroll edge effect (C-022, docs/DESIGN_SYSTEM.md §14): which edges of a scrolling element have more content, and the
// fades that show it. Measured like ScrollArea: before paint, on scroll, and when the element or its children resize.
import React, { useLayoutEffect, useState, type RefObject } from "react";
import { SCROLL_EDGE } from "../styles/surfaces";
import { cn } from "../styles/utils";

/** What `useScrollEdges` reports: more content above (`top`), below (`bottom`), and whether the element scrolls at all. */
export interface ScrollEdgeState {
  top: boolean;
  bottom: boolean;
  scrolls: boolean;
}

const NONE: ScrollEdgeState = { top: false, bottom: false, scrolls: false };

/**
 * Which edges of a vertically scrolling element have more content past them, for the scroll edge effect
 * (`SCROLL_EDGE`): `top` once it is scrolled down, `bottom` until its end, both false when the content fits.
 * `scrolls` tells when to make the element keyboard focusable (`tabIndex={0}`). The element may mount after the
 * hook (a dialog that opens): it is picked up on the next render.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): ScrollEdgeState {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [edges, setEdges] = useState<ScrollEdgeState>(NONE);
  // After every render: the element behind the ref may have mounted, unmounted or changed.
  useLayoutEffect(() => {
    if (ref.current !== el) setEl(ref.current);
  });
  useLayoutEffect(() => {
    if (!el) {
      setEdges(NONE);
      return;
    }
    const measure = () => {
      const scrolls = el.scrollHeight > el.clientHeight + 1;
      const top = scrolls && el.scrollTop > 1;
      const bottom = scrolls && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      setEdges((e) => (e.top === top && e.bottom === bottom && e.scrolls === scrolls ? e : { top, bottom, scrolls }));
    };
    const ro = new ResizeObserver(measure);
    const observe = () => {
      ro.observe(el);
      for (const child of Array.from(el.children)) ro.observe(child);
    };
    observe();
    measure();
    // Children added or removed (a list that grows) change the height without resizing the old children.
    const mo = new MutationObserver(() => {
      observe();
      measure();
    });
    mo.observe(el, { childList: true });
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      el.removeEventListener("scroll", measure);
      mo.disconnect();
      ro.disconnect();
    };
  }, [el]);
  return edges;
}

/** Internal: the two fades of `SCROLL_EDGE`, placed after the scrolling element inside its `relative` wrapper. */
export function ScrollEdgeFades({ edges }: { edges: ScrollEdgeState }) {
  return (
    <>
      <span aria-hidden data-scroll-edge="top" data-shown={edges.top || undefined} className={cn(SCROLL_EDGE.top, edges.top ? "opacity-100" : "opacity-0")} />
      <span aria-hidden data-scroll-edge="bottom" data-shown={edges.bottom || undefined} className={cn(SCROLL_EDGE.bottom, edges.bottom ? "opacity-100" : "opacity-0")} />
    </>
  );
}
