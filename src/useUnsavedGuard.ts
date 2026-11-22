"use client";

// Warns before unsaved form changes are lost (docs/DESIGN_SYSTEM.md §9b). Works with the Next.js app router, which has no
// "about to navigate" event: it watches the three ways a page is left.
//   reload / tab close / address bar  → the browser's own `beforeunload` prompt (its text cannot be changed)
//   a link click inside the app       → one capture-phase click listener asks with `confirmDialog` (mount <ConfirmHost />),
//                                       then repeats the click, so next/link, basePath and prefetch work as usual
//   back / forward                    → one history entry is added while dirty; leaving it asks the same question
// A navigation the app starts in code (router.push after a button) is the app's: wrap it in `confirmLeave(() => …)`.
// Once the user agreed to leave, the guard drops its history entry first and stops warning, so the navigation that
// follows is the only one: Back is one press, and nothing asks twice.
import { useCallback, useEffect, useRef } from "react";
import { confirmDialog } from "./confirmDialog";
import { GUARD_STATE_KEY, leavesPage } from "./formGuard";
import { useSemiLocale } from "./locale";

export interface UnsavedGuard {
  /**
   * Runs `then` straight away when the form is clean; otherwise asks first and runs it only on "Rời đi" (after the
   * guard stepped out of the way, so `then` can be `router.back()` or `router.push(…)`). Resolves true when it may proceed.
   * Use it for Huỷ and any navigation the form starts in code.
   */
  confirmLeave: (then?: () => void) => Promise<boolean>;
}

const marked = () => (history.state as Record<string, unknown> | null)?.[GUARD_STATE_KEY] === true;
const withMarker = () => ({ ...(history.state as object | null), [GUARD_STATE_KEY]: true });
const withoutMarker = () => {
  const { [GUARD_STATE_KEY]: _gone, ...rest } = (history.state ?? {}) as Record<string, unknown>;
  return rest;
};

/** Steps back off the guard's history entry (when it is the current one) and resolves once the browser is on the page's own entry. */
function popMarker(): Promise<void> {
  if (!marked()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("popstate", done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 400);
    window.addEventListener("popstate", done);
    history.back();
  });
}

/**
 * `dirty` is true while the form holds changes that are not saved (compare with the loaded values; false right after a
 * successful save, before navigating on). Prompt texts come from the locale table (`unsavedTitle`, `unsavedChanges`,
 * `leave`, `stay`).
 */
export function useUnsavedGuard(dirty: boolean): UnsavedGuard {
  const t = useSemiLocale();
  const tRef = useRef(t);
  tRef.current = t;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const asking = useRef(false);
  /** The user agreed to leave: no more prompts (beforeunload, back) until the form is dirty again. */
  const leaving = useRef(false);

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

  /** Agreed to leave: stop guarding, drop the history entry, then run the navigation. */
  const leaveThen = useCallback(async (go?: () => void) => {
    leaving.current = true;
    await popMarker();
    go?.();
  }, []);

  const confirmLeave = useCallback(
    async (then?: () => void) => {
      if (!dirtyRef.current) {
        then?.();
        return true;
      }
      if (!(await ask())) return false;
      await leaveThen(then);
      return true;
    },
    [ask, leaveThen],
  );

  useEffect(() => {
    if (!dirty) return;
    leaving.current = false;

    // reload, close the tab, type another address
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leaving.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // a link inside the app: stop it, ask, then click it again once the user agrees
    let repeating = false;
    const onClick = (e: MouseEvent) => {
      if (repeating || leaving.current) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!a || !leavesPage(e, { href: a.href, target: a.target, download: a.hasAttribute("download") }, location.href)) return;
      e.preventDefault();
      e.stopPropagation();
      void ask().then((ok) => {
        if (!ok) return;
        void leaveThen(() => {
          repeating = true;
          try {
            a.click();
          } finally {
            repeating = false;
          }
        });
      });
    };
    document.addEventListener("click", onClick, true);

    // back / forward: one extra entry on top of the page, so the first "back" lands on the page itself and can be asked about
    if (!marked()) history.pushState(withMarker(), "");
    const onPopState = () => {
      if (leaving.current || marked()) return;
      void ask().then((ok) => {
        if (ok) {
          leaving.current = true;
          history.back();
        } else if (!marked()) {
          history.pushState(withMarker(), "");
        }
      });
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      // Saved (dirty → false) and still on this page: turn the entry into a plain copy of the page. Never history.back()
      // here: the app navigates on right after saving and a pending back would cancel that navigation. (On unmount,
      // `dirty` is still true: leave history alone.)
      if (!dirtyRef.current && marked()) history.replaceState(withoutMarker(), "");
    };
  }, [dirty, ask, leaveThen]);

  return { confirmLeave };
}
