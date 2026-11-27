"use client";

// App-styled replacement for window.confirm() (docs/DESIGN_SYSTEM.md §14). Mount <ConfirmHost /> once in the root
// layout, then `if (await confirmDialog({ title: "Xoá?", tone: "danger" })) …` anywhere. No state library needed.
import React, { useRef, useSyncExternalStore } from "react";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import type { ReactNode } from "react";
import { MODAL_BTN_DANGER, MODAL_BTN_PRIMARY, MODAL_BTN_SUBTLE } from "../styles/buttons";
import { cn } from "../styles/utils";
import { ScrollEdgeFades, useScrollEdges } from "./scrollEdges";

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

type Asked = Omit<ConfirmOptions, "title"> & { title?: string; kind?: "delete"; name?: string };
type Current = (Asked & { id: number }) | null;

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
  return ask(opts);
}

function ask(opts: Asked): Promise<boolean> {
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
  /** Replaces the locale's `deleteMessage` ("Thao tác này không thể hoàn tác."); say what else goes: "12 bản in cũng bị xoá". */
  message?: string;
  /** Default: the locale's `delete` ("Xoá"). Name the verb when it is not a delete ("Ngắt kết nối"). */
  confirmLabel?: string;
  /** Replaces the locale's title (`deleteTitle(name)`). */
  title?: string;
  cancelLabel?: string;
}

/** For an irreversible action: a dialog that names the object, with a red button ("Xoá") and Huỷ. A reversible one
 *  is done at once and offers `toast.undo` instead. The texts come from the locale of the provider that wraps
 *  `<ConfirmHost />` (`deleteTitle(name)`, `deleteMessage`, `delete`); a prop wins. */
export function confirmDelete(o: ConfirmDeleteOptions): Promise<boolean> {
  return ask({ ...o, kind: "delete", tone: "danger" });
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
  const messageRef = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(messageRef);

  if (!c) return null;
  const danger = c.tone === "danger";
  const title = c.title ?? (c.kind === "delete" ? t.deleteTitle(c.name ?? "") : "");
  const message = c.message ?? (c.kind === "delete" ? t.deleteMessage : undefined);
  const confirmText = c.confirmLabel || (c.kind === "delete" ? t.delete : t.ok);
  const descId = `${titleId}-desc`;

  return (
    <div data-semi="ConfirmHost"
      className="fixed inset-0 z-dialog flex items-center justify-center p-4 bg-overlay backdrop-blur-lg"
      role="presentation"
      onClick={() => resolveConfirm(false)}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? descId : undefined}
        // At most 92% of the screen: a long message scrolls between the title and the buttons, which always show (#223).
        className="bg-panel border border-line rounded-panel w-full max-w-sm max-h-[92dvh] flex flex-col shadow-overlay overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("px-5 pt-5 space-y-2 shrink-0", message ? "pb-2" : "pb-4", c.icon ? "text-center" : undefined)}>
          {c.icon && <div className="flex justify-center pb-1">{c.icon}</div>}
          <h3 id={titleId} className="text-lead font-medium text-strong break-words">
            {title}
          </h3>
        </div>
        {message && (
          <div className="relative min-h-0 flex flex-col">
            <div
              ref={messageRef}
              id={descId}
              // focusable only while it scrolls, so arrow keys can scroll it
              tabIndex={edges.scrolls ? 0 : undefined}
              className={cn(
                "min-h-0 overflow-y-auto overscroll-contain px-5 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus",
                c.icon ? "text-center" : undefined,
              )}
            >
              <p className="text-ui text-muted leading-relaxed whitespace-pre-line break-words">{message}</p>
            </div>
            <ScrollEdgeFades edges={edges} />
          </div>
        )}
        <div
          className={`px-5 pb-5 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2 shrink-0 ${c.icon ? "*:flex-1" : "justify-end max-sm:*:flex-1"}`}
        >
          <button type="button" data-autofocus={danger ? "" : undefined} onClick={() => resolveConfirm(false)} className={MODAL_BTN_SUBTLE}>
            {c.cancelLabel || t.cancel}
          </button>
          <button
            type="button"
            data-autofocus={danger ? undefined : ""}
            onClick={() => resolveConfirm(true)}
            className={danger ? MODAL_BTN_DANGER : MODAL_BTN_PRIMARY}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
