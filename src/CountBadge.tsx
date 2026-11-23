"use client";


// Attention marks in the brand colour (1.0, #146): a count badge (unread, waiting) and the "Mới" / "New" tag.
// Status tags (success, warning, danger, info) are Badge with a tone: one fixed palette for every brand.
import React from "react";
import { COUNT_BADGE, COUNT_BADGE_CORNER, COUNT_BADGE_NEUTRAL, NEW_TAG } from "../styles/surfaces";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export interface CountBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The count. 0 or less renders nothing. */
  count: number;
  /** Above it the badge shows `max+` (99+). @default 99 */
  max?: number;
  /** `attention` (default): the brand fill, for something that waits for the user (unread, to approve). `neutral`: a plain count that is not an alert. */
  tone?: "attention" | "neutral";
  /** Pinned to the top-right corner of a `relative` parent (an icon button). Button's `badge` prop uses it. */
  corner?: boolean;
}

/** A count in the brand colour (text-badge, 700), "99+" cap. A plain count that is not an alert passes tone="neutral". */
export function CountBadge({ count, max = 99, tone = "attention", corner = false, className, ...rest }: CountBadgeProps) {
  if (!(count > 0)) return null;
  return (
    <span className={cn(tone === "attention" ? COUNT_BADGE : COUNT_BADGE_NEUTRAL, corner && COUNT_BADGE_CORNER, className)} {...rest}>
      {count > max ? `${max}+` : count}
    </span>
  );
}

export interface NewTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The text. @default the locale's "Mới" / "New" */
  children?: React.ReactNode;
}

/** "Mới" / "New" tag: the brand colour at 18% behind brand text (or the strong text where the brand text is not AA on it). */
export function NewTag({ children, className, ...rest }: NewTagProps) {
  const t = useSemiLocale();
  return (
    <span className={cn(NEW_TAG, className)} {...rest}>
      {children ?? t.newBadge}
    </span>
  );
}
