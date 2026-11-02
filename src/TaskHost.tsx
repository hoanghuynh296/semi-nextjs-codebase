"use client";

// One blocking overlay for a job the user must wait for (upload, import, firmware update, payment step), callable from
// anywhere: mount <TaskHost /> once in the root layout next to <ToastHost /> / <ConfirmHost />, then
// `const task = startTask({ label })`, `task.update({ value })`, `task.done()` or `task.fail("…")`. One task at a time.
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDialog } from "./a11y";
import { Progress } from "./Feedback";
import { toast } from "./Toast";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";
import { MODAL_BACKDROP, MODAL_PANEL } from "../styles/surfaces";
import { MODAL_BTN_SECONDARY } from "../styles/buttons";

export interface TaskOptions {
  /** What is running, e.g. "Tải file lên máy chủ". Names the dialog and is announced. */
  label: string;
  /** Current step under the label, e.g. "Đang kiểm tra file (2/3)". */
  step?: string;
  /** Progress 0–100; omit for an indeterminate bar. */
  value?: number;
  /** Shows the elapsed time (m:ss). */
  timer?: boolean;
  /** Makes the task cancellable: a Cancel button and Escape close the overlay, then call this. Without it the task can only end with done() / fail(). */
  onCancel?: () => void;
  /** Label of the cancel button (default from the locale, "Huỷ"). */
  cancelLabel?: string;
}

export interface TaskHandle {
  /** Change the label, step or progress of this task. */
  update: (patch: Partial<Pick<TaskOptions, "label" | "step" | "value">>) => void;
  /** The task finished: close the overlay. */
  done: () => void;
  /** The task failed: close the overlay and show a danger toast with this title (and description). */
  fail: (title: string, description?: string) => void;
}

type Current = (TaskOptions & { id: number; startedAt: number }) | null;

let current: Current = null;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * Show the blocking task overlay. Starting a task while one runs replaces it; the old handle then does nothing.
 * For work the user can keep going during, use an inline Progress or a toast instead.
 */
export function startTask(opts: TaskOptions): TaskHandle {
  const id = nextId++;
  current = { ...opts, id, startedAt: Date.now() };
  emit();
  const mine = () => current?.id === id;
  const close = () => {
    current = null;
    emit();
  };
  return {
    update: (patch) => {
      if (!mine()) return;
      current = { ...current!, ...patch };
      emit();
    },
    done: () => {
      if (mine()) close();
    },
    fail: (title, description) => {
      if (!mine()) return;
      close();
      toast({ tone: "danger", title, description });
    },
  };
}

function cancelTask() {
  const c = current;
  if (!c?.onCancel) return;
  current = null;
  emit();
  c.onCancel();
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor((s % 3600) / 60));
  const ss = String(s % 60).padStart(2, "0");
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm.padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
};

/** Mounted once in the root layout; renders the task started by `startTask()`. */
export function TaskHost() {
  const c = useSyncExternalStore(subscribe, () => current, () => null);
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useSemiLocale();
  const { titleId } = useDialog(panelRef, !!c, c?.onCancel ? cancelTask : undefined);
  const [now, setNow] = useState(0);
  const timer = !!c?.timer;
  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [timer]);

  if (!c) return null;
  return (
    <div className={MODAL_BACKDROP}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-busy="true"
        aria-labelledby={titleId}
        className={cn(MODAL_PANEL, "sm:max-w-sm max-sm:justify-center")}
      >
        <div className="px-5 py-5 space-y-4">
          <div aria-live="polite" className="space-y-1">
            <h3 id={titleId} className="text-title font-semibold text-contrast">
              {c.label}
            </h3>
            {c.step && <p className="text-ui text-muted">{c.step}</p>}
          </div>
          <Progress value={c.value} showValue={c.value !== undefined} aria-label={c.step ?? c.label} />
          {(c.timer || c.onCancel) && (
            <div className="flex items-center justify-between gap-3 max-sm:pb-[env(safe-area-inset-bottom)]">
              {c.timer ? <span className="text-label text-muted tabular-nums">{t.elapsed(clock(Math.max(0, now - c.startedAt)))}</span> : <span />}
              {c.onCancel && (
                <button type="button" onClick={cancelTask} className={MODAL_BTN_SECONDARY}>
                  {c.cancelLabel || t.cancel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
