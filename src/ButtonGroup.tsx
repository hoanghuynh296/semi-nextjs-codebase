"use client";

// Joins related buttons into one segmented control (Lưu | ▾, ‹ Hôm nay ›): shared borders, outer corners only.
import React from "react";
import type { SemiName } from "./a11y";
import { cn } from "../styles/utils";

export function ButtonGroup({
  "data-semi": semi = "ButtonGroup",
  label,
  orientation = "horizontal",
  fullWidth = false,
  className,
  children,
}: {
  /** Accessible name of the group ("Điều hướng ngày"). */
  label?: string;
  orientation?: "horizontal" | "vertical";
  /** Stretch the group across its container's width (`flex w-full`). */
  fullWidth?: boolean;
  className?: string;
  /** Button elements (Button, or anything styled with BTN_*). */
  children: React.ReactNode;
} & SemiName) {
  return (
    <div data-semi={semi}
      role="group"
      aria-label={label}
      className={cn(
        fullWidth ? "flex w-full" : "inline-flex",
        "isolate *:focus-visible:z-10",
        orientation === "horizontal"
          ? "flex-row *:!rounded-none [&>*:first-child]:!rounded-l-control [&>*:last-child]:!rounded-r-control [&>*+*]:-ml-px"
          : "flex-col *:!rounded-none [&>*:first-child]:!rounded-t-control [&>*:last-child]:!rounded-b-control [&>*+*]:-mt-px",
        className,
      )}
    >
      {children}
    </div>
  );
}
