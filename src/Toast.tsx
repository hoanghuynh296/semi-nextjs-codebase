"use client";

// Transient feedback after an action ("Đã lưu", "Không kết nối được"): the one toast API (docs/DESIGN_SYSTEM.md §14c).
// Render <ToastHost /> once in the root layout, then call toast({ title, tone }), toast.success("Đã lưu"),
// toast.undo("Đã xoá", restore) or toast.promise(save(), { loading, success, error }) anywhere. Two sibling live
// regions announce them (danger assertive, the rest polite; never nested); auto-dismiss pauses on hover and on keyboard focus.
import React, { Suspense, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
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
  /** With `undo`: runs once when the undo window closes without an undo (timeout, dismissed, evicted, the page changed,
   *  and on `pagehide`: tab close or reload). It is **best effort and fire-and-forget**: a closing page cannot wait for
   *  it, so send with `fetch(url, { keepalive: true })` or `navigator.sendBeacon`, never await it. The robust pattern is
   *  to **commit first** (a soft delete on the server when the user acts) and let `undo` restore on the server; then a
   *  missed `onCommit` only leaves a soft-deleted row. `undo` must restore on the server too, not only in local state:
   *  it can run after the component that showed the toast is gone. */
  onCommit?: () => void;
  /** Work in progress: a spinner in place of the tone icon and no auto-dismiss, until `updateToast` settles it
   *  (`toast.promise` does that). */
  pending?: boolean;
}

/** What the `toast.success|error|warning|info|undo` helpers take after the title: a duration in ms or options. */
export type ToastExtras = number | Omit<ToastOptions, "title" | "tone">;

interface ToastItem extends ToastOptions {
  id: number;
  /** Bumped by `updateToast`: the card remounts (timer restarts, the right live region announces it), the id stays. */
  rev: number;
  /** When it was shown (ms): a route change right after it is the action's own navigation and keeps an undo toast. */
  at: number;
}

/** A navigation within this long of an undo toast being shown is that action's own (delete, then `router.push(list)`). */
export const TOAST_NAV_GRACE = 2000;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Removes toasts and, for an undo toast that closes without being undone, commits it (`onCommit`). */
function drop(gone: ToastItem[], undone = false) {
  if (!gone.length) return;
  const ids = new Set(gone.map((t) => t.id));
  items = items.filter((t) => !ids.has(t.id));
  emit();
  if (!undone) for (const t of gone) if (t.undo) t.onCommit?.();
}

const actionable = (t: ToastOptions) => !!(t.undo || t.action || t.onCommit);

function show(opts: ToastOptions): number {
  const id = nextId++;
  // success is shown once: the same plain text (same tone and description) still on screen is replaced, never stacked.
  // A toast with undo or an action is never merged: each one carries its own callback.
  const same = (t: ToastItem) =>
    typeof opts.title === "string" && !opts.pending && !t.pending && !actionable(opts) && !actionable(t) &&
    t.title === opts.title && (t.tone ?? "info") === (opts.tone ?? "info") && t.description === opts.description;
  const merged = items.filter(same);
  const kept = items.filter((t) => !same(t));
  const next = [...kept, { id, rev: 0, at: Date.now(), ...opts }];
  const evicted = next.slice(0, Math.max(0, next.length - 4));
  items = next.slice(-4);
  emit();
  for (const t of [...merged, ...evicted]) if (t.undo) t.onCommit?.();
  listenPageHide();
  return id;
}

const extras = (x?: ToastExtras) => (typeof x === "number" ? { duration: x } : x ?? {});

type Kind = (title: React.ReactNode, opts?: ToastExtras) => number;

export interface ToastPromiseMessages<T> {
  /** After this many ms (default 30000; 0 waits for ever) a promise that has not settled turns its toast into the
   *  neutral "Vẫn đang xử lý…" (locale `stillWorking`, not an error: the work may still succeed) and closes on its
   *  normal timer. A rejection always shows `error`; a result that arrives later updates the toast if it is still showing. */
  timeout?: number;
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
    const settle = (title: React.ReactNode, tone: StatusTone) => {
      clearTimeout(timer);
      updateToast(id, { title, tone, pending: false, duration: undefined });
    };
    const fail = (e: unknown) => settle(typeof m.error === "function" ? (m.error as (e: unknown) => React.ReactNode)(e) : m.error, "danger");
    const limit = m.timeout ?? 30000;
    const timer = limit > 0 ? setTimeout(() => updateToast(id, { title: <StillWorking />, tone: "info", pending: false, duration: undefined }), limit) : undefined;
    promise.then((v) => settle(typeof m.success === "function" ? (m.success as (v: T) => React.ReactNode)(v) : m.success, "success"), fail);
    return promise;
  },
});

/** Change a toast that is still showing (title, tone, …); its timer restarts. Does nothing once it is closed. */
export function updateToast(id: number, patch: Partial<ToastOptions>) {
  if (!items.some((t) => t.id === id)) return;
  items = items.map((t) => (t.id === id ? { ...t, ...patch, id, rev: t.rev + 1 } : t)); // same id: updates and dismissToast(id) keep working
  emit();
}

/** Closes a toast. An undo toast closed this way commits (`onCommit`). */
export function dismissToast(id: number) {
  drop(items.filter((t) => t.id === id));
}

/** A route change closes the undo windows of the page that is gone (their `onCommit` runs), except the one the action
 *  itself started: a toast shown within TOAST_NAV_GRACE before the change stays (delete on a detail page, then
 *  `router.push(list)`). */
function dropUndo() {
  const now = Date.now();
  drop(items.filter((t) => t.undo && now - t.at > TOAST_NAV_GRACE));
}

// Tab close and reload: the undo windows end with the page, so their onCommit runs (best effort, see ToastOptions.onCommit)
let listening = false;
function listenPageHide() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("pagehide", () => drop(items.filter((t) => t.undo)));
}

/** The "still working" text of a promise toast that timed out, in the provider's language. */
function StillWorking() {
  return <>{useSemiLocale().stillWorking}</>;
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

function ToastCard({ item, scale }: { item: ToastItem; scale: number }) {
  const t = useSemiLocale();
  const tone = item.tone ?? "info";
  const base = item.pending ? 0 : item.duration ?? (item.action || item.undo ? 8000 : tone === "danger" ? 6000 : 4000);
  const ms = base * scale;
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
      data-toast-id={item.id}
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
              if (item.undo) drop([item], true); // undone: nothing to commit
              else dismissToast(item.id);
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
  /** Keyboard shortcut that focuses the newest toast's action (default "Alt+T"; `false` turns it off). Modifiers
   *  `Alt` `Ctrl` `Shift` `Meta` plus one letter. It is ignored while typing (inputs, textareas, contenteditable) and
   *  during IME composition. Firefox on Windows and Linux may open its Alt menu bar on Alt+letter; choose
   *  `"Ctrl+Alt+T"` or turn it off there. */
  hotkey?: string | false;
  /** Multiplies every auto-dismiss time (WCAG 2.2.1, "time to read"): 2 doubles them, for a product whose users read
   *  slowly or use a screen magnifier. Default 1; 0 keeps every toast until it is dismissed. */
  durationScale?: number;
  /** Name of the notification region (default: locale `notifications`, "Thông báo"). Change it when a page section has
   *  the same name, e.g. a "Thông báo" settings group, so the two landmarks can be told apart. */
  label?: string;
}

/**
 * Closes the undo windows when the route changes (their onCommit runs); the first render is not a change.
 * Kept apart from ToastHost because usePathname() suspends while a dynamic route is prerendered: here it is wrapped in
 * its own <Suspense>, so an app never needs one around ToastHost and the toast stack always renders (#82).
 */
function RouteWatcher() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else dropUndo();
  }, [path]);
  return null;
}

export function ToastHost({ label, durationScale = 1, hotkey = "Alt+T" }: ToastHostProps = {}) {
  const t = useSemiLocale();
  const region = useRef<HTMLElement>(null);
  // the hotkey moves keyboard focus to the newest toast's action (it then stays open: focus pauses the timer), so a keyboard user can reach Hoàn tác in time
  useEffect(() => {
    if (hotkey === false) return;
    const parts = hotkey.toLowerCase().split("+").map((p) => p.trim());
    const key = parts[parts.length - 1];
    const want = { alt: parts.includes("alt"), ctrl: parts.includes("ctrl"), shift: parts.includes("shift"), meta: parts.includes("meta") };
    const on = (e: KeyboardEvent) => {
      if (e.isComposing || e.altKey !== want.alt || e.ctrlKey !== want.ctrl || e.shiftKey !== want.shift || e.metaKey !== want.meta) return;
      if (e.key.toLowerCase() !== key && e.code !== `Key${key.toUpperCase()}`) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return;
      const cards = [...(region.current?.querySelectorAll<HTMLElement>("[data-toast-id]") ?? [])];
      const newest = cards.sort((x, y) => Number(y.dataset.toastId) - Number(x.dataset.toastId))[0];
      const act = newest?.querySelector<HTMLElement>("[data-toast-action]") ?? newest?.querySelector<HTMLElement>("button");
      if (act) {
        e.preventDefault();
        act.focus();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [hotkey]);
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  // two sibling live regions, never nested: danger toasts are assertive, the rest polite; cards carry no live role
  const col = "flex flex-col gap-2 items-stretch sm:items-end empty:hidden";
  return (
    <>
      <Suspense fallback={null}>
        <RouteWatcher />
      </Suspense>
      <section
        ref={region}
        aria-keyshortcuts={hotkey || undefined}
        aria-label={label ?? t.notifications}
        className="fixed z-toast inset-x-0 top-0 sm:top-auto sm:bottom-0 sm:left-auto p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none"
      >
        <div aria-live="assertive" className={col}>
          {list.filter((it) => it.tone === "danger").map((item) => (
            <ToastCard key={`${item.id}:${item.rev}`} item={item} scale={durationScale} />
          ))}
        </div>
        <div aria-live="polite" className={col}>
          {list.filter((it) => it.tone !== "danger").map((item) => (
            <ToastCard key={`${item.id}:${item.rev}`} item={item} scale={durationScale} />
          ))}
        </div>
      </section>
    </>
  );
}
