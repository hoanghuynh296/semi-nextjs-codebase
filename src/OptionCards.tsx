"use client";

// Selectable option cards with WAI-ARIA radio-group semantics (arrow keys, single tab stop).
// Neutral selected state (item-selected + outline-line + strong text, no brand tint), item-hover on hover, 8px grid gap.
import React, { useId, useRef } from "react";
import { useField } from "./Field";
import { Icon, ICONS, type IconName } from "./Icon";
import { ensureFocusModality } from "./a11y";
import { cn } from "../styles/utils";

export interface OptionCardItem<T extends string = string> {
  value: T;
  /** Visible option name ("OpenAI", "Anthropic", "Giao tại kho"). */
  label: React.ReactNode;
  /** Optional short muted description under the name. */
  description?: React.ReactNode;
  /** Leading icon name from Semi's icon set, or a custom element. */
  icon?: IconName | React.ReactNode;
  disabled?: boolean;
}

const COLUMNS: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const isIconName = (v: unknown): v is IconName => typeof v === "string" && v in ICONS;

/**
 * Selectable option cards with radio-group semantics: icon, name, optional description, 8px grid gap, neutral selected
 * fill (`bg-item-selected`, `border-outline-line`, `text-strong`, no brand tint). Arrow keys move selection and focus;
 * the group is one tab stop.
 */
export function OptionCards<T extends string = string>({
  value,
  onChange,
  options,
  label,
  columns = 2,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  value: T;
  onChange: (value: T) => void;
  options: OptionCardItem<T>[];
  /** Accessible name of the group when not inside a `Field` or named by `aria-labelledby`. */
  label?: string;
  /** Column count from `sm` up (stacks to 1 column on phones for readability at 375px). */
  columns?: 1 | 2 | 3 | 4;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  ensureFocusModality();
  const field = useField();
  const auto = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledIdx = options.map((o, i) => (disabled || o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIdx = options.findIndex((o) => o.value === value && !disabled && !o.disabled);
  const tabStopIdx = selectedIdx >= 0 ? selectedIdx : (enabledIdx[0] ?? -1);

  const selectAt = (index: number) => {
    const opt = options[index];
    if (!opt || disabled || opt.disabled) return;
    onChange(opt.value);
    refs.current[index]?.focus();
  };

  const onKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!enabledIdx.length) return;
    const pos = enabledIdx.indexOf(index);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      selectAt(enabledIdx[(pos + 1) % enabledIdx.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      selectAt(enabledIdx[(pos - 1 + enabledIdx.length) % enabledIdx.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectAt(enabledIdx[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      selectAt(enabledIdx[enabledIdx.length - 1]);
    } else if (e.key === " ") {
      e.preventDefault();
      selectAt(index);
    }
  };

  return (
    <div data-semi="OptionCards"
      id={field?.id ?? auto}
      role="radiogroup"
      aria-label={ariaLabel ?? label}
      aria-labelledby={ariaLabel || label ? ariaLabelledby : (ariaLabelledby ?? field?.labelId)}
      aria-describedby={field?.describedBy}
      className={cn("grid gap-2 min-w-0", COLUMNS[columns], className)}
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        const isDisabled = disabled || Boolean(o.disabled);
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={isDisabled}
            tabIndex={i === tabStopIdx ? 0 : -1}
            onClick={() => !isDisabled && onChange(o.value)}
            onKeyDown={onKeyDown(i)}
            className={cn(
              "w-full min-w-0 min-h-11 text-left rounded-card border px-4 py-3 flex items-start gap-3 transition-hover cursor-pointer select-none",
              "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              selected
                ? "bg-item-selected border-outline-line text-strong"
                : "bg-transparent border-field-line text-body hover:bg-item-hover hover:text-strong",
            )}
          >
            {o.icon !== undefined && (
              <span className={cn("mt-0.5 shrink-0 flex items-center justify-center", selected ? "text-strong" : "text-muted")}>
                {isIconName(o.icon) ? <Icon name={o.icon} className="w-4 h-4" /> : o.icon}
              </span>
            )}
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className={cn("text-ui font-medium truncate", selected ? "text-strong" : "text-body")}>{o.label}</span>
              {o.description && <span className="text-ui text-muted">{o.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
