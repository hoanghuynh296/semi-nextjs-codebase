"use client";

// Top bar of the app (docs/DESIGN_SYSTEM.md §4b). Home: the product logo + name, hidden on phones (the tab bar is the
// top there). Stand-alone apps: logo + app title on the left, the app's actions on the right. There is no Home button:
// clicking the logo + title returns to `homeHref` (pass `onHome` when leaving needs a confirmation first).
import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";

export function AppHeader({
  title,
  children,
  onHome,
  hideTitleOnPhone = false,
  className = "",
  productName = "Semi",
  logo,
  logoIcon = "sparkles",
  homeHref = "/",
  homeLabel = "Về trang chủ",
}: {
  /** Stand-alone app title; without it the bar is the home page's logo bar. */
  title?: string;
  /** Right-hand side (app actions). Wrap in a `flex-1` element to centre something. */
  children?: React.ReactNode;
  /** Click on the logo + title. Default: plain link to `/`. */
  onHome?: () => void;
  /** Only the logo on phones (dense toolbars). */
  hideTitleOnPhone?: boolean;
  className?: string;
  /** Product name shown on the home bar (no `title`). */
  productName?: string;
  /** Custom logo node; replaces the default icon tile. */
  logo?: React.ReactNode;
  /** Icon of the default logo tile. */
  logoIcon?: IconName;
  /** Where the logo + title link goes. */
  homeHref?: string;
  /** Tooltip / aria text of the logo link. */
  homeLabel?: string;
}) {
  const app = title != null;
  const brand = (
    <>
      {logo ?? (
        <span className="w-6 h-6 rounded-lg bg-field border border-line text-contrast flex items-center justify-center shrink-0">
          <Icon name={logoIcon} className="w-3.5 h-3.5 text-primary-400" />
        </span>
      )}
      <span
        className={`min-w-0 truncate text-[13px] font-semibold text-contrast tracking-tight ${hideTitleOnPhone ? "max-sm:hidden" : ""}`}
      >
        {app ? title : productName}
      </span>
    </>
  );
  const brandClass =
    "min-w-0 shrink flex items-center gap-2 rounded-lg -mx-1.5 px-1.5 py-1 hover:bg-raised active:scale-95 transition";
  return (
    <header
      className={`${app ? "block" : "hidden md:block"} sticky top-0 bg-app/95 backdrop-blur-xl border-b border-divider z-30 shrink-0 select-none ${className}`}
    >
      <div className="w-full px-3 sm:px-5 h-13 flex items-center gap-2.5 min-w-0">
        {onHome ? (
          <button type="button" onClick={onHome} className={brandClass} title={homeLabel} aria-label={`${title ?? productName} · ${homeLabel}`}>
            {brand}
          </button>
        ) : (
          <Link href={homeHref} className={brandClass} title={homeLabel} aria-label={`${app ? title : productName} · ${homeLabel}`}>
            {brand}
          </Link>
        )}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-2">{children}</div>
      </div>
    </header>
  );
}
