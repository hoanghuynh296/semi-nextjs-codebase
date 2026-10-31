"use client";

// Date field with an app-styled calendar popover (the browser's own date popup is white and ignores the theme).
// Values are local days "YYYY-MM-DD"; display is dd/mm/yyyy; weeks start on Monday.
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (v: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

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
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [view, setView] = useState(() => {
    const d = selected || new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const d = selected || new Date();
      setView({ y: d.getFullYear(), m: d.getMonth() });
    }
    setOpen((o) => !o);
  };
  const shift = (delta: number) => setView((v) => {
    const d = new Date(v.y, v.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // 6 weeks from the Monday on or before the 1st
  const first = new Date(view.y, view.m, 1);
  const start = new Date(view.y, view.m, 1 - ((first.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const today = iso(new Date());
  const label = selected ? `${pad(selected.getDate())}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()}` : "Chọn ngày";

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="flex items-center gap-2 bg-panel border border-line rounded-lg text-contrast text-[12px] font-medium tabular-nums px-2.5 h-[34px] hover:border-line-hover focus:outline-none focus:border-line-hover transition"
      >
        <span>{label}</span>
        <Icon name="calendar" className="w-4 h-4 text-muted" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="absolute right-0 mt-1.5 w-[264px] bg-panel/95 backdrop-blur-xl border border-line rounded-xl shadow-2xl z-50 p-3 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Tháng trước" onClick={() => shift(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-contrast hover:bg-raised transition">
              <Icon name="back" className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-medium text-contrast tabular-nums">
              Tháng {view.m + 1}, {view.y}
            </span>
            <button type="button" aria-label="Tháng sau" onClick={() => shift(1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-contrast hover:bg-raised transition">
              <Icon name="chevron" className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] text-muted">
            {WEEKDAYS.map((w) => (
              <span key={w} className="h-7 flex items-center justify-center">
                {w}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d) => {
              const key = iso(d);
              const outside = d.getMonth() !== view.m;
              const disabled = Boolean((min && key < min) || (max && key > max));
              const isSel = key === value;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-lg text-[12px] tabular-nums flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none ${
                    isSel
                      ? "bg-primary-500/20 text-accent-fg font-medium"
                      : key === today
                        ? "text-accent-fg border border-primary-500/40 hover:bg-raised"
                        : outside
                          ? "text-muted/60 hover:bg-raised"
                          : "text-body hover:bg-raised"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between pt-1">
            <button
              type="button"
              disabled={Boolean(max && today > max) || Boolean(min && today < min)}
              onClick={() => {
                onChange(today);
                setOpen(false);
              }}
              className="text-[12px] font-medium text-accent-fg hover:text-contrast disabled:opacity-30 disabled:pointer-events-none transition"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
