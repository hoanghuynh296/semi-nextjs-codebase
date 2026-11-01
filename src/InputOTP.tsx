"use client";

// One-time code entry (OTP, PIN, 2FA): separate boxes on screen, one real input underneath, so paste, autofill from
// SMS (autocomplete="one-time-code"), screen readers and the native keyboard all work as for a normal field.
import React, { useRef, useState } from "react";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export function InputOTP({
  value,
  onChange,
  onComplete,
  length = 6,
  type = "numeric",
  label,
  groupSize = 3,
  disabled = false,
  invalid = false,
  autoFocus = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Called once every box is filled. */
  onComplete?: (value: string) => void;
  length?: number;
  /** numeric: digits and the number keypad; text: letters and digits. */
  type?: "numeric" | "text";
  /** Accessible name (default “Mã xác thực”). Put a visible label in Field around it when you have one. */
  label?: string;
  /** Visual gap after every N boxes (0: none). */
  groupSize?: number;
  disabled?: boolean;
  /** Error look (wrong code). */
  invalid?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const clean = (v: string) => (type === "numeric" ? v.replace(/\D/g, "") : v.replace(/[^0-9a-z]/gi, "").toUpperCase()).slice(0, length);
  const set = (v: string) => {
    const next = clean(v);
    onChange(next);
    if (next.length === length && next !== value) onComplete?.(next);
  };
  const caret = Math.min(value.length, length - 1);
  return (
    <div className={cn("relative inline-flex", className)} onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        value={value}
        onChange={(e) => set(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode={type === "numeric" ? "numeric" : "text"}
        autoComplete="one-time-code"
        pattern={type === "numeric" ? "[0-9]*" : undefined}
        maxLength={length}
        aria-label={label ?? t.oneTimeCode}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        autoFocus={autoFocus}
        spellCheck={false}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text disabled:cursor-not-allowed"
      />
      <div aria-hidden className="flex items-center gap-2">
        {Array.from({ length }, (_, i) => (
          <React.Fragment key={i}>
            {groupSize > 0 && i > 0 && i % groupSize === 0 && <span className="w-2 h-px bg-line-hover" />}
            <span
              className={cn(
                "flex items-center justify-center w-10 h-12 rounded-control border bg-field text-title-lg font-semibold text-contrast tabular-nums transition",
                invalid ? "border-danger-border" : focused && i === caret ? "border-accent-line bg-raised" : "border-line",
                disabled && "opacity-40",
              )}
            >
              {value[i] ?? (focused && i === caret ? <span className="w-px h-5 bg-contrast animate-pulse" /> : "")}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
