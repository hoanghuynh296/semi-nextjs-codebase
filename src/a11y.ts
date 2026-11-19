"use client";

// Dialog behaviour shared by Modal, ConfirmHost, NumPadPopup and Drawer: focus moves in, Tab stays in, focus returns
// to the opener on close, the page behind does not scroll, Escape closes.
import { useEffect, useId, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

let locks = 0;
const traps: object[] = []; // open dialogs, top last: only the top one handles Tab / Escape
let saved = "";

/** Lock page scroll while `active` (nested dialogs share one lock). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (locks++ === 0) {
      saved = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (--locks === 0) document.body.style.overflow = saved;
    };
  }, [active]);
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
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  const escRef = useRef(onEscape);
  escRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const opener = document.activeElement as HTMLElement | null;
    const items = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    const first = root.querySelector<HTMLElement>("[data-autofocus],[autofocus]") ?? items()[0] ?? root;
    if (first === root && !root.hasAttribute("tabindex")) root.setAttribute("tabindex", "-1");
    first.focus({ preventScroll: true });
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
  }, [active, ref]);
}

/** Everything a modal-like surface needs: focus trap, scroll lock, Escape, and an id for aria-labelledby. */
export function useDialog(ref: RefObject<HTMLElement | null>, open: boolean, onClose?: () => void) {
  useFocusTrap(ref, open, onClose);
  useScrollLock(open);
  return { titleId: useId() };
}
