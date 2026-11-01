"use client";

// An input with fixed parts around it: a unit (kg, ₫), a prefix (https://), an icon or a small button (copy, show).
// The group is the field surface; the Input inside drops its own border and background.
import React from "react";
import { cn } from "../styles/utils";

export function InputGroup({
  start,
  end,
  className,
  children,
}: {
  /** Before the input: text ("https://"), an <Icon />, a small Button. */
  start?: React.ReactNode;
  /** After the input: a unit ("kg"), a Button (copy, show password). */
  end?: React.ReactNode;
  className?: string;
  /** One Input (or Textarea / NumberInput). */
  children: React.ReactNode;
}) {
  const addon = "flex items-center shrink-0 text-ui text-muted px-3 [&>button]:-mx-2";
  return (
    <div
      className={cn(
        "flex items-stretch w-full h-field bg-field border border-line hover:border-line-hover rounded-control transition-colors overflow-hidden",
        "focus-within:border-focus focus-within:bg-raised",
        "[&_input]:h-full [&_input]:min-w-0 [&_input]:flex-1 [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!rounded-none [&_input]:!ring-0",
        start ? "[&_input]:!pl-0" : "",
        end ? "[&_input]:!pr-0" : "",
        className,
      )}
    >
      {start && <span className={addon}>{start}</span>}
      {children}
      {end && <span className={addon}>{end}</span>}
    </div>
  );
}
