"use client";

// AppShell's numbered nav shortcuts (internal, #144): the first nine nav items are numbered in visual order;
// ⌥ / Alt + digit opens one by clicking its link, so the router and an unsaved-changes guard run as for a mouse. Browsers
// keep ⌘ (Apple) / Ctrl + digit for their tabs, so those count only in an installed app (`display-mode: standalone`).
// Holding the working modifier shows the numbers; release, blur and any other key hide them.
import { useEffect, useRef } from "react";

export const isApple = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const isStandalone = () => typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches;

/** The shortcut prefix shown in tooltips and the palette: "⌥" / "Alt+" in a browser, "⌘" / "Ctrl+" in an installed app. */
export function shortcutPrefix() {
  if (isStandalone()) return isApple() ? "⌘" : "Ctrl+";
  return isApple() ? "⌥" : "Alt+";
}

/** Is a working shortcut modifier, and only it, down? Shift never counts. */
export function modifierDown(e: KeyboardEvent) {
  if (e.shiftKey) return false;
  if (e.altKey && !e.ctrlKey && !e.metaKey) return true;
  if (!isStandalone()) return false;
  return isApple() ? e.metaKey && !e.altKey && !e.ctrlKey : e.ctrlKey && !e.altKey && !e.metaKey;
}

/** Targets that type characters keep the key (Option + digit types [ ] | { } on some Mac layouts). */
export function isEditableTarget(t: EventTarget | null) {
  if (!t || typeof (t as Element).closest !== "function") return false;
  const el = t as HTMLElement;
  return el.isContentEditable || !!el.closest('input, textarea, select, [role="combobox"], [contenteditable]:not([contenteditable="false"])');
}

const MODIFIER_KEYS = ["Alt", "Meta", "Control", "AltGraph"];

export function useNavShortcuts({
  enabled,
  count,
  activate,
  onShow,
}: {
  enabled: boolean;
  /** How many items are numbered (at most 9). */
  count: number;
  /** Open item n (1-based); true when something was activated. */
  activate: (n: number) => boolean;
  /** Show or hide the number badges. */
  onShow: (shown: boolean) => void;
}) {
  const latest = useRef({ activate, onShow, count });
  latest.current = { activate, onShow, count };
  useEffect(() => {
    if (!enabled) return;
    let shown = false;
    const show = (next: boolean) => {
      if (next === shown) return;
      shown = next;
      latest.current.onShow(next);
    };
    const hide = () => show(false);
    const onKeyDown = (e: KeyboardEvent) => {
      // IME composition (Vietnamese Telex, Japanese…) owns every key
      if (e.isComposing || e.keyCode === 229) return hide();
      if (MODIFIER_KEYS.includes(e.key)) return show(!e.defaultPrevented && modifierDown(e) && !isEditableTarget(e.target) && latest.current.count > 0);
      const m = /^Digit([1-9])$/.exec(e.code);
      const n = m && modifierDown(e) ? Number(m[1]) : 0;
      hide();
      if (!n || n > latest.current.count || e.defaultPrevented || e.repeat || isEditableTarget(e.target)) return;
      if (latest.current.activate(n)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (MODIFIER_KEYS.includes(e.key)) hide();
    };
    const onVisibility = () => document.hidden && hide();
    // bubble phase: a handler of the app that already took the key (preventDefault) wins
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", hide);
    window.addEventListener("pointerdown", hide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", hide);
      window.removeEventListener("pointerdown", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      hide();
    };
  }, [enabled]);
}
