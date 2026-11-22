"use client";

// Warns before unsaved form changes are lost (docs/DESIGN_SYSTEM.md §9b). Works with the Next.js app router, which has no
// "about to navigate" event: it watches the three ways a page is left.
//   reload / tab close / address bar  → the browser's own `beforeunload` prompt (its text cannot be changed)
//   a link click inside the app       → one capture-phase click listener asks with `confirmDialog` (mount <ConfirmHost />),
//                                       then repeats the click, so next/link, basePath and prefetch work as usual
//   back / forward                    → one history entry is added while dirty; leaving it asks the same question
// A navigation the app starts in code (router.push after a button) is the app's: wrap it in `confirmLeave(() => …)`.
// Once the user agreed to leave, the guard drops its history entry first and stops warning, so the navigation that
// follows is the only one: Back is one press, and nothing asks twice. After a save the entry is a "spent" marker:
// navigate on with `confirmLeave(() => router.push(…))` (clean form: no question, the spent entry is popped first).
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

const mark = () => (history.state as Record<string, unknown> | null)?.[GUARD_STATE_KEY];
/** The current history entry is the guard's live marker (the form is dirty). */
const marked = () => mark() === true;
/** The current entry is a spent marker: the form was saved, the entry is a plain copy of the page that a later navigation pops first. */
const spent = () => mark() === "spent";
const stateWith = (value: true | "spent") => ({ ...(history.state as object | null), [GUARD_STATE_KEY]: value });

/** After "Rời đi" a navigation that does not happen (a declined delete, say) must not leave the form unguarded for good. */
const GRACE_MS = 1000;

/** Steps back off the guard's history entry (live or spent, when it is the current one) and resolves once the browser is on the page's own entry. */
function popMarker(): Promise<void> {
  if (!marked() && !spent()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("popstate", done);
      clearTimeout(timer);
      resolve();
    };
    // Fallback if no popstate ever arrives (a browser that ignores history.back() here). It races a slow popstate: if the
    // timer wins, `go()` runs one step early and the late popstate is swallowed by `leaving`; a stray extra entry is the worst case.
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
  /** The guard effect is attached (mounted and dirty). */
  const active = useRef(false);

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
    // The navigation had its time: if we are still here and dirty, `go` did not leave. Guard again, entry included.
    setTimeout(() => {
      if (!active.current || !dirtyRef.current) return;
      leaving.current = false;
      if (!marked()) history.pushState(stateWith(true), "");
    }, GRACE_MS);
  }, []);

  const confirmLeave = useCallback(
    async (then?: () => void) => {
      if (!dirtyRef.current) {
        await popMarker(); // after a save: the spent entry goes first, so Back is one press
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
    active.current = true;
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
    if (spent()) history.replaceState(stateWith(true), "");
    else if (!marked()) history.pushState(stateWith(true), "");
    const onPopState = () => {
      if (leaving.current || marked()) return;
      void ask().then((ok) => {
        if (ok) {
          leaving.current = true;
          history.back();
        } else if (!marked()) {
          history.pushState(stateWith(true), "");
        }
      });
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      active.current = false;
      // Saved (dirty → false) and still on this page: the entry becomes a spent marker. Never history.back() here: the
      // app navigates on right after saving and a pending back would cancel that navigation. The next
      // `confirmLeave(then)` pops a spent entry before `then`. (On unmount `dirty` is still true: history is left alone.)
      if (!dirtyRef.current && marked()) history.replaceState(stateWith("spent"), "");
    };
  }, [dirty, ask, leaveThen]);

  return { confirmLeave };
}
