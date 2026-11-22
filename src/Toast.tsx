"use client";

// Transient feedback after an action ("Đã lưu", "Không kết nối được"): the one toast API (docs/DESIGN_SYSTEM.md §14c).
// Render <ToastHost /> once in the root layout, then call toast({ title, tone }), toast.success("Đã lưu"),
// toast.undo("Đã xoá", restore) or toast.promise(save(), { loading, success, error }) anywhere. Two sibling live
// regions announce them (danger assertive, the rest polite; never nested); auto-dismiss pauses on hover and on keyboard focus.
import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { Spinner } from "./Button";
import { Icon, type IconName } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn, FOCUS_RING } from "../styles/utils";

export type StatusTone = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: StatusTone;
  /** ms before it closes; 0 keeps it until dismissed (default 4000, danger 6000, with an action or undo 8000). */
  duration?: number;
  action?: { label: string; onClick: () => void };
  /** Reverses what just happened: shows the locale's "Hoàn tác" button (`undo`), runs this, closes the toast. For a
   *  reversible destructive action; an irreversible one asks first with `confirmDelete` / `confirmDialog`. */
  undo?: () => void;
  /** Work in progress: a spinner in place of the tone icon and no auto-dismiss, until `updateToast` settles it
   *  (`toast.promise` does that). */
  pending?: boolean;
}

/** What the `toast.success|error|warning|info|undo` helpers take after the title: a duration in ms or options. */
export type ToastExtras = number | Omit<ToastOptions, "title" | "tone">;

interface ToastItem extends ToastOptions {
  id: number;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function show(opts: ToastOptions): number {
  const id = nextId++;
  // success is shown once: the same text still on screen is replaced (and its timer restarts), never stacked
  const same = (t: ToastItem) => typeof opts.title === "string" && !opts.pending && !t.pending && t.title === opts.title && (t.tone ?? "info") === (opts.tone ?? "info");
  items = [...items.filter((t) => !same(t)), { id, ...opts }].slice(-4);
  emit();
  return id;
}

const extras = (x?: ToastExtras) => (typeof x === "number" ? { duration: x } : x ?? {});

type Kind = (title: React.ReactNode, opts?: ToastExtras) => number;

export interface ToastPromiseMessages<T> {
  loading: React.ReactNode;
  success: React.ReactNode | ((value: T) => React.ReactNode);
  error: React.ReactNode | ((error: unknown) => React.ReactNode);
}

interface ToastApi {
  (opts: ToastOptions): number;
  /** Done: `toast.success("Đã lưu")`. Shown once and never as a modal. */
  success: Kind;
  /** Failed: `toast.error("Không lưu được", { description })` (tone danger, announced assertively). */
  error: Kind;
  warning: Kind;
  info: Kind;
  /** A reversible destructive action that already happened: `toast.undo("Đã xoá 3 dòng", restore)` shows "Hoàn tác" for 8 s. */
  undo: (title: React.ReactNode, onUndo: () => void, opts?: ToastExtras) => number;
  /** Follow a promise: a spinner toast, then success or danger in the same place. Resolves to the promise's value. */
  promise: <T>(promise: Promise<T>, msgs: ToastPromiseMessages<T>) => Promise<T>;
}

export const toast: ToastApi = Object.assign((opts: ToastOptions) => show(opts), {
  success: (title: React.ReactNode, o?: ToastExtras) => show({ title, tone: "success", ...extras(o) }),
  error: (title: React.ReactNode, o?: ToastExtras) => show({ title, tone: "danger", ...extras(o) }),
  warning: (title: React.ReactNode, o?: ToastExtras) => show({ title, tone: "warning", ...extras(o) }),
  info: (title: React.ReactNode, o?: ToastExtras) => show({ title, tone: "info", ...extras(o) }),
  undo: (title: React.ReactNode, undo: () => void, o?: ToastExtras) => show({ title, tone: "success", undo, ...extras(o) }),
  promise: <T,>(promise: Promise<T>, m: ToastPromiseMessages<T>): Promise<T> => {
    const id = show({ title: m.loading, tone: "info", pending: true, duration: 0 });
    const settle = (title: React.ReactNode, tone: StatusTone) => updateToast(id, { title, tone, pending: false, duration: undefined });
    promise.then(
      (v) => settle(typeof m.success === "function" ? (m.success as (v: T) => React.ReactNode)(v) : m.success, "success"),
      (e) => settle(typeof m.error === "function" ? (m.error as (e: unknown) => React.ReactNode)(e) : m.error, "danger"),
    );
    return promise;
  },
});

/** Change a toast that is still showing (title, tone, …); its timer restarts. Does nothing once it is closed. */
export function updateToast(id: number, patch: Partial<ToastOptions>) {
  if (!items.some((t) => t.id === id)) return;
  const nid = nextId++; // a new key remounts the card, so the timer restarts and the right live region announces it
  items = items.map((t) => (t.id === id ? { ...t, ...patch, id: nid } : t));
  emit();
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Icon + text colour per status tone (shared by Toast and Alert). */
export const STATUS_ICON: Record<StatusTone, { icon: IconName; fg: string; surface: string }> = {
  info: { icon: "info", fg: "text-info-fg", surface: "bg-info-bg border-info-border" },
  success: { icon: "check", fg: "text-success-fg", surface: "bg-success-bg border-success-border" },
  warning: { icon: "alert", fg: "text-warning-fg", surface: "bg-warning-bg border-warning-border" },
  danger: { icon: "alert", fg: "text-danger-fg", surface: "bg-danger-bg border-danger-border" },
};

function ToastCard({ item }: { item: ToastItem }) {
  const t = useSemiLocale();
  const tone = item.tone ?? "info";
  const ms = item.pending ? 0 : item.duration ?? (item.action || item.undo ? 8000 : tone === "danger" ? 6000 : 4000);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // paused while pointed at or while keyboard focus is inside (WCAG 2.2.1: time to reach the action and read)
  const hold = useRef({ pointer: false, focus: false });
  const start = () => {
    if (timer.current) clearTimeout(timer.current);
    if (ms > 0 && !hold.current.pointer && !hold.current.focus) timer.current = setTimeout(() => dismissToast(item.id), ms);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const set = (k: "pointer" | "focus", on: boolean) => {
    hold.current[k] = on;
    if (on) stop();
    else start();
  };
  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const s = STATUS_ICON[tone];
  const act = item.undo ? { label: t.undo, onClick: item.undo } : item.action;
  return (
    <div
      onPointerEnter={() => set("pointer", true)}
      onPointerLeave={() => set("pointer", false)}
      onFocus={() => set("focus", true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) set("focus", false);
      }}
      className="pointer-events-auto w-full sm:w-[360px] bg-panel border border-line rounded-card shadow-overlay p-3 flex items-start gap-2.5"
    >
      <span className={cn("mt-px w-6 h-6 rounded-control border flex items-center justify-center shrink-0", s.surface, s.fg)}>
        {item.pending ? <Spinner className="w-3.5 h-3.5" /> : <Icon name={s.icon} className="w-3.5 h-3.5" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-ui font-medium text-contrast">{item.title}</div>
        {item.description && <div className="text-label text-muted mt-0.5">{item.description}</div>}
        {act && (
          <button
            type="button"
            data-toast-action
            onClick={() => {
              act.onClick();
              dismissToast(item.id);
            }}
            className={cn("mt-1.5 text-label font-medium text-accent-fg hover:text-contrast transition cursor-pointer rounded-chip", FOCUS_RING)}
          >
            {act.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label={t.dismiss}
        onClick={() => dismissToast(item.id)}
        className={cn("w-6 h-6 rounded-control text-muted hover:text-contrast hover:bg-raised flex items-center justify-center transition shrink-0 cursor-pointer", FOCUS_RING)}
      >
        <Icon name="close" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const EMPTY: ToastItem[] = [];

/** Toast stack: top on phones (clear of the tab bar), bottom-right from sm. */
export interface ToastHostProps {
  /** Name of the notification region (default: locale `notifications`, "Thông báo"). Change it when a page section has
   *  the same name, e.g. a "Thông báo" settings group, so the two landmarks can be told apart. */
  label?: string;
}

export function ToastHost({ label }: ToastHostProps = {}) {
  const t = useSemiLocale();
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  // two sibling live regions, never nested: danger toasts are assertive, the rest polite; cards carry no live role
  const col = "flex flex-col gap-2 items-stretch sm:items-end empty:hidden";
  return (
    <section
      aria-label={label ?? t.notifications}
      className="fixed z-toast inset-x-0 top-0 sm:top-auto sm:bottom-0 sm:left-auto p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none"
    >
      <div aria-live="assertive" className={col}>
        {list.filter((it) => it.tone === "danger").map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </div>
      <div aria-live="polite" className={col}>
        {list.filter((it) => it.tone !== "danger").map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
