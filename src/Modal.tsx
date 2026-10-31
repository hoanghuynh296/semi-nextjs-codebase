"use client";

// Shared modal dialog of the Semi Design System (docs/DESIGN_SYSTEM.md §14).
// Full screen on phones (< sm), centred rounded-2xl dialog from sm up, with standard MODAL_HEAD + MODAL_FOOT.
// Focus moves into the dialog and stays there, returns to the opener on close; the page behind does not scroll.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import {
  MODAL_BACKDROP,
  MODAL_CLOSE,
  MODAL_FOOT,
  MODAL_HEAD,
  MODAL_PANEL,
  MODAL_TITLE,
} from "../styles/surfaces";

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  maxWidth = "max-w-lg",
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Optional one-line description under the title (announced with the dialog). */
  description?: React.ReactNode;
  /** Action buttons rendered inside MODAL_FOOT (use MODAL_BTN_PRIMARY / MODAL_BTN_SECONDARY / MODAL_BTN_DANGER or <Button size="modal">). */
  footer?: React.ReactNode;
  /** Width class on >= sm screens (e.g. "max-w-md", "max-w-lg", "max-w-2xl"). */
  maxWidth?: string;
  /** Close when the backdrop is clicked (turn off for forms that would lose input). */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useSemiLocale();
  const { titleId } = useDialog(panelRef, open && mounted, onClose);
  const descId = `${titleId}-desc`;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className={MODAL_BACKDROP} onClick={closeOnBackdrop ? onClose : undefined}>
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
          <div className="min-w-0">
            <h2 id={titleId} className={MODAL_TITLE}>
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-label text-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className={MODAL_CLOSE}>
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto overscroll-contain space-y-4">{children}</div>
        {footer && <div className={MODAL_FOOT}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
