"use client";

// Dialog behaviour shared by Modal, ConfirmHost, NumPadPopup and Drawer: focus moves in, Tab stays in, focus returns
// to the opener on close, the page behind does not scroll, Escape closes.
import type React from "react";
import { useEffect, useId, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

const KEYBOARD_MEDIA = "(hover: hover) and (pointer: fine)";
const FIRST_FIELD =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), [role="combobox"]:not([disabled]):not([aria-disabled="true"])';

const hasPhysicalKeyboard = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(KEYBOARD_MEDIA).matches;

/**
 * Focus the first text-like field inside `root` on devices with a physical keyboard (`(hover: hover) and (pointer: fine)`),
 * so touch phones keep their on-screen keyboard closed. Does nothing when focus already sits in a field inside `root`.
 * Useful after a tab change inside a settings page. Returns `true` if a field was focused.
 */
export function focusFirstField(root: ParentNode | null): boolean {
  if (!root || !hasPhysicalKeyboard()) return false;
  const active = document.activeElement;
  if (active instanceof HTMLElement && (root as Node).contains(active) && (active.matches(FIRST_FIELD) || active.isContentEditable)) return false;
  const field = [...root.querySelectorAll<HTMLElement>(FIRST_FIELD)].find(
    (el) => (el.offsetParent !== null || el.getClientRects().length > 0) && getComputedStyle(el).visibility !== "hidden" && !el.closest("[inert], [aria-hidden='true']"),
  );
  if (!field) return false;
  field.focus({ preventScroll: false });
  return true;
}

let modalityBound = false;

/**
 * Tracks whether the latest focus came from a pointer (mouse / touch) vs the keyboard, so text-entry fields — where
 * browsers always match `:focus-visible` even on mouse click — show the 2px focus outline only on keyboard focus.
 * Safe to call multiple times; attaches once per document in the browser, never during SSR.
 */
export function ensureFocusModality() {
  if (modalityBound || typeof document === "undefined") return;
  modalityBound = true;
  let byPointer = false;
  let clearTimer: ReturnType<typeof setTimeout> | undefined;
  const onDown = () => {
    byPointer = true;
    if (clearTimer !== undefined) clearTimeout(clearTimer);
  };
  const onUp = () => {
    if (clearTimer !== undefined) clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      byPointer = false;
    }, 80);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.altKey || e.ctrlKey) return;
    byPointer = false;
    if (clearTimer !== undefined) clearTimeout(clearTimer);
  };
  const mark = (el: HTMLElement, on: boolean) => {
    const frame = el.closest<HTMLElement>("[data-field-frame]");
    if (on) {
      el.setAttribute("data-pointer-focus", "");
      frame?.setAttribute("data-pointer-focus", "");
    } else {
      el.removeAttribute("data-pointer-focus");
      frame?.removeAttribute("data-pointer-focus");
    }
  };
  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("mousedown", onDown, true);
  document.addEventListener("touchstart", onDown, true);
  document.addEventListener("pointerup", onUp, true);
  document.addEventListener("mouseup", onUp, true);
  document.addEventListener("touchend", onUp, true);
  document.addEventListener("pointercancel", onUp, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("focusin", (e) => {
    if (e.target instanceof HTMLElement) mark(e.target, byPointer);
  }, true);
  document.addEventListener("focusout", (e) => {
    if (e.target instanceof HTMLElement) mark(e.target, false);
  }, true);
}

if (typeof document !== "undefined") ensureFocusModality();

let locks = 0;
const traps: object[] = []; // open dialogs, top last: only the top one handles Tab / Escape
let saved = { overflow: "", paddingRight: "" };

/** Lock page scroll while `active` (nested dialogs share one lock). The scrollbar's width is added as padding, so the
 * page behind does not shift sideways when its scrollbar disappears. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (locks++ === 0) {
      const body = document.body;
      saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      const gap = window.innerWidth - document.documentElement.clientWidth;
      if (gap > 0) body.style.paddingRight = `${(parseFloat(getComputedStyle(body).paddingRight) || 0) + gap}px`;
      body.style.overflow = "hidden";
    }
    return () => {
      if (--locks === 0) {
        document.body.style.overflow = saved.overflow;
        document.body.style.paddingRight = saved.paddingRight;
      }
    };
  }, [active]);
}

/**
 * Props for a backdrop that wraps its panel: it closes on a click that both starts and ends on the backdrop, so
 * selecting text or dragging from inside the panel and releasing outside does not close the dialog.
 */
export function useBackdropClose(onClose?: () => void) {
  const down = useRef(false);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      down.current = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent) => {
      if (onClose && down.current && e.target === e.currentTarget) onClose();
      down.current = false;
    },
  };
}

/** Marks a floating layer (Popover, Menu, select list…) that is rendered in a portal on `body`: focus inside it
 * counts as inside the dialog that opened it, so the focus trap leaves it alone. Spread on the portaled element. */
export const FLOATING_LAYER = { "data-semi-floating": "" } as const;
const inFloatingLayer = (el: Element | null) => Boolean(el?.closest("[data-semi-floating]"));

/**
 * Trap keyboard focus inside `ref` while `active`; Escape calls onEscape (only the top dialog closes).
 * Focus goes to the element with [data-autofocus] or [autofocus], else the first focusable, else the container.
 *
 * Inner widgets get Escape first: the trap listens in the bubble phase and does nothing when a widget inside already
 * handled the key (`stopPropagation()` in a React handler, or `preventDefault()`), so Escape in an open select,
 * popover or menu inside a Modal closes that layer, not the Modal. Floating layers portaled to `body`
 * (`FLOATING_LAYER`) keep their own Tab handling; focus that lands anywhere else outside the dialog is sent back.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
  { autoFocusFirstField = false }: { autoFocusFirstField?: boolean } = {},
) {
  const escRef = useRef(onEscape);
  escRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const opener = document.activeElement as HTMLElement | null;
    const items = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    const activeEl = document.activeElement;
    const alreadyInField =
      activeEl instanceof HTMLElement && root.contains(activeEl) && (activeEl.matches(FIRST_FIELD) || activeEl.isContentEditable);
    const explicit = root.querySelector<HTMLElement>("[data-autofocus],[autofocus]");
    let first: HTMLElement;
    if (alreadyInField) {
      first = activeEl;
    } else if (explicit) {
      first = explicit;
      first.focus({ preventScroll: true });
    } else if (autoFocusFirstField && focusFirstField(root) && document.activeElement instanceof HTMLElement && root.contains(document.activeElement)) {
      first = document.activeElement;
    } else {
      const list = items();
      // On touch devices (no physical keyboard), prefer a non-field control (e.g. close button) and fall back to root
      // rather than a field so the phone on-screen keyboard stays closed.
      first = !hasPhysicalKeyboard()
        ? (list.find((el) => !el.matches(FIRST_FIELD) && !el.isContentEditable) ?? root)
        : (list[0] ?? root);
      if (first === root && !root.hasAttribute("tabindex")) root.setAttribute("tabindex", "-1");
      first.focus({ preventScroll: true });
    }
    let last: HTMLElement = first;
    const token = {};
    traps.push(token);
    const isTop = () => traps[traps.length - 1] === token;

    // Escape in the bubble phase: a layer inside that handled it (stopPropagation / preventDefault) wins
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isTop() || e.defaultPrevented || !escRef.current) return;
      e.preventDefault();
      escRef.current();
    };
    // Tab in the capture phase, so a widget that stops its own key events cannot let focus out
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !isTop() || inFloatingLayer(document.activeElement)) return;
      const list = items();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const a = list[0];
      const z = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === a || !root.contains(document.activeElement))) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && (document.activeElement === z || !root.contains(document.activeElement))) {
        e.preventDefault();
        a.focus();
      }
    };
    // focus that leaves the dialog (Tab out of a floating layer, a click on the page behind) comes back to where it was
    const onFocusIn = (e: FocusEvent) => {
      if (!isTop()) return;
      const el = e.target as HTMLElement;
      if (root.contains(el)) {
        last = el;
        return;
      }
      // a floating layer of this dialog, or another modal opening on top (its own trap takes over once it mounts)
      if (inFloatingLayer(el) || el.closest?.('[aria-modal="true"]')) return;
      (document.contains(last) && last !== document.body ? last : (items()[0] ?? root)).focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onEscape);
    document.addEventListener("keydown", onTab, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("keydown", onTab, true);
      document.removeEventListener("focusin", onFocusIn);
      traps.splice(traps.indexOf(token), 1);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [active, ref, autoFocusFirstField]);
}

/** Everything a modal-like surface needs: focus trap, scroll lock, Escape, and an id for aria-labelledby. */
export function useDialog(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose?: () => void,
  options?: { autoFocusFirstField?: boolean },
) {
  useFocusTrap(ref, open, onClose, options);
  useScrollLock(open);
  return { titleId: useId() };
}
