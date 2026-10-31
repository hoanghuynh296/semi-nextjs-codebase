"use client";

// Transient feedback after an action ("Đã lưu", "Không kết nối được"). Render <ToastHost /> once in the root layout,
// then call toast({ title, tone }) anywhere. Polite live region (danger is assertive); auto-dismiss pauses on hover.
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
  const start = () => {
    if (ms > 0) timer.current = setTimeout(() => dismissToast(item.id), ms);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const s = STATUS_ICON[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      onPointerEnter={stop}
      onPointerLeave={start}
      className="pointer-events-auto w-full sm:w-[360px] bg-panel border border-line rounded-xl shadow-overlay p-3 flex items-start gap-2.5"
    >
      <span className={cn("mt-px w-6 h-6 rounded-lg border flex items-center justify-center shrink-0", s.surface, s.fg)}>
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
            className={cn("mt-1.5 text-label font-medium text-accent-fg hover:text-contrast transition cursor-pointer rounded", FOCUS_RING)}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label={t.dismiss}
        onClick={() => dismissToast(item.id)}
        className={cn("w-6 h-6 rounded-lg text-muted hover:text-contrast hover:bg-raised flex items-center justify-center transition shrink-0 cursor-pointer", FOCUS_RING)}
      >
        <Icon name="close" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const EMPTY: ToastItem[] = [];

/** Toast stack: top on phones (clear of the tab bar), bottom-right from sm. */
export function ToastHost() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  return (
    <div
      aria-live="polite"
      className="fixed z-toast inset-x-0 top-0 sm:top-auto sm:bottom-0 sm:left-auto p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none"
    >
      {list.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
