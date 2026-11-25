"use client";

// Trackpad-proven layout-pin behaviour for StickyContextBar (#150, SPEC §6):
// - Pins when the scroller reaches the bar's natural offset (`--sticky-pin`) or when the search text field gets focus
//   (250ms cubic ease-out, instant under reduced motion, cancelled by wheel or touch; works on short lists too).
// - Once pinned (md+), CSS sizes the page container to `var(--sticky-view) + var(--sticky-pin)` so the scroller's
//   exact range is the pin height and the list (or each ListReader panel) is its own `overscroll-behavior: contain`
//   scroller: no wheel clamping on a scrolling document, no `scrollTop` writes per wheel event while scrolling the list.
// - Unpinning requires a NEW upward wheel gesture (> 200ms idle) starting at the pin with the inner list at its top;
//   momentum tails and fast flings never unpin.
// - Filter, sort, search, selection-mode or data changes never alter pinned/unpinned state.
// - Below `md` (< 768px), the page keeps native scrolling and touch behaviour.
import { useEffect, type RefObject } from "react";

/** Wheel events closer together than this belong to one gesture (including trackpad momentum). */
const GESTURE_GAP_MS = 200;
/** Smooth focus-pin duration (ms); instant under `prefers-reduced-motion: reduce`. */
const PIN_SCROLL_MS = 250;

function lineHeightDelta(e: WheelEvent): number {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
  return e.deltaY;
}

/** Nearest scrollable ancestor of `bar` (defaults to `main#main` when inside AppShell). */
function findScroller(bar: HTMLElement): HTMLElement | null {
  let el = bar.parentElement;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.id === "main" || el.hasAttribute("data-shell-card")) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === "auto" || oy === "scroll") return el;
    }
    const oy = getComputedStyle(el).overflowY;
    if (oy === "auto" || oy === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * Nearest inner scroll container between the wheel target and `scroller`.
 * Matches overflowing `overflow-y: auto|scroll` containers as well as `overscroll-behavior: contain` scroll boxes
 * (e.g. a short `[data-page-body]` or `[data-reader-list]`) so pinning and unpinning behave identically on short lists.
 */
function findInnerScroller(target: EventTarget | null, scroller: HTMLElement): HTMLElement | null {
  let el = target instanceof Element ? target : null;
  while (el && el !== scroller) {
    if (el instanceof HTMLElement) {
      const style = getComputedStyle(el);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll") {
        if (el.scrollHeight > el.clientHeight + 1 || style.overscrollBehaviorY === "contain") {
          return el;
        }
      }
    }
    el = el.parentElement;
  }
  return null;
}

function isSearchField(target: EventTarget | null, bar: HTMLElement): target is HTMLInputElement {
  return (
    target instanceof HTMLInputElement &&
    (target.type === "search" || target.type === "text") &&
    bar.contains(target)
  );
}

/** Ease-out cubic scroll to `to` in 250ms; instant under reduced motion; wheel or touchstart cancels it. */
function smoothTo(el: HTMLElement, to: number): () => void {
  const from = el.scrollTop;
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced || Math.abs(to - from) < 2) {
    el.scrollTop = to;
    return () => {};
  }
  const t0 = performance.now();
  let rafId = 0;
  let cancelled = false;
  const unlisten = () => {
    el.removeEventListener("wheel", cancel);
    el.removeEventListener("touchstart", cancel);
  };
  const cancel = () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    unlisten();
  };
  el.addEventListener("wheel", cancel, { once: true, passive: true });
  el.addEventListener("touchstart", cancel, { once: true, passive: true });
  const step = (now: number) => {
    if (cancelled) return;
    const k = Math.min(1, (now - t0) / PIN_SCROLL_MS);
    el.scrollTop = from + (to - from) * (1 - Math.pow(1 - k, 3));
    if (k < 1) rafId = requestAnimationFrame(step);
    else unlisten();
  };
  rafId = requestAnimationFrame(step);
  // Fallback if rAF is throttled (background tab).
  const fallback = window.setTimeout(() => {
    if (!cancelled && Math.abs(el.scrollTop - to) > 1 && performance.now() - t0 >= PIN_SCROLL_MS) {
      el.scrollTop = to;
    }
    unlisten();
  }, PIN_SCROLL_MS + 60);
  return () => {
    window.clearTimeout(fallback);
    cancel();
  };
}

/**
 * Attaches layout-pin, wheel gesture, focus-pin and state attributes (`data-stuck`, `data-searching`,
 * `--sticky-pin`, `--sticky-view`, `data-sticky-host`) to a `StickyContextBar` element. Cleans up everything on unmount.
 */
export function useStickyBarPin(barRef: RefObject<HTMLDivElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const bar = barRef.current;
    if (!bar) return;
    const scroller = findScroller(bar);
    if (!scroller) return;

    scroller.setAttribute("data-sticky-host", "");

    let pin: number | null = null;
    let lastWheel = 0;
    /** Minimum scrollTop allowed for the current wheel gesture: `pin` blocks unpinning, `0` allows unpinning. */
    let floor = 0;
    let uncancelable = false;
    let fixed = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelAnim: () => void = () => {};

    const endGesture = () => {
      floor = 0;
      uncancelable = false;
      fixed = false;
    };

    const getStickyTop = () => parseFloat(getComputedStyle(bar).top) || 0;

    const measure = () => {
      scroller.style.setProperty("--sticky-view", `${scroller.clientHeight}px`);
      const stickyTop = getStickyTop();
      const top = bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      // While stuck at the top of the scroller, keep the last natural offset so pin never collapses to 0.
      if (scroller.scrollTop > 0 && top <= stickyTop + 0.5 && pin !== null) return;
      pin = Math.max(0, Math.round(top + scroller.scrollTop - stickyTop));
      scroller.style.setProperty("--sticky-pin", `${pin}px`);
    };

    const mark = () => {
      const stickyTop = getStickyTop();
      const top = bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      const stuck = scroller.scrollTop > 0 && top <= stickyTop + 0.5;
      bar.toggleAttribute("data-stuck", stuck);
    };

    const holdShortPage = () => {
      if (pin === null || pin <= 0) return;
      const content = scroller.firstElementChild as HTMLElement | null;
      if (!content) return;
      // On md+, CSS layout-pin already sizes the container to view + pin; on narrow viewports (< md) or standalone
      // containers without layout-pin CSS, preserve pin + view height only while pinned so fewer results never unpin.
      const naturalRange = scroller.scrollHeight - scroller.clientHeight;
      if (scroller.scrollTop >= pin - 1) {
        if (naturalRange < pin - 1) content.style.minHeight = `${pin + scroller.clientHeight}px`;
      } else {
        content.style.removeProperty("min-height");
      }
    };

    const canPin = () => pin !== null && pin > 0 && scroller.scrollHeight - scroller.clientHeight >= pin - 1;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || !canPin() || pin === null) return;
      const now = performance.now();
      const newGesture = now - lastWheel > GESTURE_GAP_MS;
      lastWheel = now;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(endGesture, GESTURE_GAP_MS);
      uncancelable = !e.cancelable;
      fixed = false;

      const dy = lineHeightDelta(e);
      if (dy === 0) return;

      const inner = findInnerScroller(e.target, scroller);
      const y = scroller.scrollTop;

      if (newGesture) {
        const atTop = !inner || inner.scrollTop <= 0;
        // Only a NEW upward gesture starting already pinned with the inner list at its top may unpin.
        floor = y >= pin - 0.5 && !(dy < 0 && atTop && Math.abs(y - pin) <= 0.5) ? pin : 0;
      }

      if (dy > 0) {
        // Not pinned yet: pin the page first before any inner overscroll-contain panel consumes the wheel.
        if (y < pin - 0.5) {
          e.preventDefault();
          scroller.scrollTop = Math.min(pin, y + dy);
        }
        // Once pinned, do nothing — the inner list/reader panel scrolls natively.
        return;
      }

      // Scrolling up (dy < 0).
      if (inner && inner.scrollTop > 0) {
        // Inner panel is not at its top: let it scroll natively, and lock floor so its momentum tail cannot unpin.
        floor = pin;
        return;
      }

      if (floor > 0 && y < floor - 0.5) {
        if (e.cancelable) e.preventDefault();
        scroller.scrollTop = floor;
        return;
      }

      if (y > pin + 0.5) {
        // Fallback when document scrolled past pin (e.g. without layout-pin): stop cleanly at pin.
        if (y + dy < pin) {
          e.preventDefault();
          scroller.scrollTop = pin;
        }
        return;
      }

      if (Math.abs(y - pin) <= 0.5 && floor > 0) {
        // Held at the pin during momentum / fling.
        if (e.cancelable) e.preventDefault();
        return;
      }

      // Fresh upward gesture at the stop (or already between 0 and pin):
      // Without an inner panel, let the browser's native smooth scrolling handle it.
      // Over an inner panel at top (overscroll-behavior: contain), forward the wheel to unpin the page.
      if (!inner) return;
      e.preventDefault();
      scroller.scrollTop = Math.max(0, y + dy);
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!isSearchField(e.target, bar)) return;
      bar.setAttribute("data-searching", "");
      measure();
      if (pin === null || pin <= 0 || scroller.scrollTop >= pin - 0.5) return;
      const content = scroller.firstElementChild as HTMLElement | null;
      if (content && scroller.scrollHeight - scroller.clientHeight < pin - 1) {
        content.style.minHeight = `${pin + scroller.clientHeight}px`;
      }
      cancelAnim();
      cancelAnim = smoothTo(scroller, pin);
    };

    const onFocusOut = (e: FocusEvent) => {
      if (isSearchField(e.target, bar)) {
        bar.removeAttribute("data-searching");
      }
    };

    const onScroll = () => {
      if (uncancelable && !fixed && floor > 0 && performance.now() - lastWheel < GESTURE_GAP_MS && scroller.scrollTop < floor) {
        fixed = true;
        scroller.scrollTop = floor;
      }
      if (scroller.scrollTop === 0) measure();
      holdShortPage();
      mark();
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    bar.addEventListener("focusin", onFocusIn);
    bar.addEventListener("focusout", onFocusOut);
    scroller.addEventListener("scroll", onScroll, { passive: true });

    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      measure();
      mark();
    });
    ro?.observe(scroller);
    if (scroller.firstElementChild) ro?.observe(scroller.firstElementChild);

    measure();
    mark();

    return () => {
      ro?.disconnect();
      if (idleTimer) clearTimeout(idleTimer);
      cancelAnim();
      scroller.removeEventListener("wheel", onWheel);
      bar.removeEventListener("focusin", onFocusIn);
      bar.removeEventListener("focusout", onFocusOut);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeAttribute("data-sticky-host");
      scroller.style.removeProperty("--sticky-pin");
      scroller.style.removeProperty("--sticky-view");
      bar.removeAttribute("data-stuck");
      bar.removeAttribute("data-searching");
      (scroller.firstElementChild as HTMLElement | null)?.style.removeProperty("min-height");
    };
  }, [barRef, enabled]);
}
