"use client";

// Trackpad-proven layout-pin behaviour for StickyContextBar (#150, SPEC §6):
// - Pins when the scroller reaches the bar's natural offset (`--sticky-pin`) or when the search text field gets focus
//   (250ms cubic ease-out, instant under reduced motion, cancelled by wheel or touch; works on short lists too).
// - Once pinned (md+), CSS sizes the page container to `var(--sticky-view) + var(--sticky-pin)` so the scroller's
//   exact range is the pin height and the list (or each ListReader panel) is its own `overscroll-behavior: contain`
//   scroller: no wheel clamping on a scrolling document, no `scrollTop` writes per wheel event while scrolling the list.
// - Unpinning requires a NEW upward wheel gesture (> 200ms idle) starting at the pin with the inner list at its top;
//   momentum tails and fast flings never unpin.
// - No `scrollTop` write ever answers a non-cancelable wheel event or a scroll event (#193): once the browser has
//   committed a wheel sequence to native (compositor) scrolling, it has already painted the new position, so writing
//   it back shows two positions on alternate frames (the bar and list flicker). Holds are decided on the first,
//   cancelable event of a sequence instead: preventing it keeps the rest of the sequence cancelable.
// - Filter, sort, search, selection-mode or data changes never alter pinned/unpinned state.
// - Below `md` (< 768px), the page keeps native scrolling and touch behaviour.
import { useEffect, type RefObject } from "react";

/** Wheel events closer together than this belong to one gesture (including trackpad momentum). */
const GESTURE_GAP_MS = 200;
/** Smooth focus-pin duration (ms); instant under `prefers-reduced-motion: reduce`. */
const PIN_SCROLL_MS = 250;

/** Scroll position of the top edge sticky children stick to: the scroller's border + padding (position: sticky
 * keeps `top` inside the padding box edge, so a padded scroller sticks its bar `padding-top` below the border). */
function stickEdge(scroller: HTMLElement): number {
  return scroller.getBoundingClientRect().top + scroller.clientTop + (parseFloat(getComputedStyle(scroller).paddingTop) || 0);
}

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
function smoothTo(el: HTMLElement, to: number, onDone?: () => void): () => void {
  const from = el.scrollTop;
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced || Math.abs(to - from) < 2) {
    el.scrollTop = to;
    onDone?.();
    return () => {};
  }
  const t0 = performance.now();
  let rafId = 0;
  let fallback = 0;
  let finished = false;
  const unlisten = () => {
    el.removeEventListener("wheel", cancel);
    el.removeEventListener("touchstart", cancel);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(rafId);
    window.clearTimeout(fallback);
    unlisten();
    onDone?.();
  };
  const cancel = () => {
    finish();
  };
  el.addEventListener("wheel", cancel, { once: true, passive: true });
  el.addEventListener("touchstart", cancel, { once: true, passive: true });
  const step = (now: number) => {
    if (finished) return;
    const k = Math.min(1, (now - t0) / PIN_SCROLL_MS);
    el.scrollTop = from + (to - from) * (1 - Math.pow(1 - k, 3));
    if (k < 1) rafId = requestAnimationFrame(step);
    else finish();
  };
  rafId = requestAnimationFrame(step);
  // Fallback if rAF is throttled (background tab).
  fallback = window.setTimeout(() => {
    if (!finished && Math.abs(el.scrollTop - to) > 1 && performance.now() - t0 >= PIN_SCROLL_MS) {
      el.scrollTop = to;
    }
    finish();
  }, PIN_SCROLL_MS + 60);
  return cancel;
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
    /** The current gesture is driven here (its first event was prevented) so it can stop exactly at the pin. */
    let driving = false;
    let animating = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelAnim: () => void = () => {};

    const endGesture = () => {
      floor = 0;
      driving = false;
    };

    const setVar = (name: string, value: string) => {
      if (scroller.style.getPropertyValue(name) !== value) scroller.style.setProperty(name, value);
    };
    /** Programmatic scroll, only ever called for a cancelable wheel event this handler prevented (or focus-pin). */
    const scrollToY = (to: number) => {
      if (Math.abs(scroller.scrollTop - to) >= 0.5) scroller.scrollTop = to;
    };

    const getStickyTop = () => parseFloat(getComputedStyle(bar).top) || 0;

    const measure = () => {
      setVar("--sticky-view", `${scroller.clientHeight}px`);
      const stickyTop = getStickyTop();
      const top = bar.getBoundingClientRect().top - stickEdge(scroller);
      // While stuck at the top of the scroller, keep the last natural offset so pin never collapses to 0.
      if (scroller.scrollTop > 0 && top <= stickyTop + 0.5 && pin !== null) return;
      pin = Math.max(0, Math.round(top + scroller.scrollTop - stickyTop));
      setVar("--sticky-pin", `${pin}px`);
    };

    const mark = () => {
      const stickyTop = getStickyTop();
      const top = bar.getBoundingClientRect().top - stickEdge(scroller);
      const stuck = scroller.scrollTop > 0 && top <= stickyTop + 0.5;
      if (bar.hasAttribute("data-stuck") !== stuck) bar.toggleAttribute("data-stuck", stuck);
    };

    const holdShortPage = () => {
      if (animating || pin === null || pin <= 0) return;
      const content = scroller.firstElementChild as HTMLElement | null;
      if (!content) return;
      // On md+, CSS layout-pin already sizes the container to view + pin; on narrow viewports (< md) or standalone
      // containers without layout-pin CSS, preserve pin + view height only while pinned so fewer results never unpin.
      const naturalRange = scroller.scrollHeight - scroller.clientHeight;
      if (scroller.scrollTop >= pin - 1) {
        const min = `${pin + scroller.clientHeight}px`;
        if (naturalRange < pin - 1 && content.style.minHeight !== min) content.style.minHeight = min;
      } else if (content.style.minHeight) {
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

      const dy = lineHeightDelta(e);
      if (dy === 0) return;

      const inner = findInnerScroller(e.target, scroller);
      const y = scroller.scrollTop;
      const range = scroller.scrollHeight - scroller.clientHeight;
      // Layout-pin (md+): the scroller's whole range is the pin, the lists scroll inside it.
      const layoutPinned = Math.abs(range - pin) <= 1;

      if (newGesture) {
        const atTop = !inner || inner.scrollTop <= 0;
        // Only a NEW upward gesture starting already pinned with the inner list at its top may unpin.
        floor = y >= pin - 0.5 && !(dy < 0 && atTop && Math.abs(y - pin) <= 0.5) ? pin : 0;
        // Without layout-pin the scroller runs past the pin. An upward gesture starting within one screen above it
        // could cross it, momentum included: take it over from its first (cancelable) event so it stops at the pin
        // without ever fighting native scrolling. Further up, scrolling stays native.
        driving =
          e.cancelable && !layoutPinned && dy < 0 && floor > 0 && y > pin + 0.5 && y - pin <= scroller.clientHeight && !inner;
        // Pinned at the bottom of a layout-pin range, a downward wheel outside the lists scrolls nothing: prevent it so
        // the browser keeps the sequence cancelable and a reversal in the same gesture is held at the pin too.
        if (e.cancelable && layoutPinned && dy > 0 && !inner && y >= pin - 0.5) e.preventDefault();
      }

      if (dy < 0 && inner && inner.scrollTop > 0) {
        // Inner panel is not at its top: let it scroll natively, and lock floor so its momentum tail cannot unpin.
        floor = pin;
        return;
      }

      // The browser already scrolls this sequence natively (its first event was not prevented): any scrollTop write
      // now would land after the compositor painted the native position and flicker (#193). Let it run.
      if (!e.cancelable) return;

      if (driving) {
        e.preventDefault();
        scrollToY(Math.min(range, Math.max(floor, y + dy)));
        return;
      }

      if (dy > 0) {
        // Not pinned yet: pin the page first before any inner overscroll-contain panel consumes the wheel.
        if (y < pin - 0.5) {
          e.preventDefault();
          scrollToY(Math.min(pin, y + dy));
        }
        // Once pinned, do nothing — the inner list/reader panel scrolls natively.
        return;
      }

      // Scrolling up (dy < 0).
      if (floor > 0 && y < floor - 0.5) {
        e.preventDefault();
        scrollToY(floor);
        return;
      }

      if (y > pin + 0.5) {
        // Without layout-pin, past the pin: stop cleanly at the pin.
        if (y + dy < pin) {
          e.preventDefault();
          scrollToY(pin);
        }
        return;
      }

      if (Math.abs(y - pin) <= 0.5 && floor > 0) {
        // Held at the pin during momentum / fling.
        e.preventDefault();
        return;
      }

      // Fresh upward gesture at the stop (or already between 0 and pin):
      // Without an inner panel, let the browser's native smooth scrolling handle it.
      // Over an inner panel at top (overscroll-behavior: contain), forward the wheel to unpin the page: the panel
      // cannot chain to the page, and this event is prevented, so nothing scrolls natively meanwhile.
      if (!inner) return;
      e.preventDefault();
      scrollToY(Math.max(0, y + dy));
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
      animating = true;
      cancelAnim = smoothTo(scroller, pin, () => {
        animating = false;
        holdShortPage();
        mark();
      });
    };

    const onFocusOut = (e: FocusEvent) => {
      if (isSearchField(e.target, bar)) {
        bar.removeAttribute("data-searching");
      }
    };

    // Reads layout and updates state only: never writes scrollTop (#193).
    const onScroll = () => {
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
