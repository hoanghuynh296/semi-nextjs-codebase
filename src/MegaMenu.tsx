"use client";

// Mega menu (#96, L8 of the #94 study): a flyout of links grouped in category columns, each column headed by a
// text-overline label, links with an optional grey icon, hint and "New" badge, and an optional "See all" link.
// AppShell opens it from a nav item with `mega`; an app can open it from its own trigger. Non-modal: focus moves to the
// first link, ↑/↓ move between links, Escape or a click outside closes it and focus returns to the trigger.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { FLOATING_LAYER } from "./a11y";
import { useSemiLocale } from "./locale";
import { cn, FOCUS_RING } from "../styles/utils";

export interface MegaMenuItem {
  id: string;
  label: string;
  href: string;
  /** Grey icon before the label (give every item of the menu one, or none). */
  icon?: IconName;
  /** One short line under the label. */
  hint?: string;
  /** Shows the "New" badge (locale `newBadge`). */
  isNew?: boolean;
}

export interface MegaMenuColumn {
  /** Column header, sentence case in code: it renders in `text-overline`. */
  title: string;
  items: MegaMenuItem[];
}

/** What a mega menu shows: its columns and an optional "See all" link at the bottom. */
export interface MegaMenuContent {
  columns: MegaMenuColumn[];
  /** Link to the full list; `label` defaults to the locale's `seeAll`. */
  seeAll?: { href: string; label?: string };
}

export interface MegaMenuProps extends MegaMenuContent {
  open: boolean;
  /** Called on Escape, a click outside, Tab out of the panel or a link chosen. */
  onClose: () => void;
  /** The element the panel is placed against (a sidebar for `right`, a top-bar button for `bottom`). */
  anchorRef: RefObject<HTMLElement | null>;
  /** Where focus returns when the menu closes; defaults to the element focused when it opened. */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Accessible name of the panel (the nav item's label). */
  label: string;
  /** `right` beside the anchor (a sidebar), `bottom` under it (a top bar). */
  placement?: "right" | "bottom";
  /** Called with the item id when a link is chosen (the link still navigates). */
  onNavigate?: (id: string) => void;
}

type Place = { left: number; top: number; width: number; maxHeight: number };

export function MegaMenu({
  open,
  onClose,
  anchorRef,
  triggerRef,
  label,
  columns,
  seeAll,
  placement = "right",
  onNavigate,
}: MegaMenuProps) {
  const t = useSemiLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const measure = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (placement === "right") {
      const left = r.right + 8;
      const top = r.top + 8;
      setPlace({ left, top, width: Math.min(760, vw - left - 8), maxHeight: vh - top - 8 });
    } else {
      const width = Math.min(760, vw - 16);
      const left = Math.min(Math.max(8, r.left), vw - width - 8);
      const top = r.bottom + 4;
      setPlace({ left, top, width, maxHeight: vh - top - 8 });
    }
  }, [anchorRef, placement]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, measure]);

  // Focus the first link on open, return it on close; close on Escape, outside pointer or focus leaving.
  useEffect(() => {
    if (!open || !place) return;
    const panel = panelRef.current;
    if (!panel) return;
    const opener = (triggerRef?.current ?? document.activeElement) as HTMLElement | null;
    panel.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });
    let refocus = true;
    const close = (back: boolean) => {
      refocus = back;
      closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close(true);
    };
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (panel.contains(el) || opener?.contains(el)) return;
      // a click on another control: focus goes where the click put it
      close(false);
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && !panel.contains(next) && !opener?.contains(next)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    panel.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
      panel.removeEventListener("focusout", onFocusOut);
      if (refocus && opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
    // Boolean(place): run once the panel is in the DOM, not on every re-measure
  }, [open, Boolean(place), triggerRef]);

  if (!open || !place || typeof document === "undefined") return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const links = [...(panelRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? [])];
    const at = links.indexOf(document.activeElement as HTMLElement);
    const next = links[(at + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  return createPortal(
    <div
      {...FLOATING_LAYER}
      ref={panelRef}
      role="dialog"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ left: place.left, top: place.top, width: place.width, maxHeight: place.maxHeight }}
      className="fixed z-popover overflow-y-auto bg-panel rounded-panel border border-line shadow-overlay p-card sm:p-panel"
    >
      <div className="grid gap-x-section gap-y-group" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 180px), 1fr))` }}>
        {columns.map((col) => (
          <section key={col.title} aria-label={col.title} className="flex flex-col gap-0.5 min-w-0">
            <h2 className="px-2 pb-1 text-overline text-muted">{col.title}</h2>
            <ul className="flex flex-col gap-0.5">
              {col.items.map((it) => (
                <li key={it.id}>
                  <Link
                    href={it.href}
                    onClick={() => {
                      onNavigate?.(it.id);
                      onClose();
                    }}
                    className={cn("flex items-start gap-2.5 rounded-control px-2 py-2 hover:bg-tint transition", FOCUS_RING)}
                  >
                    {it.icon && <Icon name={it.icon} className="w-4 h-4 mt-0.5 text-muted shrink-0" />}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-ui font-medium text-strong">
                        <span className="truncate">{it.label}</span>
                        {it.isNew && (
                          <span className="shrink-0 h-4 px-1.5 rounded-full bg-item-selected text-strong text-ui font-semibold leading-none inline-flex items-center">
                            {t.newBadge}
                          </span>
                        )}
                      </span>
                      {it.hint && <span className="block text-ui text-muted truncate">{it.hint}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {seeAll && (
        <div className="mt-4 pt-3 border-t border-divider flex justify-end">
          <Link
            href={seeAll.href}
            onClick={onClose}
            className={cn("inline-flex items-center gap-1 rounded-control px-2 py-1 text-ui font-medium text-strong hover:underline", FOCUS_RING)}
          >
            {seeAll.label ?? t.seeAll}
            <Icon name="arrowRight" className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>,
    document.body,
  );
}
