"use client";

// Top navigation of a website or landing page: links, and items that open a panel of links with a short description
// (Sản phẩm, Giải pháp). Below md it becomes one menu button that opens a sheet with every link.
import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Drawer } from "./Drawer";
import { Icon, type IconName } from "./Icon";
import { useSemiLocale } from "./locale";
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
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => !navRef.current?.contains(e.target as Node) && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const linkCls = (href: string) =>
    cn("inline-flex items-center h-control px-3 rounded-control text-label font-medium transition", href === current ? "text-contrast bg-raised" : "text-body hover:text-contrast hover:bg-field", FOCUS_RING);
  return (
    <nav
      ref={navRef}
      aria-label={label}
      className={cn("relative", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open !== null) {
          btnRefs.current[open]?.focus();
          setOpen(null);
        }
      }}
    >
      <ul className="hidden md:flex items-center gap-1">
        {items.map((it, i) => (
          <li key={it.label} className="relative">
            {it.links ? (
              <>
                <button
                  ref={(el) => {
                    btnRefs.current[i] = el;
                  }}
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={`${base}-${i}`}
                  onClick={() => setOpen(open === i ? null : i)}
                  onKeyDown={(e) => e.key === "ArrowDown" && (e.preventDefault(), setOpen(i))}
                  className={cn(linkCls(""), "gap-1", open === i && "text-contrast bg-field")}
                >
                  {it.label}
                  <Icon name="chevronDown" className={cn("w-3.5 h-3.5 transition-transform", open === i && "rotate-180")} />
                </button>
                <div id={`${base}-${i}`} hidden={open !== i} className="absolute left-0 top-full mt-1.5 z-popover w-[480px] max-w-[calc(100vw-2rem)] rounded-card border border-line bg-panel p-2 shadow-overlay">
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {it.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          aria-current={l.href === current ? "page" : undefined}
                          onClick={() => setOpen(null)}
                          className={cn("flex gap-3 rounded-control p-2.5 hover:bg-field", FOCUS_RING)}
                        >
                          {l.icon && <Icon name={l.icon} className="w-4 h-4 mt-0.5 text-accent-fg shrink-0" />}
                          <span className="min-w-0">
                            <span className="block text-ui font-medium text-contrast">{l.label}</span>
                            {l.description && <span className="block text-label text-muted">{l.description}</span>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <Link href={it.href ?? "#"} aria-current={it.href === current ? "page" : undefined} className={linkCls(it.href ?? "")}>
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <button type="button" aria-label={label} onClick={() => setSheet(true)} className={cn("md:hidden inline-flex items-center justify-center w-control h-control rounded-control border border-line text-body", FOCUS_RING)}>
        <Icon name="menu" className="w-4 h-4" />
      </button>
      <Drawer open={sheet} onClose={() => setSheet(false)} title={label} side="top">
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it.label}>
              {it.links ? (
                <>
                  <div className="text-caption font-medium text-muted pb-1">{it.label}</div>
                  <ul className="space-y-0.5">
                    {it.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} onClick={() => setSheet(false)} aria-current={l.href === current ? "page" : undefined} className={cn("flex items-center gap-2 rounded-control px-2 py-2 text-ui text-body hover:bg-field", FOCUS_RING)}>
                          {l.icon && <Icon name={l.icon} className="w-4 h-4 text-muted" />}
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link href={it.href ?? "#"} onClick={() => setSheet(false)} className={cn("block rounded-control px-2 py-2 text-ui font-medium text-contrast hover:bg-field", FOCUS_RING)}>
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
