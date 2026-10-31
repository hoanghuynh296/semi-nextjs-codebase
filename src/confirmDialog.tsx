"use client";

// App-styled replacement for window.confirm() (docs/DESIGN_SYSTEM.md §14). Mount <ConfirmHost /> once in the root
// layout, then `if (await confirmDialog({ title: "Xoá?", tone: "danger" })) …` anywhere. No state library needed.
import React, { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { MODAL_BTN_DANGER, MODAL_BTN_PRIMARY, MODAL_BTN_SECONDARY } from "../styles/buttons";

export interface ConfirmOptions {
  title: string;
  /** Body text; "\n" starts a new line. */
  message?: string;
  /** Label of the button that does the action, e.g. "Xoá" (default "Đồng ý"). */
  confirmLabel?: string;
  /** Label of the button that backs out, e.g. "Giữ lại" (default "Huỷ"). */
  cancelLabel?: string;
  /** "danger" paints the confirm button red (delete, stop, discard). */
  tone?: "default" | "danger";
  /** Optional icon shown centred above the title (the caller sizes and colours it). */
  icon?: ReactNode;
}

type Current = (ConfirmOptions & { id: number }) | null;

let current: Current = null;
let nextId = 1;
let pending: ((ok: boolean) => void) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function resolveConfirm(ok: boolean) {
  const done = pending;
  pending = null;
  current = null;
  emit();
  done?.(ok);
}

/** Resolves true when the user picks the confirm button. A dialog opened while another shows cancels the first. */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    pending?.(false);
    pending = resolve;
    current = { ...opts, id: nextId++ };
    emit();
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Mounted once in the root layout; renders the dialog opened by `confirmDialog()`. */
export function ConfirmHost() {
  const c = useSyncExternalStore(subscribe, () => current, () => null);

  useEffect(() => {
    if (!c) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        resolveConfirm(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [c]);

  if (!c) return null;
  const danger = c.tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg"
      onClick={() => resolveConfirm(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="semi-confirm-title"
        className="bg-panel border border-line rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 pt-5 pb-4 space-y-2 ${c.icon ? "text-center" : ""}`}>
          {c.icon && <div className="flex justify-center pb-1">{c.icon}</div>}
          <h3 id="semi-confirm-title" className="text-[15px] font-semibold text-contrast">
            {c.title}
          </h3>
          {c.message && <p className="text-[13px] text-muted leading-relaxed whitespace-pre-line">{c.message}</p>}
        </div>
        <div
          className={`px-5 pb-5 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2 ${c.icon ? "*:flex-1" : "justify-end max-sm:*:flex-1"}`}
        >
          <button type="button" onClick={() => resolveConfirm(false)} className={MODAL_BTN_SECONDARY}>
            {c.cancelLabel || "Huỷ"}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => resolveConfirm(true)}
            className={danger ? MODAL_BTN_DANGER : MODAL_BTN_PRIMARY}
          >
            {c.confirmLabel || "Đồng ý"}
          </button>
        </div>
      </div>
    </div>
  );
}
