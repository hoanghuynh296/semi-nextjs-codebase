"use client";

// Shared modal dialog of the Semi Design System (docs/DESIGN_SYSTEM.md §14).
// Full screen on phones (< sm), centred rounded-panel dialog from sm up, with standard MODAL_HEAD + MODAL_FOOT.
// Focus moves into the dialog and stays there, returns to the opener on close; the page behind does not scroll.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { ClampToggle, useClampToggle } from "./clampedTitle";
import { scrollEdgeFades, useScrollEdges } from "./scrollEdges";
import { useBackdropClose, useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import {
  MODAL_BACKDROP,
  MODAL_CLOSE,
  MODAL_FOOT,
  MODAL_HEAD,
  MODAL_PANEL,
  MODAL_TITLE,
} from "../styles/surfaces";
import { cn } from "../styles/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  maxWidth = "max-w-lg",
  closeOnBackdrop = true,
  autoFocusFirstField = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Optional one-line description under the title (announced with the dialog). */
  description?: React.ReactNode;
  /** Action buttons rendered inside MODAL_FOOT (use MODAL_BTN_PRIMARY / MODAL_BTN_SUBTLE / MODAL_BTN_DANGER or <Button size="modal">). */
  footer?: React.ReactNode;
  /** Width class on >= sm screens (e.g. "max-w-md", "max-w-lg", "max-w-2xl"). */
  maxWidth?: string;
  /** Close when the backdrop is clicked (turn off for forms that would lose input). */
  closeOnBackdrop?: boolean;
  /** Focus the first text-like field when opening on devices with a physical keyboard (`(hover: hover) and (pointer: fine)`). Touch phones keep the keyboard closed. @default true */
  autoFocusFirstField?: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useSemiLocale();
  const { titleId } = useDialog(panelRef, open && mounted, onClose, { autoFocusFirstField });
  const descId = `${titleId}-desc`;
  const backdrop = useBackdropClose(closeOnBackdrop ? onClose : undefined);
  const bodyRef = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(bodyRef);
  // A long title wraps and clamps to 3 lines; the toggle shows it whole (also on touch, where `title=` never shows).
  const clamp = useClampToggle<HTMLHeadingElement>(`${open}:${typeof title === "string" ? title : ""}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div data-semi="Modal" className={MODAL_BACKDROP} {...backdrop}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`${MODAL_PANEL} ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${MODAL_HEAD} border-b border-divider`}>
          {/* As tall as the close button, so a one-line title stays centred on it and a wrapped one starts at its top. */}
          <div className="min-w-0 flex-1 min-h-9 sm:min-h-8 pointer-coarse:max-sm:min-h-11 flex flex-col justify-center">
            <div className="flex items-start gap-1">
              <h2 id={titleId} ref={clamp.ref} className={cn(MODAL_TITLE, "flex-1", !clamp.expanded && "line-clamp-3")}>
                {title}
              </h2>
              {clamp.cut && <ClampToggle expanded={clamp.expanded} onToggle={clamp.toggle} controls={titleId} />}
            </div>
            {description && (
              <p id={descId} className="text-ui text-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className={cn(MODAL_CLOSE, "self-start")}>
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div ref={bodyRef} className="p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4">
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
