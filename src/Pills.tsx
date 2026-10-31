"use client";

// Single-choice pill group (filters, period / chart toggles).
import React from "react";

export function Pills<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: { key: T; label: React.ReactNode; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 bg-panel p-0.5 h-[34px] rounded-lg border border-line shrink-0 ${className}`}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          title={o.title}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`px-2.5 h-full rounded-lg text-label font-medium whitespace-nowrap transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
            value === o.key ? "bg-raised text-contrast" : "text-muted hover:text-contrast"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
