"use client";

// The first visit of a feature (#94 L14, docs/DESIGN_SYSTEM.md §14): a small dialog with a visual, a title, one line,
// dots, Skip + Next / Get started. Shown once per user per `id`: "seen" lives in a store (localStorage by default; pass
// your own to keep it per account). Storage is read after mount only, so the server HTML never holds the dialog, and
// it waits while another dialog is open rather than stacking on top of it.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { useBackdropClose, useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export interface FeatureIntroSlide {
  title: string;
  /** One line: what the feature does for the user. */
  body: string;
  /** The picture on top (an illustration, a screenshot, an IconTile); 16:9, decorative. */
  visual: React.ReactNode;
}

/** Where FeatureIntro keeps "seen". `get` may be async (an account setting on the server). */
export interface FeatureIntroStore {
  get(id: string): boolean | Promise<boolean>;
  set(id: string): void | Promise<void>;
}

/** The default store: `localStorage["semi_intro_<id>"]`. Blocked storage counts as seen, so nobody is shown it on every visit. */
export const localIntroStore: FeatureIntroStore = {
  get(id) {
    try {
      return window.localStorage.getItem(`semi_intro_${id}`) !== null;
    } catch {
      return true;
    }
  },
  set(id) {
    try {
      window.localStorage.setItem(`semi_intro_${id}`, "1");
    } catch {
      /* storage blocked: nothing to remember */
    }
  },
};

const otherDialogOpen = () => document.querySelector('[aria-modal="true"]') !== null;

// One intro at a time on the page: a second unseen one waits for the first to close (then its own check runs again).
let introOpen = false;
const INTRO_CLOSED = "semi:introclosed";

export function FeatureIntro({
  id,
  slides,
  store = localIntroStore,
  forceOpen = false,
  onDone,
  skipLabel,
  nextLabel,
  doneLabel,
}: {
  /** One id per feature ("purchasing-workspace"): shown once per id. */
  id: string;
  /** One to four slides. */
  slides: FeatureIntroSlide[];
  /** Where "seen" is read and written (default `localIntroStore`). */
  store?: FeatureIntroStore;
  /** Show it even if seen (a Help menu's "Xem lại giới thiệu", docs). Still waits for other dialogs to close. */
  forceOpen?: boolean;
  /** After it closes and is stored as seen: `finished` from the last slide's primary, `skipped` from Skip, Escape or the backdrop. */
  onDone?: (how: "finished" | "skipped") => void;
  /** Default "Bỏ qua". */
  skipLabel?: string;
  /** Default "Tiếp". */
  nextLabel?: string;
  /** Primary on the last slide; default "Bắt đầu". */
  doneLabel?: string;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const storeRef = useRef(store);
  storeRef.current = store;

  // the page-wide "one intro open" slot, if this instance holds it
  const owns = useRef(false);
  const release = () => {
    if (!owns.current) return;
    owns.current = false;
    introOpen = false;
    // a waiting intro tries again (after this one's dialog has left the DOM)
    queueMicrotask(() => window.dispatchEvent(new Event(INTRO_CLOSED)));
  };
  const hasSlides = slides.length > 0;

  // after mount only: read the store, then open once no other dialog (or intro) is up
  useEffect(() => {
    if (!hasSlides) return;
    let live = true;
    let observer: MutationObserver | undefined;
    const tryOpen = () => {
      if (!live || introOpen || otherDialogOpen()) return false;
      introOpen = true;
      owns.current = true;
      observer?.disconnect();
      window.removeEventListener(INTRO_CLOSED, retry);
      setStep(0);
      setOpen(true);
      return true;
    };
    const retry = () => void tryOpen();
    const openWhenFree = () => {
      if (tryOpen()) return;
      observer = new MutationObserver(retry);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-modal"] });
      window.addEventListener(INTRO_CLOSED, retry);
    };
    if (forceOpen) openWhenFree();
    else
      Promise.resolve(storeRef.current.get(id))
        .then((seen) => {
          if (live && !seen) openWhenFree();
        })
        .catch(() => undefined);
    return () => {
      live = false;
      observer?.disconnect();
      window.removeEventListener(INTRO_CLOSED, retry);
      // unmount, a new id, or StrictMode's second run: give the slot back (the re-run takes it again at once)
      if (owns.current) {
        release();
        setOpen(false);
      }
    };
  }, [id, forceOpen, hasSlides]);

  const close = (how: "finished" | "skipped") => {
    setOpen(false);
    release();
    Promise.resolve(storeRef.current.set(id)).catch(() => undefined);
    onDone?.(how);
  };
  const skip = () => close("skipped");
  const { titleId } = useDialog(ref, open, skip);
  const backdrop = useBackdropClose(skip);

  if (!open || slides.length === 0) return null;
  const at = Math.min(step, slides.length - 1);
  const s = slides[at];
  const last = at === slides.length - 1;
  return createPortal(
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center sm:p-4 bg-overlay backdrop-blur-sm" {...backdrop}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-body`}
        data-feature-intro={id}
        className="relative w-full sm:max-w-[480px] max-h-[92dvh] overflow-y-auto overscroll-contain bg-panel-4 rounded-t-panel sm:rounded-panel shadow-overlay"
      >
        <div className="aspect-[16/9] bg-card flex items-center justify-center overflow-hidden" aria-hidden>
          {s.visual}
        </div>
        <div aria-live="polite" className="p-card sm:p-panel flex flex-col gap-2">
          <h2 id={titleId} className="text-lead font-title font-semibold text-strong">
            {s.title}
          </h2>
          <p id={`${titleId}-body`} className="text-ui text-body">
            {s.body}
          </p>
        </div>
        <div className="flex items-center gap-3 px-card sm:px-panel pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
          <div className="flex-1 flex items-center gap-1.5">
            {slides.length > 1 && (
              <>
                <span className="sr-only">{t.stepOf(at + 1, slides.length)}</span>
                {slides.map((_, n) => (
                  <span key={n} aria-hidden className={cn("h-1.5 rounded-full transition-all motion-reduce:transition-none", n === at ? "w-5 bg-strong" : "w-1.5 bg-raised")} />
                ))}
              </>
            )}
          </div>
          <Button variant="secondary" onClick={skip}>
            {skipLabel ?? t.introSkip}
          </Button>
          <Button variant="primary" data-autofocus onClick={() => (last ? close("finished") : setStep(at + 1))}>
            {last ? (doneLabel ?? t.introDone) : (nextLabel ?? t.introNext)}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
