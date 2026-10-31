"use client";

import React from "react";
import { type SemanticTone, TONAL_SURFACE, BADGE_BASE } from "../styles/surfaces";
import { Icon, type IconName } from "./Icon";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Chromatic tone matching the theme. Defaults to "gray". */
  tone?: SemanticTone;
  /** Optional leading icon from the Semi standard registry. */
  icon?: IconName;
  /** Optional leading status dot in the tone's color. */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Standard Bento Tag/Badge primitive with dual-theme tonal matching.
 * Uses 10% alpha fill + 20% alpha border + high-contrast text adapted for dark and light modes.
 */
export function Badge({
  tone = "gray",
  icon,
  dot,
  children,
  className = "",
  size = "md",
  ...props
}: BadgeProps) {
  const sizeCls = size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-[12px]";
  const toneCls = TONAL_SURFACE[tone] || TONAL_SURFACE.gray;
  return (
    <span
      className={`${BADGE_BASE} ${sizeCls} ${toneCls} ${className}`}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />}
      {icon && <Icon name={icon} className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
