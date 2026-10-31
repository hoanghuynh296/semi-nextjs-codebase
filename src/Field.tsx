"use client";

// Form field: label + control + hint / error, wired for assistive tech (docs/DESIGN_SYSTEM.md "Form fields").
//   <Field label="Tên máy in" hint="Hiện trên thẻ" error={errors.name} required>
//     <Input value={name} onChange={(e) => setName(e.target.value)} />
//   </Field>
// Input, Textarea, NumberInput, CustomSelect and CustomCombobox inside a Field pick up its id, aria-describedby,
// aria-invalid and required automatically.
import React, { createContext, useContext, useId } from "react";
import { Icon, type IconName } from "./Icon";
import { useSemiLocale } from "./locale";
import { FIELD_INPUT, FIELD_LABEL, FIELD_TEXTAREA } from "../styles/surfaces";
import { cn } from "../styles/utils";

export interface FieldState {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldState | null>(null);

/** The surrounding Field's ids and state (null outside a Field). */
export const useField = () => useContext(FieldContext);

export function Field({
  label,
  hint,
  error,
  required = false,
  id: idProp,
  className,
  children,
}: {
  label: React.ReactNode;
  /** One short helper line under the control (hidden while an error shows). */
  hint?: React.ReactNode;
  /** Error message; marks the control aria-invalid and announces the message. */
  error?: React.ReactNode;
  required?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const auto = useId();
  const t = useSemiLocale();
  const id = idProp ?? `field-${auto}`;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const state: FieldState = { id, describedBy: errorId ?? hintId, invalid: !!error, required };
  return (
    <FieldContext.Provider value={state}>
      <div className={cn("min-w-0", className)}>
        <label htmlFor={id} className={FIELD_LABEL}>
          {label}
          {required && (
            <span className="text-danger-fg" aria-hidden>
              {" "}*
            </span>
          )}
          {required && <span className="sr-only"> ({t.required})</span>}
        </label>
        {children}
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-label text-danger-fg flex items-center gap-1">
            <Icon name="alert" className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="mt-1 text-label text-muted">
              {hint}
            </p>
          )
        )}
      </div>
    </FieldContext.Provider>
  );
}

const INVALID = "aria-invalid:border-danger-border aria-invalid:focus:border-danger-border";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>;
  /** Leading icon inside the field. */
  icon?: IconName;
};

/** Text input on the field surface (FIELD_INPUT). For numbers use NumberInput, for dates DatePicker. */
export function Input({ ref, icon, className, ...rest }: InputProps) {
  const field = useField();
  const input = (
    <input
      ref={ref}
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      required={field?.required}
      {...rest}
      className={cn(FIELD_INPUT, INVALID, icon && "pl-8", className)}
    />
  );
  if (!icon) return input;
  return (
    <div className="relative">
      <Icon name={icon} className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      {input}
    </div>
  );
}

/** Multi-line text on the field surface (FIELD_TEXTAREA). */
export function Textarea({ ref, className, rows = 3, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  const field = useField();
  return (
    <textarea
      ref={ref}
      rows={rows}
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      required={field?.required}
      {...rest}
      className={cn(FIELD_TEXTAREA, INVALID, className)}
    />
  );
}
