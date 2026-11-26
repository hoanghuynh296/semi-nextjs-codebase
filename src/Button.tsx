"use client";

// Button and Spinner: the component form of BTN_* / MODAL_BTN_* (docs/DESIGN_SYSTEM.md §9).
// Icon-only buttons must carry an aria-label (the type requires it); loading keeps the width and blocks clicks.
import React from "react";
import { Icon, type IconName } from "./Icon";
import { buttonClass, type ButtonSizeName, type ButtonVariantName } from "../styles/buttons";
import { CountBadge } from "./CountBadge";
import { cn } from "../styles/utils";

/** Indeterminate activity mark for a button or field running its own action (§13b: no page spinners). */
export function Spinner({ className = "w-4 h-4", label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("animate-spin shrink-0", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="14 43" />
    </svg>
  );
}

/**
 * 1.0 variants (#146): `subtle` (default, ordinary actions) · `surface` (toolbar actions) · `inverse` (the main action of a
 * card or a list title row) · `outline` (beside an inverse one) · `ghost` (icon buttons, the nav bottom row) · `primary` /
 * `secondary` (brand fills: the one main button of a page, a dialog or the nav) · `danger` (solid red, #189) · `danger-subtle`
 * (the danger tint, the pre-#189 look).
 */
export type ButtonVariant = ButtonVariantName;
export type ButtonSize = ButtonSizeName;

type Base = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  ref?: React.Ref<HTMLButtonElement>;
  /**
   * Look of the button. `subtle` ordinary action · `surface` toolbar action · `inverse` the main action of a card or a
   * list title row · `outline` beside an inverse one · `ghost` icon buttons, the nav bottom row · `primary` /
   * `secondary` the brand fill, only for the one main button of a page, a dialog (its commit) or the nav, or a case the
   * app's owner asks for (`secondary` is the brand secondary; the primary when the brand has none) · `danger` a
   * destructive action: solid red with white text · `danger-subtle` a destructive action that is not the main one: the
   * danger tint and line with danger text.
   * Disabled is neutral for every variant.
   * @default "subtle"
   */
  variant?: ButtonVariant;
  /**
   * md = h-control (34px, 14px text) · lg = 40px, 14px text: the one call to action of a page header (lint
   * `one-large-button`) · sm = 28px, 12px text (dense rows, toolbars) · xs = 24px, 12px text (the inverse pill of a list
   * title row) · pill = 24px, 12px text, fully rounded (a small pill CTA) · modal = 44px and 15px text on phones,
   * h-control from sm (dialog footers, a full-width commit). On a touch phone every size is at least 44 × 44px.
   * @default "md"
   */
  size?: ButtonSize;
  /** Attention count at the top-right corner (brand fill, "99+" cap), for an icon button: unread, waiting jobs. 0 hides it. The drawn badge is aria-hidden: with an `aria-label`, say the count in it ("Thông báo, 12 chưa đọc"); without one, Button adds the count as screen-reader text. */
  badge?: number;
  /** Leading icon from the Semi registry. */
  icon?: IconName;
  /** Shows a spinner in place of the icon and blocks clicks (aria-busy). */
  loading?: boolean;
  fullWidth?: boolean;
  /**
   * `round`: fully round instead of the control radius: a circle with `iconOnly` (media tiles, overlay headers,
   * carousel arrows), a pill otherwise (the inverse pill of a list title row, `size="xs"`). Lint `raw-pill-button` flags
   * hand-made ones.
   * @default "default"
   */
  shape?: "default" | "round";
};

export type ButtonProps =
  | (Base & { iconOnly?: false; children: React.ReactNode })
  | (Base & { iconOnly: true; icon: IconName; "aria-label": string; children?: never });

export function Button({
  ref,
  variant = "subtle",
  size = "md",
  icon,
  loading = false,
  fullWidth = false,
  iconOnly = false,
  shape = "default",
  badge,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const iconCls = size === "modal" || size === "lg" ? "w-4 h-4" : size === "xs" || size === "pill" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={iconOnly ? rest["aria-label"] : undefined}
      className={buttonClass(variant, size, { iconOnly, round: shape === "round", fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner className={iconCls} /> : icon && <Icon name={icon} className={iconCls} />}
      {!iconOnly && children}
      {badge ? <CountBadge count={badge} corner aria-hidden /> : null}
      {/* No aria-label to carry the count: screen readers get it from here (the drawn badge is aria-hidden). */}
      {badge && badge > 0 && !rest["aria-label"] && !rest["aria-labelledby"] ? <span className="sr-only">{` (${badge > 99 ? "99+" : badge})`}</span> : null}
    </button>
  );
}
