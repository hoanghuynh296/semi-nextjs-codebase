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

/**
 * Trap keyboard focus inside `ref` while `active`; Escape calls onEscape (captured so it closes only the top dialog).
 * Focus goes to the element with [data-autofocus] or [autofocus], else the first focusable, else the container.
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
    const token = {};
    traps.push(token);

    const onKey = (e: KeyboardEvent) => {
      if (traps[traps.length - 1] !== token) return;
      if (e.key === "Escape" && escRef.current) {
        e.stopPropagation();
        escRef.current();
        return;
      }
      if (e.key !== "Tab") return;
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
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
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
