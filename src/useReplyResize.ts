"use client";

// Shared auto-grow and top-edge resize logic for Textarea and HintTextarea reply boxes (#148).
// Auto-grow: grows from `rows` (default 3) up to 50% of its container, then scrolls inside.
// Resizable (md+): top `role="separator"` draggable + ArrowUp/ArrowDown ±24px + double-click resets to auto, up to 80%
// of the container; handles `pointercancel` and cleans up listeners on unmount. Phones (< md): auto-grow only.
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const STEP = 24;

function findContainerHeight(wrapper: HTMLElement | null, explicit?: React.RefObject<HTMLElement | null>): number {
  if (explicit?.current) return explicit.current.clientHeight || window.innerHeight;
  const ownH = wrapper?.offsetHeight ?? 0;
  for (let p = wrapper?.parentElement ?? null; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    if (p.hasAttribute("data-reply-container") || p.getAttribute("role") === "dialog" || p.tagName === "MAIN") {
      if (p.clientHeight > 0) return p.clientHeight;
    }
    const cs = getComputedStyle(p);
    if (cs.overflowY === "auto" || cs.overflowY === "scroll" || (cs.maxHeight !== "none" && p.clientHeight >= 160)) {
      if (p.clientHeight > 0) return p.clientHeight;
    }
    if ((cs.overflowY === "hidden" || cs.overflowY === "clip" || cs.display === "flex") && p.clientHeight >= 200 && p.clientHeight > ownH + 48) {
      return p.clientHeight;
    }
  }
  return typeof window !== "undefined" ? window.innerHeight : 600;
}

export function useReplyResize({
  autoGrow,
  resizable,
  textareaRef,
  wrapperRef,
  containerRef,
  value,
  rows,
  extraHeightRef,
  disabled = false,
}: {
  autoGrow: boolean;
  resizable: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  wrapperRef: React.RefObject<HTMLElement | null>;
  containerRef?: React.RefObject<HTMLElement | null>;
  value: unknown;
  rows: number;
  extraHeightRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
}) {
  const active = autoGrow || resizable;
  const [manualHeight, setManualHeight] = useState<number | null>(null);
  const [bounds, setBounds] = useState({ now: 0, min: 0, max: 0 });
  const dragCleanup = useRef<(() => void) | null>(null);

  const measure = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return null;
    const cs = getComputedStyle(el);
    const lineH = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14) * 1.5;
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const borderY = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    const extraH = extraHeightRef?.current?.offsetHeight ?? 0;
    const minH = Math.round(lineH * rows + padY + borderY);
    const containerH = findContainerHeight(wrapperRef.current ?? el, containerRef);
    const maxAuto = Math.max(minH, Math.round(containerH * 0.5) - extraH);
    const maxManual = Math.max(minH, Math.round(containerH * 0.8) - extraH);
    return { el, minH, maxAuto, maxManual, borderY };
  }, [textareaRef, wrapperRef, containerRef, rows, extraHeightRef]);

  const sync = useCallback(() => {
    if (!active) return;
    const m = measure();
    if (!m) return;
    const { el, minH, maxAuto, maxManual, borderY } = m;
    const phone = typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches;
    let nextH: number;
    if (!phone && resizable && manualHeight !== null) {
      nextH = Math.min(Math.max(minH, manualHeight), maxManual);
      el.style.height = `${nextH}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = "auto";
      const natural = el.scrollHeight + borderY;
      nextH = Math.min(Math.max(minH, natural), maxAuto);
      el.style.height = `${nextH}px`;
      el.style.overflowY = natural > maxAuto ? "auto" : "hidden";
    }
    setBounds((prev) => (prev.now === nextH && prev.min === minH && prev.max === maxManual ? prev : { now: nextH, min: minH, max: maxManual }));
  }, [active, measure, resizable, manualHeight]);

  useLayoutEffect(() => {
    sync();
  }, [sync, value]);

  // Keep uncontrolled Textarea auto-growing as the user types, and re-clamp on viewport resize.
  // Controlled textareas (value !== undefined) sync via useLayoutEffect above; attaching a native
  // input listener that calls setState on a controlled element would flush React with the stale
  // value prop before React's root-level onChange runs.
  useEffect(() => {
    if (!active) return;
    const el = textareaRef.current;
    const onInput = () => sync();
    if (value === undefined) el?.addEventListener("input", onInput);
    window.addEventListener("resize", sync);
    return () => {
      if (value === undefined) el?.removeEventListener("input", onInput);
      window.removeEventListener("resize", sync);
    };
  }, [active, textareaRef, sync, value === undefined]);

  // Always end an active pointer drag on unmount.
  useEffect(() => () => dragCleanup.current?.(), []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizable || disabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = measure();
    if (!m) return;
    e.preventDefault();
    dragCleanup.current?.();
    const startY = e.clientY;
    const startH = Math.round(m.el.getBoundingClientRect().height);
    const { minH, maxManual } = m;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const onMove = (ev: PointerEvent) => {
      const next = Math.min(Math.max(minH, Math.round(startH + (startY - ev.clientY))), maxManual);
      setManualHeight(next);
    };
    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      dragCleanup.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    dragCleanup.current = stop;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!resizable || disabled) return;
    const m = measure();
    if (!m) return;
    const cur = manualHeight ?? Math.round(m.el.getBoundingClientRect().height);
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setManualHeight(Math.min(m.maxManual, Math.max(m.minH, cur + STEP)));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setManualHeight(Math.min(m.maxManual, Math.max(m.minH, cur - STEP)));
    } else if (e.key === "Home") {
      e.preventDefault();
      setManualHeight(m.minH);
    } else if (e.key === "End") {
      e.preventDefault();
      setManualHeight(m.maxManual);
    }
  };

  const onDoubleClick = () => {
    if (!resizable || disabled) return;
    setManualHeight(null);
  };

  return {
    bounds,
    separatorHandlers: { onPointerDown, onKeyDown, onDoubleClick },
  };
}
