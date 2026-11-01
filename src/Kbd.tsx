"use client";

// A keyboard key or shortcut (⌘ K, Ctrl Enter) shown in menus, tooltips, the command palette and help text.
import React from "react";
import { cn } from "../styles/utils";

export function Kbd({
  keys,
  children,
  className,
}: {
  /** Several keys of one shortcut: ["⌘", "K"] renders two key caps. */
  keys?: string[];
  /** One key when `keys` is not given. */
  children?: React.ReactNode;
  className?: string;
}) {
  const cap = "inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-chip border border-line bg-field text-caption font-medium text-body tabular-nums";
  if (keys?.length)
    return (
      <kbd className={cn("inline-flex items-center gap-0.5", className)}>
        {keys.map((k, i) => (
          <kbd key={i} className={cap}>
            {k}
          </kbd>
        ))}
      </kbd>
    );
  return <kbd className={cn(cap, className)}>{children}</kbd>;
}
