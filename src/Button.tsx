"use client";

// Button and Spinner: the component form of BTN_* / MODAL_BTN_* (docs/DESIGN_SYSTEM.md §9).
// Icon-only buttons must carry an aria-label (the type requires it); loading keeps the width and blocks clicks.
import React from "react";
import { Icon, type IconName } from "./Icon";
import {
  BTN_DANGER,
  BTN_GHOST,
  BTN_ICON,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SM,
  MODAL_BTN_DANGER,
  MODAL_BTN_PRIMARY,
  MODAL_BTN_SECONDARY,
} from "../styles/buttons";
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

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "modal";

const CLASSES: Record<ButtonSize, Record<ButtonVariant, string>> = {
  md: { primary: BTN_PRIMARY, secondary: BTN_SECONDARY, danger: BTN_DANGER, ghost: BTN_GHOST },
  sm: { primary: `${BTN_PRIMARY} ${BTN_SM}`, secondary: `${BTN_SECONDARY} ${BTN_SM}`, danger: `${BTN_DANGER} ${BTN_SM}`, ghost: `${BTN_GHOST} ${BTN_SM}` },
  modal: { primary: MODAL_BTN_PRIMARY, secondary: MODAL_BTN_SECONDARY, danger: MODAL_BTN_DANGER, ghost: MODAL_BTN_SECONDARY },
};

type Base = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  ref?: React.Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  /** md = 34px toolbar / form · sm = 28px dense rows · modal = 44px on phones, 34px from sm (dialog footers). */
  size?: ButtonSize;
  /** Leading icon from the Semi registry. */
  icon?: IconName;
  /** Shows a spinner in place of the icon and blocks clicks (aria-busy). */
  loading?: boolean;
  fullWidth?: boolean;
};

export type ButtonProps =
  | (Base & { iconOnly?: false; children: React.ReactNode })
  | (Base & { iconOnly: true; icon: IconName; "aria-label": string; children?: never });

export function Button({
  ref,
  variant = "secondary",
  size = "md",
  icon,
  loading = false,
  fullWidth = false,
  iconOnly = false,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const iconCls = size === "modal" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={iconOnly ? rest["aria-label"] : undefined}
      className={cn(CLASSES[size][variant], iconOnly && BTN_ICON, iconOnly && size === "sm" && "!w-7", fullWidth && "w-full", className)}
      {...rest}
    >
      {loading ? <Spinner className={iconCls} /> : icon && <Icon name={icon} className={iconCls} />}
      {!iconOnly && children}
    </button>
  );
}
