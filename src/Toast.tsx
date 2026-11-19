"use client";

// Transient feedback after an action ("Đã lưu", "Không kết nối được"). Render <ToastHost /> once in the root layout,
// then call toast({ title, tone }) anywhere. Two sibling live regions announce them (danger assertive, the rest polite;
// never nested); auto-dismiss pauses on hover and on keyboard focus.
import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { Icon, type IconName } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn, FOCUS_RING } from "../styles/utils";

export type StatusTone = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: StatusTone;
  /** ms before it closes; 0 keeps it until dismissed (default 4000, danger 6000). */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastOptions {
  id: number;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(opts: ToastOptions): number {
  const id = nextId++;
  items = [...items, { id, ...opts }].slice(-4);
  emit();
  return id;
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
  const ms = item.duration ?? (tone === "danger" ? 6000 : 4000);
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
        <Icon name={s.icon} className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-ui font-medium text-contrast">{item.title}</div>
        {item.description && <div className="text-label text-muted mt-0.5">{item.description}</div>}
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action!.onClick();
              dismissToast(item.id);
            }}
            className={cn("mt-1.5 text-label font-medium text-accent-fg hover:text-contrast transition cursor-pointer rounded-chip", FOCUS_RING)}
          >
            {item.action.label}
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
export function ToastHost() {
  const t = useSemiLocale();
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  // two sibling live regions, never nested: danger toasts are assertive, the rest polite; cards carry no live role
  const col = "flex flex-col gap-2 items-stretch sm:items-end empty:hidden";
  return (
    <section
      aria-label={t.notifications}
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
