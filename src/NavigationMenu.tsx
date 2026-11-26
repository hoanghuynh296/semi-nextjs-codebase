"use client";

// Top navigation of a website or landing page: links, and items that open a panel of links with a short description
// (Sản phẩm, Giải pháp). Below md it becomes one menu button that opens a sheet with every link.
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Drawer } from "./Drawer";
import { Icon, type IconName } from "./Icon";
import { useSemiLocale } from "./locale";
import { FLOATING_LAYER } from "./a11y";
import { useAnchoredPosition } from "./floating";
import { FOCUS_RING, cn } from "../styles/utils";

export interface NavigationLink {
  label: string;
  href: string;
  description?: string;
  icon?: IconName;
}

export interface NavigationItem {
  label: string;
  /** A plain link… */
  href?: string;
  /** …or a panel of links. */
  links?: NavigationLink[];
}

function NavigationPanel({
  id,
  anchor,
  links,
  current,
  panelRef,
  onClose,
  onBlur,
  onTabOut,
}: {
  id: string;
  anchor: HTMLElement | null;
  links: NavigationLink[];
  current?: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onClose: (returnFocus?: boolean) => void;
  onBlur: (e: React.FocusEvent) => void;
  onTabOut: (dir: "backward" | "forward", e?: React.KeyboardEvent) => void;
}) {
  const anchorRef = useRef<HTMLElement | null>(anchor);
  anchorRef.current = anchor;
  const pos = useAnchoredPosition(anchorRef, true, { minWidth: 480, gap: 6 });
  if (!pos || typeof document === "undefined") return null;
  return createPortal(
    <div
      {...FLOATING_LAYER}
      ref={panelRef}
      id={id}
      style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.minWidth, maxHeight: pos.maxHeight }}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose(true);
          return;
        }
        if (e.key === "Tab") {
          const focusables = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
          if (!focusables || focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            onTabOut("backward");
          } else if (!e.shiftKey && document.activeElement === last) {
            onTabOut("forward", e);
          }
        }
      }}
      className="fixed z-popover overflow-y-auto overscroll-contain rounded-card border border-line bg-panel p-2 shadow-overlay"
    >
      <ul className="grid gap-1 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={l.href === current ? "page" : undefined}
              onClick={() => onClose(false)}
              className={cn("flex gap-3 rounded-control p-2.5 hover:bg-item-hover", FOCUS_RING)}
            >
              {l.icon && <Icon name={l.icon} className="w-4 h-4 mt-0.5 text-strong shrink-0" />}
              <span className="min-w-0">
                <span className="block text-ui font-medium text-strong">{l.label}</span>
                {l.description && <span className="block text-ui text-muted">{l.description}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}

/**
 * Disclosure navigation (buttons with aria-expanded, not an ARIA menu): Enter / Space / ↓ open a panel, Escape closes
 * it and returns focus, a click outside closes it; the current page link gets aria-current.
 */
export function NavigationMenu({
  items,
  label,
  current,
  className,
}: {
  items: NavigationItem[];
  /** Accessible name of the nav ("Điều hướng chính"). */
  label: string;
  /** href of the current page (marked with aria-current="page"). */
  current?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const [open, setOpen] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const base = useId();
  const close = (returnFocus = false) => {
    const idx = open;
    setOpen(null);
    if (returnFocus && idx !== null) itemRefs.current[idx]?.focus();
  };
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!navRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const handleBlur = (e: React.FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (open !== null && next && !navRef.current?.contains(next) && !panelRef.current?.contains(next)) setOpen(null);
  };
  const handleTabOut = (dir: "backward" | "forward", e?: React.KeyboardEvent) => {
    if (open === null) return;
    if (dir === "backward") {
      itemRefs.current[open]?.focus();
      return;
    }
    const next = itemRefs.current[open + 1];
    if (next) {
      e?.preventDefault();
      setOpen(null);
      next.focus();
    } else {
      setOpen(null);
      itemRefs.current[open]?.focus();
    }
  };
  const linkCls = (href: string) =>
    cn("inline-flex items-center h-control px-3 rounded-control text-ui font-medium transition-hover", href === current ? "text-strong bg-item-selected" : "text-body hover:text-strong hover:bg-item-hover", FOCUS_RING);
  const openItem = open !== null ? items[open] : undefined;
  return (
    <nav data-semi="NavigationMenu"
      ref={navRef}
      aria-label={label}
      className={cn("relative", className)}
      // focus that leaves the nav and its portaled panel closes the open panel
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open !== null) {
          e.preventDefault();
          close(true);
        }
      }}
    >
      <ul className="hidden md:flex items-center gap-1">
        {items.map((it, i) => (
          <li key={it.label} className="relative">
            {it.links ? (
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                aria-expanded={open === i}
                aria-controls={open === i ? `${base}-${i}` : undefined}
                onClick={() => setOpen(open === i ? null : i)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(i);
                    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a")?.focus());
                  } else if (e.key === "Tab" && !e.shiftKey && open === i) {
                    const first = panelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])");
                    if (first) {
                      e.preventDefault();
                      first.focus();
                    }
                  }
                }}
                className={cn(linkCls(""), "gap-1", open === i && "text-strong bg-item-selected")}
              >
                {it.label}
                <Icon name="chevronDown" className={cn("w-3.5 h-3.5 transition-transform", open === i && "rotate-180")} />
              </button>
            ) : (
              <Link
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                href={it.href ?? "#"}
                aria-current={it.href === current ? "page" : undefined}
                className={linkCls(it.href ?? "")}
              >
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {open !== null && openItem?.links && (
        <NavigationPanel
          key={open}
          id={`${base}-${open}`}
          anchor={itemRefs.current[open]}
          links={openItem.links}
          current={current}
          panelRef={panelRef}
          onClose={close}
          onBlur={handleBlur}
          onTabOut={handleTabOut}
        />
      )}
      <button type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)} className={cn("md:hidden inline-flex items-center justify-center w-control h-control rounded-control border border-line text-body", FOCUS_RING)}>
        <Icon name="menu" className="w-4 h-4" />
      </button>
      <Drawer open={sheet} onClose={() => setSheet(false)} title={label} side="top">
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it.label}>
              {it.links ? (
                <>
                  <div className="text-ui font-medium text-muted pb-1">{it.label}</div>
                  <ul className="space-y-0.5">
                    {it.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} onClick={() => setSheet(false)} aria-current={l.href === current ? "page" : undefined} className={cn("flex items-center gap-2 rounded-control px-2 py-2 text-ui", l.href === current ? "bg-item-selected text-strong font-medium" : "text-body hover:bg-item-hover", FOCUS_RING)}>
                          {l.icon && <Icon name={l.icon} className="w-4 h-4 text-muted" />}
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link href={it.href ?? "#"} onClick={() => setSheet(false)} className={cn("block rounded-control px-2 py-2 text-ui font-medium text-strong hover:bg-item-hover", FOCUS_RING)}>
                  {it.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <span className="sr-only">{t.navigation}</span>
      </Drawer>
    </nav>
  );
}
