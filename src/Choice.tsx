"use client";

// Selection controls: Checkbox, Switch, RadioGroup. Real <input>/<button role="switch"> semantics, the label is part
// of the hit area, keyboard focus shows a ring, colours come from tokens (accent when on, field / line when off).
import React, { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";
import { cn, FOCUS_RING } from "../styles/utils";

const LABEL = "text-ui text-body";
const DESC = "text-label text-muted";
// On a touch screen (any coarse pointer) the control's hit area grows to 44 × 44 px around it; the visible size and the
// layout stay. A pseudo-element of the clickable element, so no JS (same detection as useCoarsePointer).
const TOUCH_TARGET =
  "any-pointer-coarse:before:absolute any-pointer-coarse:before:top-1/2 any-pointer-coarse:before:left-1/2 any-pointer-coarse:before:size-[44px] any-pointer-coarse:before:-translate-1/2";

/** Dev-only console warning for a control screen readers cannot name (no label, aria-label or aria-labelledby). */
function useNameWarning(component: string, named: boolean) {
  useEffect(() => {
    if (!named && typeof process !== "undefined" && process.env.NODE_ENV !== "production")
      console.warn(`@semi/ui ${component}: no label, aria-label or aria-labelledby, so screen readers announce it without a name.`);
  }, [component, named]);
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  indeterminate = false,
  disabled = false,
  id: idProp,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label; it names the checkbox and is part of the hit area. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Mixed state ("some selected") for a select-all box. */
  indeterminate?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Name for screen readers when there is no visible `label` (a row's select box: "Chọn đơn #1024"). `label` wins. */
  "aria-label"?: string;
  /** Id of the element that names the checkbox when its text is elsewhere (a table cell, a card title). `label` wins. */
  "aria-labelledby"?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const ref = useRef<HTMLInputElement>(null);
  useNameWarning("Checkbox", Boolean(label || ariaLabel || ariaLabelledby));
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const on = checked || indeterminate;
  return (
    <label htmlFor={id} className={cn("inline-flex items-start gap-2.5 cursor-pointer select-none", disabled && "opacity-40 cursor-not-allowed", className)}>
      <span className={cn("relative mt-0.5 w-4 h-4 shrink-0", TOUCH_TARGET)}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-label={label ? undefined : ariaLabel}
          aria-labelledby={label ? undefined : ariaLabelledby}
          aria-describedby={description ? `${id}-desc` : undefined}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "peer appearance-none w-4 h-4 rounded-chip border transition cursor-pointer disabled:cursor-not-allowed",
            on ? "bg-accent border-transparent" : "bg-field border-line-hover",
            FOCUS_RING,
          )}
        />
        <Icon
          name={indeterminate ? "minus" : "check"}
          className={cn("absolute inset-0 m-auto w-3 h-3 text-on-accent pointer-events-none transition-opacity", on ? "opacity-100" : "opacity-0")}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5 min-w-0">
          {label && <span className={LABEL}>{label}</span>}
          {description && (
            <span id={`${id}-desc`} className={DESC}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  id: idProp,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label; it names the switch. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Visible size only: on touch screens both sizes get a 44 × 44 px hit area. */
  size?: "sm" | "md";
  id?: string;
  className?: string;
  /** Name for screen readers when the switch has no visible `label` ("Bật automation Nhắc bảo trì"). `label` wins. */
  "aria-label"?: string;
  /** Id of the element that names the switch when its text is elsewhere (a card header). `label` wins. */
  "aria-labelledby"?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  useNameWarning("Switch", Boolean(label || ariaLabel || ariaLabelledby));
  const track = size === "sm" ? "w-7 h-4" : "w-9 h-5";
  const knob = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const shift = size === "sm" ? "translate-x-3" : "translate-x-4";
  const sw = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? `${id}-label` : ariaLabelledby}
      aria-label={label ? undefined : ariaLabel}
      aria-describedby={description ? `${id}-desc` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative shrink-0 rounded-full border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed p-px",
        track,
        TOUCH_TARGET,
        checked ? "bg-accent border-transparent" : "bg-raised border-line",
        FOCUS_RING,
      )}
    >
      <span className={cn("block rounded-full transition-transform", knob, checked ? `bg-on-accent ${shift}` : "bg-muted translate-x-0")} />
    </button>
  );
  if (!label && !description) return sw;
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <span className="flex flex-col gap-0.5 min-w-0">
        {label && (
          <label id={`${id}-label`} htmlFor={id} className={cn(LABEL, "cursor-pointer")}>
            {label}
          </label>
        )}
        {description && (
          <span id={`${id}-desc`} className={DESC}>
            {description}
          </span>
        )}
      </span>
      {sw}
    </div>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  label,
  name: nameProp,
  direction = "vertical",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  /** Group label (announced for the whole group). */
  label?: React.ReactNode;
  name?: string;
  direction?: "vertical" | "horizontal";
  className?: string;
}) {
  const auto = useId();
  const name = nameProp ?? `radio-${auto}`;
  return (
    <div role="radiogroup" aria-labelledby={label ? `${name}-label` : undefined} className={className}>
      {label && (
        <div id={`${name}-label`} className="text-label font-medium text-muted mb-1.5">
          {label}
        </div>
      )}
      <div className={cn("flex gap-2.5", direction === "vertical" ? "flex-col" : "flex-wrap gap-x-5")}>
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const on = o.value === value;
          return (
            <label key={o.value} htmlFor={id} className={cn("inline-flex items-start gap-2.5 cursor-pointer select-none", o.disabled && "opacity-40 cursor-not-allowed")}>
              <input
                id={id}
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
                className={cn(
                  "appearance-none mt-0.5 w-4 h-4 shrink-0 rounded-full bg-field transition cursor-pointer disabled:cursor-not-allowed",
                  on ? "border-[5px] border-accent" : "border border-line-hover",
                  FOCUS_RING,
                )}
              />
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className={LABEL}>{o.label}</span>
                {o.description && <span className={DESC}>{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
