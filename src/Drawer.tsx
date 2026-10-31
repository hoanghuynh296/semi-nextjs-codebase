"use client";

// Side sheet for secondary tasks that keep the page in view (filters, record details, settings).
// Right edge on desktop by default; `side="bottom"` gives a phone-style bottom sheet. Same dialog behaviour as Modal.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import { MODAL_CLOSE, MODAL_FOOT, MODAL_TITLE } from "../styles/surfaces";
import { cn } from "../styles/utils";

const PANEL: Record<"right" | "left" | "bottom", string> = {
  right: "inset-y-0 right-0 w-full sm:max-w-md sm:border-l slide-panel-in",
  left: "inset-y-0 left-0 w-full sm:max-w-md sm:border-r",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t",
};

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  side?: "right" | "left" | "bottom";
  /** Actions pinned to the bottom (MODAL_FOOT). */
  footer?: React.ReactNode;
  /** Width override for side drawers (e.g. "sm:max-w-lg"). */
  className?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useSemiLocale();
  const { titleId } = useDialog(ref, open && mounted, onClose);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("absolute bg-panel border-line shadow-overlay flex flex-col", PANEL[side], className)}
      >
        <div className="px-5 pt-4 max-sm:pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3 border-b border-divider shrink-0">
          <h2 id={titleId} className={MODAL_TITLE}>
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label={t.close} className={MODAL_CLOSE}>
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">{children}</div>
        {footer && <div className={MODAL_FOOT}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
