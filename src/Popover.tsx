"use client";

// Floating panels anchored to a trigger. Popover: interactive content opened by a click (filters, a quick form, a
// colour pick). HoverCard: a preview shown while pointing at or focusing a link (a user, a product).
import React, { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPosition } from "./floating";
import { cn } from "../styles/utils";

const PANEL = "fixed z-popover overflow-y-auto overscroll-contain bg-panel border border-line rounded-card shadow-overlay";
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * A non-modal dialog under its trigger. Focus moves into it; Escape, a click outside or tabbing out closes it, and
 * Escape returns focus to the trigger. Controlled with `open` + `onOpenChange`, or on its own.
 */
export function Popover({
  trigger,
  label,
  align = "left",
  width = 280,
  open: openProp,
  onOpenChange,
  className,
  children,
}: {
  /** The element that toggles it (usually a Button). */
  trigger: React.ReactElement;
  /** Accessible name of the panel. */
  label: string;
  align?: "left" | "right" | "center";
  /** Minimum width in px (it grows with its content up to the viewport). */
  width?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [own, setOwn] = useState(false);
  const open = openProp ?? own;
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOwn(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const pos = useAnchoredPosition(triggerRef, open, { align, minWidth: width, gap: 6 });

  useEffect(() => {
    if (!open || !pos) return;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
  }, [open, pos]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (!panelRef.current?.contains(el) && !triggerRef.current?.contains(el)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, setOpen]);

  const triggerProps = {
    ref: (el: HTMLElement | null) => {
      triggerRef.current = el;
    },
    "aria-haspopup": "dialog" as const,
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onClick: () => setOpen(!open),
  };
  return (
    <>
      {isValidElement(trigger) && cloneElement(trigger as React.ReactElement<Record<string, unknown>>, triggerProps)}
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              e.stopPropagation();
              setOpen(false);
              triggerRef.current?.focus();
            }}
            onBlur={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && !panelRef.current?.contains(next) && !triggerRef.current?.contains(next)) setOpen(false);
            }}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: Math.max(pos.maxHeight, 200) }}
            className={cn(PANEL, "p-3 outline-none", className)}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * A preview card while the pointer rests on (or keyboard focus is on) its trigger, usually a link. It adds detail
 * only: touch screens never show it, so the link must work without it.
 */
export function HoverCard({
  trigger,
  openDelay = 400,
  closeDelay = 150,
  width = 260,
  className,
  children,
}: {
  /** A link or button; it keeps its own name and action. */
  trigger: React.ReactElement;
  openDelay?: number;
  closeDelay?: number;
  width?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const pos = useAnchoredPosition(triggerRef, open, { minWidth: width, gap: 6 });
  const later = (next: boolean, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), ms);
  };
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const show = (e: React.PointerEvent | React.FocusEvent) => {
    if ("pointerType" in e && e.pointerType === "touch") return;
    later(true, openDelay);
  };
  const hide = () => later(false, closeDelay);
  const triggerProps = {
    ref: (el: HTMLElement | null) => {
      triggerRef.current = el;
    },
    "aria-describedby": open ? id : undefined,
    onPointerEnter: show,
    onPointerLeave: hide,
    onFocus: show,
    onBlur: hide,
    onKeyDown: (e: React.KeyboardEvent) => e.key === "Escape" && setOpen(false),
  };
  return (
    <>
      {isValidElement(trigger) && cloneElement(trigger as React.ReactElement<Record<string, unknown>>, triggerProps)}
      {open &&
        pos &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            onPointerEnter={() => later(true, 0)}
            onPointerLeave={hide}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: Math.max(pos.maxHeight, 200) }}
            className={cn(PANEL, "p-3", className)}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
