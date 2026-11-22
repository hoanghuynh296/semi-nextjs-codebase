"use client";

// Warns before unsaved form changes are lost (docs/DESIGN_SYSTEM.md §9b). Works with the Next.js app router, which has no
// "about to navigate" event: it watches the three ways a page is left.
//   reload / tab close / address bar  → the browser's own `beforeunload` prompt (its text cannot be changed)
//   a link click inside the app       → one capture-phase click listener asks with `confirmDialog` (mount <ConfirmHost />),
//                                       then repeats the click, so next/link, basePath and prefetch work as usual
//   back / forward                    → one history entry is added while dirty; leaving it asks the same question
// A navigation the app starts in code (router.push after a button) is the app's: wrap it in `confirmLeave(() => …)`.
import { useCallback, useEffect, useRef } from "react";
import { confirmDialog } from "./confirmDialog";
import { GUARD_STATE_KEY, leavesPage } from "./formGuard";
import { useSemiLocale } from "./locale";

/** Guards mounted and dirty right now (a React strict-mode remount must not pop the history entry). */
let active = 0;

export interface UnsavedGuard {
  /**
   * Runs `then` straight away when the form is clean; otherwise asks first and runs it only on "Rời đi". Resolves true
   * when it may proceed. Use it for Huỷ (`confirmLeave(() => router.back())`) and any `router.push` the form starts.
   */
  confirmLeave: (then?: () => void) => Promise<boolean>;
}

/**
 * `dirty` is true while the form holds changes that are not saved (compare with the loaded values; false right after a
 * successful save, before navigating on). Prompts texts come from the locale table (`unsavedTitle`, `unsavedChanges`,
 * `leave`, `stay`).
 */
export function useUnsavedGuard(dirty: boolean): UnsavedGuard {
  const t = useSemiLocale();
  const tRef = useRef(t);
  tRef.current = t;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const asking = useRef(false);

  const ask = useCallback(async () => {
    if (asking.current) return false;
    asking.current = true;
    try {
      const s = tRef.current;
      return await confirmDialog({ title: s.unsavedTitle, message: s.unsavedChanges, confirmLabel: s.leave, cancelLabel: s.stay, tone: "danger" });
    } finally {
      asking.current = false;
    }
  }, []);

  const confirmLeave = useCallback(
    async (then?: () => void) => {
      if (!dirtyRef.current || (await ask())) {
        then?.();
        return true;
      }
      return false;
    },
    [ask],
  );

  useEffect(() => {
    if (!dirty) return;
    active++;

    // reload, close the tab, type another address
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // a link inside the app: stop it, ask, then click it again once the user agrees
    let repeating = false;
    const onClick = (e: MouseEvent) => {
      if (repeating) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!a || !leavesPage(e, { href: a.href, target: a.target, download: a.hasAttribute("download") }, location.href)) return;
      e.preventDefault();
      e.stopPropagation();
      void ask().then((ok) => {
        if (!ok) return;
        repeating = true;
        try {
          a.click();
        } finally {
          repeating = false;
        }
      });
    };
    document.addEventListener("click", onClick, true);

    // back / forward: one extra entry on top of the page, so the first "back" lands on the page itself and can be asked about
    const marked = () => (history.state as Record<string, unknown> | null)?.[GUARD_STATE_KEY] === true;
    if (!marked()) history.pushState({ ...(history.state as object | null), [GUARD_STATE_KEY]: true }, "");
    let leaving = false;
    const onPopState = () => {
      if (leaving || marked()) return;
      void ask().then((ok) => {
        if (ok) {
          leaving = true;
          history.back();
        } else if (!marked()) {
          history.pushState({ ...(history.state as object | null), [GUARD_STATE_KEY]: true }, "");
        }
      });
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      active--;
      // saved (dirty → false) and still on this page: drop the extra entry so "back" is one press again; if the page
      // already moved on (router.push after the save), the entry is not on top any more and is left alone
      if (!leaving)
        setTimeout(() => {
          if (active === 0 && marked()) history.back();
        }, 0);
    };
  }, [dirty, ask]);

  return { confirmLeave };
}
