"use client";

// Floating layers anchored to a trigger: Tooltip (hint on hover / focus), Menu (action list, WAI-ARIA menu button) and
// ContextMenu (the same list opened at the pointer).
// Both render in a portal with fixed positioning, so scrolling panels and modals never clip them.
import React, { cloneElement, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";
import { useAnchoredPosition, type AnchoredPosition } from "./floating";
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
            className="fixed z-tooltip max-w-[260px] px-2 py-1 rounded-control bg-raised border border-line text-label text-contrast shadow-overlay pointer-events-none"
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
  /** Keyboard shortcut shown on the right ("⌘D"); the app binds the key itself. */
  shortcut?: string;
}

/** The floating list of a Menu / ContextMenu: ↑/↓ Home End move (skipping disabled items), Enter / Space pick,
 * Escape closes, Tab closes and moves on. Rendered in a portal at `pos`. */
function MenuPanel({
  id,
  items,
  label,
  pos,
  initial,
  onClose,
  panelRef,
}: {
  id: string;
  items: MenuItem[];
  label: string;
  pos: AnchoredPosition;
  initial: number;
  onClose: (refocus: boolean) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [active, setActive] = useState(initial);
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.focus();
  }, [active, panelRef]);
  const step = (dir: 1 | -1) => {
    const k = enabled.indexOf(active);
    setActive(enabled[(k + dir + enabled.length) % enabled.length]);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") return onClose(false);
    const actions: Record<string, () => void> = {
      ArrowDown: () => step(1),
      ArrowUp: () => step(-1),
      Home: () => setActive(enabled[0]),
      End: () => setActive(enabled[enabled.length - 1]),
      Escape: () => onClose(true),
    };
    if (!actions[e.key]) return;
    e.preventDefault();
    e.stopPropagation();
    actions[e.key]();
  };
  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="menu"
      aria-label={label}
      onKeyDown={onKey}
      style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
      className="fixed z-popover overflow-y-auto overscroll-contain bg-panel border border-line rounded-card shadow-overlay p-1 flex flex-col gap-0.5"
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
              onClose(true);
              it.onSelect();
            }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-control text-label flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none",
              it.danger ? "text-danger-fg hover:bg-danger-bg focus-visible:bg-danger-bg" : "text-body hover:bg-raised hover:text-contrast focus-visible:bg-raised focus-visible:text-contrast",
            )}
          >
            {it.icon && <Icon name={it.icon} className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate flex-1">{it.label}</span>
            {it.shortcut && <span className="text-caption text-muted tabular-nums">{it.shortcut}</span>}
          </button>
        </React.Fragment>
      ))}
    </div>,
    document.body,
  );
}

/** Close a floating layer on a pointer down outside it (and outside its trigger). */
function useOutsideClose(open: boolean, refs: React.RefObject<HTMLElement | null>[], close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (!refs.some((r) => r.current?.contains(el))) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, refs, close]);
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
  const [open, setOpen] = useState<false | number>(false);
  const btnRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const pos = useAnchoredPosition(btnRef, open !== false, { align, minWidth: 180 });
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);
  const refs = useMemo(() => [menuRef, btnRef], []);
  useOutsideClose(open !== false, refs, () => close(false));

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(enabled[0] ?? 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(enabled[enabled.length - 1] ?? 0);
    }
  };
  const triggerProps = {
    ref: (el: HTMLElement | null) => {
      btnRef.current = el;
    },
    "aria-haspopup": "menu" as const,
    "aria-expanded": open !== false,
    "aria-controls": open !== false ? id : undefined,
    onClick: () => (open !== false ? close() : setOpen(enabled[0] ?? 0)),
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
      {open !== false && pos && <MenuPanel id={id} items={items} label={label} pos={pos} initial={open} onClose={close} panelRef={menuRef} />}
    </>
  );
}

/**
 * The menu of an area opened at the pointer: right-click, long-press on touch, or the Menu key / Shift+F10 when the
 * area has focus. Use for power-user shortcuts that also exist elsewhere (a row's Menu, a toolbar button).
 */
export function ContextMenu({
  items,
  label: labelProp,
  className,
  children,
}: {
  items: MenuItem[];
  /** Accessible name of the menu. */
  label?: string;
  className?: string;
  /** The area that opens the menu (it becomes focusable). */
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  const label = labelProp ?? t.actions;
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const pos = useAnchoredPosition(anchorRef, at !== null, { minWidth: 180, gap: 0 });
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  const close = useCallback((refocus = true) => {
    setAt(null);
    if (refocus) areaRef.current?.focus();
  }, []);
  const refs = useMemo(() => [menuRef], []);
  useOutsideClose(at !== null, refs, () => close(false));
  const openAt = (x: number, y: number) => setAt({ x, y });
  const clearPress = () => press.current && clearTimeout(press.current);
  return (
    <div
      ref={areaRef}
      tabIndex={0}
      onContextMenu={(e) => {
        e.preventDefault();
        openAt(e.clientX, e.clientY);
      }}
      onKeyDown={(e) => {
        if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
          e.preventDefault();
          const r = areaRef.current!.getBoundingClientRect();
          openAt(r.left + 16, r.top + 16);
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        const { clientX, clientY } = e;
        press.current = setTimeout(() => openAt(clientX, clientY), 550);
      }}
      onPointerUp={clearPress}
      onPointerCancel={clearPress}
      onPointerMove={clearPress}
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-card", className)}
    >
      {children}
      {at && <span ref={anchorRef} aria-hidden style={{ position: "fixed", left: at.x, top: at.y, width: 0, height: 0 }} />}
      {at && pos && <MenuPanel id={id} items={items} label={label} pos={pos} initial={enabled[0] ?? 0} onClose={close} panelRef={menuRef} />}
    </div>
  );
}
