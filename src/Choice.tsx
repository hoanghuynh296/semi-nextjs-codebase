"use client";

// Selection controls: Checkbox, Switch, RadioGroup. Real <input>/<button role="switch"> semantics, the label is part
// of the hit area, keyboard focus shows a ring, colours come from tokens (accent when on, field / line when off).
import React, { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";
import { cn, FOCUS_RING, HIT_AREA } from "../styles/utils";

const LABEL = "text-ui text-body";
const DESC = "text-ui text-muted";
/** A labelled row on a touch phone (`pointer-coarse` + `max-sm`): 12px above and below, so the row, every pixel of which
 *  toggles the control, is at least 44px tall and a list of rows never shares a tap point (#187). */
const ROW_HIT = "pointer-coarse:max-sm:py-3 pointer-coarse:max-sm:min-w-11";

/** Dev-only console warning for a control screen readers cannot name (no label, aria-label or aria-labelledby). */
function useNameWarning(component: string, named: boolean) {
  useEffect(() => {
    if (!named && typeof process !== "undefined" && process.env.NODE_ENV !== "production")
      console.warn(`@semi/ui ${component}: no label, aria-label or aria-labelledby, so screen readers announce it without a name.`);
  }, [component, named]);
}

/** A checkbox, alone (a row's select box, with `aria-label`) or with a label and description; `indeterminate` for select-all. */
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
    <label data-semi="Checkbox" htmlFor={id} className={cn("inline-flex items-start gap-2.5 cursor-pointer select-none", Boolean(label || description) && ROW_HIT, disabled && "opacity-40 cursor-not-allowed", className)}>
      <span className={cn("relative mt-0.5 w-4 h-4 shrink-0", HIT_AREA)}>
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
            "peer relative appearance-none w-4 h-4 rounded-chip border transition-hover motion-safe:active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed",
            on ? "bg-inverted border-transparent" : "bg-field border-control-line hover:border-control-line-hover",
            FOCUS_RING,
          )}
        />
        <Icon
          name={indeterminate ? "minus" : "check"}
          className={cn("absolute inset-0 m-auto w-3 h-3 text-on-inverted pointer-events-none transition-opacity", on ? "opacity-100" : "opacity-0")}
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

/** An on / off setting that applies at once; with a label the whole row toggles it. */
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
  /** Visible label; it names the switch. With a label (or description) the whole row is one `<label>`: a tap anywhere
   *  on it toggles, and on a touch phone the row is at least 44px tall. */
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
    <button data-semi="Switch"
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
        "relative shrink-0 rounded-full border transition-hover motion-safe:active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed p-px",
        track,
        HIT_AREA,
        checked ? "bg-inverted hover:bg-inverted-hover border-transparent" : "bg-raised hover:bg-raised-2 border-line hover:border-line-hover",
        FOCUS_RING,
        !label && !description && className,
      )}
    >
      <span className={cn("block rounded-full transition-transform", knob, checked ? `bg-on-inverted ${shift}` : "bg-muted translate-x-0")} />
    </button>
  );
  if (!label && !description) return sw;
  // the whole row is the label, so a tap anywhere on it (text, description, the space between) toggles the switch
  return (
    <label data-semi="Switch" htmlFor={id} className={cn("flex items-start justify-between gap-3 cursor-pointer select-none", ROW_HIT, disabled && "cursor-not-allowed", className)}>
      <span className="flex flex-col gap-0.5 min-w-0">
        {label && (
          <span id={`${id}-label`} className={LABEL}>
            {label}
          </span>
        )}
        {description && (
          <span id={`${id}-desc`} className={DESC}>
            {description}
          </span>
        )}
      </span>
      {sw}
    </label>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

/** One choice of a few visible options (a radiogroup), vertical or horizontal. */
export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  label,
  name: nameProp,
  direction = "vertical",
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  value: T;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  /** Group label (announced for the whole group). */
  label?: React.ReactNode;
  name?: string;
  direction?: "vertical" | "horizontal";
  className?: string;
  /** Accessible name for the radiogroup when no visible `label` is rendered. `label` wins. */
  "aria-label"?: string;
  /** Id of the element that names the radiogroup when no visible `label` is rendered. `label` wins. */
  "aria-labelledby"?: string;
}) {
  const auto = useId();
  const name = nameProp ?? `radio-${auto}`;
  return (
    <div data-semi="RadioGroup"
      role="radiogroup"
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? `${name}-label` : ariaLabelledby}
      className={className}
    >
      {label && (
        <div id={`${name}-label`} className="text-ui font-medium text-muted mb-1.5">
          {label}
        </div>
      )}
      <div className={cn("flex gap-2.5", direction === "vertical" ? "flex-col" : "flex-wrap gap-x-5")}>
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const on = o.value === value;
          return (
            <label key={o.value} htmlFor={id} className={cn("inline-flex items-start gap-2.5 cursor-pointer select-none", ROW_HIT, o.disabled && "opacity-40 cursor-not-allowed")}>
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
                  on ? "border-[5px] border-inverted" : "border border-control-line",
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
