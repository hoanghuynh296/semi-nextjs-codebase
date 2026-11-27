"use client";

// Side sheet for secondary tasks that keep the page in view (filters, record details, settings).
// Right edge on desktop by default; `side="bottom"` gives a phone-style bottom sheet, `side="top"` one from the top.
// Same dialog behaviour as Modal.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { ClampToggle, useClampToggle } from "./clampedTitle";
import { scrollEdgeFades, useScrollEdges } from "./scrollEdges";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import { MODAL_CLOSE, MODAL_FOOT, MODAL_TITLE } from "../styles/surfaces";
import { cn } from "../styles/utils";

const PANEL: Record<"right" | "left" | "bottom" | "top", string> = {
  right: "inset-y-0 right-0 w-full sm:max-w-md sm:border-l slide-panel-in",
  left: "inset-y-0 left-0 w-full sm:max-w-md sm:border-r",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-panel border-t",
  top: "inset-x-0 top-0 max-h-[85dvh] rounded-b-panel border-b",
};

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  footer,
  autoFocusFirstField = true,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** right (default) / left: side sheet; bottom: phone-style sheet; top: a sheet from the top (announcements, search). */
  side?: "right" | "left" | "bottom" | "top";
  /** Actions pinned to the bottom (MODAL_FOOT). */
  footer?: React.ReactNode;
  /** Focus the first text-like field when opening on devices with a physical keyboard (`(hover: hover) and (pointer: fine)`). Touch phones keep the keyboard closed. @default true */
  autoFocusFirstField?: boolean;
  /** Width override for side drawers (e.g. "sm:max-w-lg"). */
  className?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useSemiLocale();
  const { titleId } = useDialog(ref, open && mounted, onClose, { autoFocusFirstField });
  const bodyRef = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(bodyRef);
  const clamp = useClampToggle<HTMLHeadingElement>(`${open}:${typeof title === "string" ? title : ""}`);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div data-semi="Drawer" className="fixed inset-0 z-modal">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("absolute bg-panel border-line shadow-overlay flex flex-col", PANEL[side], className)}
      >
        <div className="px-5 pt-4 max-sm:pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3 border-b border-divider shrink-0">
          <div className="min-w-0 flex-1 min-h-9 sm:min-h-8 pointer-coarse:max-sm:min-h-11 flex items-center gap-1">
            <h2 id={titleId} ref={clamp.ref} className={cn(MODAL_TITLE, "flex-1", !clamp.expanded && "line-clamp-3")}>
              {title}
            </h2>
            {clamp.cut && <ClampToggle expanded={clamp.expanded} onToggle={clamp.toggle} controls={titleId} className="self-start" />}
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className={cn(MODAL_CLOSE, "self-start")}>
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4">
            {children}
          </div>
          {scrollEdgeFades(edges)}
        </div>
        {footer && <div className={MODAL_FOOT}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
