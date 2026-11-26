"use client";

// Date field with an app-styled calendar popover (the browser's own date popup is white and ignores the theme).
// Values are local days "YYYY-MM-DD"; display is dd/mm/yyyy. The grid is Calendar (keyboard: arrows, PageUp/Down…).
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FLOATING_LAYER } from "./a11y";
import { useField } from "./Field";
import { useAnchoredPosition } from "./floating";
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
  disabled = false,
  id,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  /** Earliest / latest selectable day ("YYYY-MM-DD"). */
  min?: string;
  max?: string;
  /** Name when there is no `Field` label ("Ngày in"); the button reads "<name>: <date>". */
  ariaLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const field = useField();
  const [open, setOpen] = useState(false);
  const selected = parseDay(value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const valueId = useId();
  // in a portal with fixed positioning: a scrolling panel or a modal never clips the calendar
  const pos = useAnchoredPosition(buttonRef, open, { align: "right", minWidth: 0, gap: 6 });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (!popRef.current?.contains(el) && !buttonRef.current?.contains(el)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault(); // captured before a Modal's focus trap: closes the calendar, not the Modal
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const label = selected ? `${pad(selected.getDate())}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()}` : t.selectDate;
  const name = ariaLabel ?? (field ? undefined : t.selectDate);

  return (
    <div data-semi="DatePicker" className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        id={id ?? field?.id}
        type="button"
        disabled={disabled}
        // named "<name>: <date>", or by the Field label followed by the date
        aria-label={name ? `${name}: ${label}` : undefined}
        aria-labelledby={!name && field ? `${field.labelId} ${valueId}` : undefined}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 bg-field border border-field-line rounded-control text-strong text-ui font-medium tabular-nums px-3 ${field ? "h-field" : "h-control"} pointer-coarse:max-sm:min-h-11 focus:border-field-line-focus focus:bg-field-focus outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:border-danger-fg aria-invalid:focus:border-danger-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
      >
        <span id={valueId}>{label}</span>
        <Icon name="calendar" className="w-4 h-4 text-muted" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            {...FLOATING_LAYER}
            ref={popRef}
            role="dialog"
            aria-label={ariaLabel ?? t.selectDate}
            // tabbing out of the calendar closes it
            onBlur={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && !popRef.current?.contains(next) && !buttonRef.current?.contains(next)) setOpen(false);
            }}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
            className="fixed bg-panel/95 backdrop-blur-xl border border-line rounded-card shadow-overlay z-popover p-3"
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
          </div>,
          document.body,
        )}
    </div>
  );
}
