"use client";

// Shared modal dialog of the Semi Design System (docs/DESIGN_SYSTEM.md §14).
// Full screen on phones (< sm), centred rounded-2xl dialog from sm up, with standard MODAL_HEAD + MODAL_FOOT.
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
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
  footer,
  maxWidth = "max-w-lg",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Action buttons rendered inside MODAL_FOOT (use MODAL_BTN_PRIMARY / MODAL_BTN_SECONDARY / MODAL_BTN_DANGER). */
  footer?: React.ReactNode;
  /** Width class on >= sm screens (e.g. "max-w-md", "max-w-lg", "max-w-2xl"). */
  maxWidth?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`${MODAL_PANEL} ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${MODAL_HEAD} border-b border-divider`}>
          <h2 className={MODAL_TITLE}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className={MODAL_CLOSE}
          >
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
