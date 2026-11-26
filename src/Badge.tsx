"use client";

import React from "react";
import { type SemanticTone, TONAL_SURFACE, BADGE_BASE, BADGE_OVERLAY } from "../styles/surfaces";
import { Icon, type IconName } from "./Icon";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Chromatic tone matching the theme (its 10% tint and text, no border). Defaults to "gray". `"overlay"`: only for text
   * on an image or video (grey at 55% + 12px backdrop blur, strong text); never on a page or card surface.
   */
  tone?: SemanticTone | "overlay";
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
 * A 10% alpha fill + high-contrast text adapted for dark and light modes; no border (#190). `tone="overlay"` on media.
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
  const sizeCls = size === "sm" ? "h-5 px-1.5 text-chrome" : "h-6 px-2 text-chrome";
  const toneCls = tone === "overlay" ? BADGE_OVERLAY : TONAL_SURFACE[tone] || TONAL_SURFACE.gray;
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
