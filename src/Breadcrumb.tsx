"use client";

// Where the page sits in the app: a trail of links, the last item is the current page. Long trails collapse their
// middle items into a "…" menu (maxItems).
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { Menu } from "./Overlay";
import { useSemiLocale } from "./locale";
import { FOCUS_RING, cn } from "../styles/utils";

export interface BreadcrumbItem {
  label: string;
  /** Link of the item; the last item is the current page and needs none. */
  href?: string;
  icon?: IconName;
}

export function Breadcrumb({
  items,
  maxItems = 4,
  className,
}: {
  items: BreadcrumbItem[];
  /** More items than this collapse the middle ones into a "…" menu (first + last two stay). */
  maxItems?: number;
  className?: string;
}) {
  const t = useSemiLocale();
  const router = useRouter();
  const collapse = items.length > maxItems && maxItems >= 3;
  const hidden = collapse ? items.slice(1, items.length - 2) : [];
  const shown: (BreadcrumbItem | "more")[] = collapse ? [items[0], "more", ...items.slice(-2)] : items;
  return (
    <nav aria-label={t.breadcrumb} className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-label">
        {shown.map((it, i) => {
          const last = i === shown.length - 1;
          return (
            <li key={i} className="flex items-center gap-1 min-w-0">
              {it === "more" ? (
                <Menu
                  label={t.showHidden}
                  align="left"
                  items={hidden.map((h) => ({ label: h.label, icon: h.icon, onSelect: () => h.href && router.push(h.href) }))}
                  trigger={
                    <button type="button" aria-label={t.showHidden} className={cn("px-1 rounded-chip text-muted hover:text-contrast", FOCUS_RING)}>
                      …
                    </button>
                  }
                />
              ) : last ? (
                <span aria-current="page" className="inline-flex items-center gap-1 font-medium text-contrast truncate">
                  {it.icon && <Icon name={it.icon} className="w-3.5 h-3.5 shrink-0" />}
                  {it.label}
                </span>
              ) : it.href ? (
                <Link href={it.href} className={cn("inline-flex items-center gap-1 text-muted hover:text-contrast rounded-chip truncate", FOCUS_RING)}>
                  {it.icon && <Icon name={it.icon} className="w-3.5 h-3.5 shrink-0" />}
                  {it.label}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-muted truncate">{it.label}</span>
              )}
              {!last && <Icon name="chevron" className="w-3.5 h-3.5 text-muted shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
