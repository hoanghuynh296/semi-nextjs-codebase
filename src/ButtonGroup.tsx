"use client";

// Joins related buttons into one segmented control (Lưu | ▾, ‹ Hôm nay ›): shared borders, outer corners only.
import React from "react";
import { cn } from "../styles/utils";

export function ButtonGroup({
  label,
  orientation = "horizontal",
  className,
  children,
}: {
  /** Accessible name of the group ("Điều hướng ngày"). */
  label?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  /** Button elements (Button, or anything styled with BTN_*). */
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex isolate *:focus-visible:z-10",
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
