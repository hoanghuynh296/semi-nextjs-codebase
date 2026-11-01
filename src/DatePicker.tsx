"use client";

// Date field with an app-styled calendar popover (the browser's own date popup is white and ignores the theme).
// Values are local days "YYYY-MM-DD"; display is dd/mm/yyyy. The grid is Calendar (keyboard: arrows, PageUp/Down…).
import React, { useEffect, useRef, useState } from "react";
import { useSemiLocale } from "./locale";
import { Icon } from "./Icon";
import { Calendar, parseDay } from "./Calendar";

const pad = (n: number) => String(n).padStart(2, "0");

export function DatePicker({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  /** Earliest / latest selectable day ("YYYY-MM-DD"). */
  min?: string;
  max?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const [open, setOpen] = useState(false);
  const selected = parseDay(value);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = selected ? `${pad(selected.getDate())}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()}` : t.selectDate;

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel ? `${ariaLabel}: ${label}` : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-panel border border-line rounded-control text-contrast text-label font-medium tabular-nums px-2.5 h-control hover:border-line-hover focus:outline-none focus:border-line-hover transition"
      >
        <span>{label}</span>
        <Icon name="calendar" className="w-4 h-4 text-muted" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel ?? t.selectDate}
          className="absolute right-0 mt-1.5 bg-panel/95 backdrop-blur-xl border border-line rounded-card shadow-overlay z-popover p-3"
        >
          <Calendar
            value={value}
            min={min}
            max={max}
            autoFocus
            onChange={(day) => {
              onChange(day);
              setOpen(false);
              buttonRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
