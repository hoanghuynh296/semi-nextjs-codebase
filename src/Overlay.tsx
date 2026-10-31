"use client";

// Floating layers anchored to a trigger: Tooltip (hint on hover / focus) and Menu (action list, WAI-ARIA menu button).
// Both render in a portal with fixed positioning, so scrolling panels and modals never clip them.
import React, { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";
import { useAnchoredPosition } from "./floating";
import { useSemiLocale } from "./locale";
import { BTN_ICON, BTN_SECONDARY } from "../styles/buttons";
import { cn } from "../styles/utils";

/**
 * Short hint for an icon-only control (one line, no interactive content). The trigger keeps its own aria-label;
 * the tooltip is linked with aria-describedby. Touch screens show nothing: never put essential text in a tooltip.
 */
export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactElement; side?: "top" | "bottom" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const id = useId();
  const pos = useAnchoredPosition(ref, open, { align: "center", minWidth: 0, gap: 6, preferAbove: side === "top" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isValidElement(children)) return children;
  const show = () => {
    timer.current = setTimeout(() => setOpen(true), 350);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };
  const child = children as React.ReactElement<Record<string, unknown>>;
  const trigger = cloneElement(child, {
    ref: (el: HTMLElement | null) => {
      ref.current = el;
    },
    "aria-describedby": open ? id : (child.props["aria-describedby"] as string | undefined),
    onPointerEnter: show,
    onPointerLeave: hide,
    onFocus: () => setOpen(true),
    onBlur: hide,
  });

  return (
    <>
      {trigger}
      {open &&
        pos &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
            className="fixed z-tooltip max-w-[260px] px-2 py-1 rounded-lg bg-raised border border-line text-label text-contrast shadow-overlay pointer-events-none"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

export interface MenuItem {
  label: React.ReactNode;
  icon?: IconName;
  onSelect: () => void;
  /** Destructive item (Xoá): danger text, placed last by convention. */
  danger?: boolean;
  disabled?: boolean;
  /** Draw a divider above this item. */
  separator?: boolean;
}

/**
 * Action menu behind a trigger button (row / card overflow actions). ↑/↓ move, Enter / Space pick, Escape closes and
 * returns focus. Default trigger: icon-only "more" button; pass `trigger` (an element) to use your own.
 */
export function Menu({
  items,
  label: labelProp,
  align = "right",
  trigger,
}: {
  items: MenuItem[];
  /** Accessible name of the default trigger. */
  label?: string;
  align?: "left" | "right";
  trigger?: React.ReactElement;
}) {
  const t = useSemiLocale();
  const label = labelProp ?? t.actions;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const btnRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const pos = useAnchoredPosition(btnRef, open, { align, minWidth: 180 });
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (!menuRef.current?.contains(el) && !btnRef.current?.contains(el)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.focus();
  }, [open, active, pos]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };
  const openAt = (idx: number) => {
    setActive(idx);
    setOpen(true);
  };
  const step = (dir: 1 | -1) => {
    const k = enabled.indexOf(active);
    setActive(enabled[(k + dir + enabled.length) % enabled.length]);
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAt(enabled[0] ?? 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAt(enabled[enabled.length - 1] ?? 0);
    }
  };
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") return close(false);
    const actions: Record<string, () => void> = {
      ArrowDown: () => step(1),
      ArrowUp: () => step(-1),
      Home: () => setActive(enabled[0]),
      End: () => setActive(enabled[enabled.length - 1]),
      Escape: () => close(),
    };
    if (!actions[e.key]) return;
    e.preventDefault();
    e.stopPropagation();
    actions[e.key]();
  };

  const triggerProps = {
    ref: (el: HTMLElement | null) => {
      btnRef.current = el;
    },
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onClick: () => (open ? close() : openAt(enabled[0] ?? 0)),
    onKeyDown: onTriggerKey,
  };

  return (
    <>
      {trigger && isValidElement(trigger) ? (
        cloneElement(trigger as React.ReactElement<Record<string, unknown>>, triggerProps)
      ) : (
        <button type="button" aria-label={label} title={label} className={cn(BTN_SECONDARY, BTN_ICON)} {...triggerProps}>
          <Icon name="more" className="w-4 h-4" />
        </button>
      )}
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            id={id}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
            className="fixed z-popover overflow-y-auto overscroll-contain bg-panel border border-line rounded-xl shadow-overlay p-1 flex flex-col gap-0.5"
          >
            {items.map((it, i) => (
              <React.Fragment key={i}>
                {it.separator && <div role="separator" className="my-1 h-px bg-divider" />}
                <button
                  type="button"
                  role="menuitem"
                  data-idx={i}
                  tabIndex={i === active ? 0 : -1}
                  disabled={it.disabled}
                  onPointerEnter={() => !it.disabled && setActive(i)}
                  onClick={() => {
                    close();
                    it.onSelect();
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-label flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none",
                    it.danger ? "text-danger-fg hover:bg-danger-bg focus-visible:bg-danger-bg" : "text-body hover:bg-raised hover:text-contrast focus-visible:bg-raised focus-visible:text-contrast",
                  )}
                >
                  {it.icon && <Icon name={it.icon} className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{it.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

