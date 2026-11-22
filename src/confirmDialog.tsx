"use client";

// App-styled replacement for window.confirm() (docs/DESIGN_SYSTEM.md §14). Mount <ConfirmHost /> once in the root
// layout, then `if (await confirmDialog({ title: "Xoá?", tone: "danger" })) …` anywhere. No state library needed.
import React, { useRef, useSyncExternalStore } from "react";
import { useDialog } from "./a11y";
import { useSemiLocale, vi } from "./locale";
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

export interface ConfirmDeleteOptions {
  /** The object that goes: shown in the title, so the user sees what is lost ("Xoá "Máy in 3"?"). */
  name: string;
  /** Replaces the default "Thao tác này không thể hoàn tác." (say what else goes: "12 bản in cũng bị xoá"). */
  message?: string;
  /** Default "Xoá". Name the verb when it is not a delete ("Ngắt kết nối"). */
  confirmLabel?: string;
  /** Replaces the whole title when the app is not in Vietnamese. */
  title?: string;
  cancelLabel?: string;
}

/** For an irreversible action: a dialog that names the object, with a red button ("Xoá") and Huỷ. A reversible one
 *  is done at once and offers `toast.undo` instead. Text is the Vietnamese default; pass `title`, `message`,
 *  `confirmLabel` and `cancelLabel` (the English ones are `en.deleteTitle` …) for another language. */
export function confirmDelete(o: ConfirmDeleteOptions): Promise<boolean> {
  return confirmDialog({
    title: o.title ?? vi.deleteTitle(o.name),
    message: o.message ?? vi.deleteMessage,
    confirmLabel: o.confirmLabel ?? vi.delete,
    cancelLabel: o.cancelLabel,
    tone: "danger",
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Mounted once in the root layout; renders the dialog opened by `confirmDialog()`. */
export function ConfirmHost() {
  const c = useSyncExternalStore(subscribe, () => current, () => null);
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useSemiLocale();
  const { titleId } = useDialog(panelRef, !!c, () => resolveConfirm(false));

  if (!c) return null;
  const danger = c.tone === "danger";

  return (
    <div
      className="fixed inset-0 z-dialog flex items-center justify-center p-4 bg-overlay backdrop-blur-lg"
      role="presentation"
      onClick={() => resolveConfirm(false)}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-panel border border-line rounded-panel w-full max-w-sm shadow-overlay overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 pt-5 pb-4 space-y-2 ${c.icon ? "text-center" : ""}`}>
          {c.icon && <div className="flex justify-center pb-1">{c.icon}</div>}
          <h3 id={titleId} className="text-title font-semibold text-contrast">
            {c.title}
          </h3>
          {c.message && <p className="text-ui text-muted leading-relaxed whitespace-pre-line">{c.message}</p>}
        </div>
        <div
          className={`px-5 pb-5 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2 ${c.icon ? "*:flex-1" : "justify-end max-sm:*:flex-1"}`}
        >
          <button type="button" onClick={() => resolveConfirm(false)} className={MODAL_BTN_SECONDARY}>
            {c.cancelLabel || t.cancel}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={() => resolveConfirm(true)}
            className={danger ? MODAL_BTN_DANGER : MODAL_BTN_PRIMARY}
          >
            {c.confirmLabel || t.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
