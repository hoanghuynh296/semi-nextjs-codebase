"use client";

// Form field: label + control + hint / error, wired for assistive tech (docs/DESIGN_SYSTEM.md "Form fields").
//   <Field label="Tên máy in" hint="Hiện trên thẻ" error={errors.name} required>
//     <Input value={name} onChange={(e) => setName(e.target.value)} />
//   </Field>
// Input, Textarea, NumberInput, CustomSelect and CustomCombobox inside a Field pick up its id, aria-describedby,
// aria-invalid and required automatically; `kind` (email, tel, number, money, url, search, password) also gives Input
// the right type, phone keyboard, autofill and Enter key.
import React, { createContext, useContext, useId, useRef } from "react";
import { Icon, type IconName } from "./Icon";
import { ensureFocusModality } from "./a11y";
import { kindAttrs, type FieldKind } from "./fieldKinds";
import { useSemiLocale } from "./locale";
import { useReplyResize } from "./useReplyResize";
import { FIELD_INPUT, FIELD_LABEL, FIELD_TEXTAREA } from "../styles/surfaces";
import { cn } from "../styles/utils";

export interface FieldState {
  id: string;
  /** Id of the label element, for controls that name something else with it (aria-labelledby). */
  labelId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  /** The Field's `kind`: Input and NumberInput take their type, inputMode, autoComplete and enterKeyHint from it. */
  kind?: FieldKind;
}

const FieldContext = createContext<FieldState | null>(null);

/** The surrounding Field's ids and state (null outside a Field). */
export const useField = () => useContext(FieldContext);

export function Field({
  label,
  hint,
  error,
  required = false,
  kind,
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
  /**
   * What the control holds: `email`, `tel`, `number`, `money`, `url`, `search` or `password`. Sets the control's `type`,
   * `inputMode` (the phone keyboard), `autoComplete` and `enterKeyHint`; a prop on the control itself wins.
   */
  kind?: FieldKind;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const auto = useId();
  const t = useSemiLocale();
  const id = idProp ?? `field-${auto}`;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const labelId = `${id}-label`;
  const state: FieldState = { id, labelId, describedBy: errorId ?? hintId, invalid: !!error, required, kind };
  return (
    <FieldContext.Provider value={state}>
      <div className={cn("min-w-0", className)}>
        <label id={labelId} htmlFor={id} className={FIELD_LABEL}>
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
          <p id={errorId} role="alert" className="mt-1 text-ui text-danger-fg flex items-center gap-1">
            <Icon name="alert" className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="mt-1 text-ui text-muted">
              {hint}
            </p>
          )
        )}
      </div>
    </FieldContext.Provider>
  );
}

const INVALID = "aria-invalid:border-danger-fg aria-invalid:focus:border-danger-fg";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>;
  /** Leading icon inside the field. */
  icon?: IconName;
};

/** Text input on the field surface (FIELD_INPUT). For numbers use NumberInput, for dates DatePicker. */
export function Input({ ref, icon, className, ...rest }: InputProps) {
  ensureFocusModality();
  const field = useField();
  const input = (
    <input
      ref={ref}
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      required={field?.required}
      {...kindAttrs(field?.kind)}
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

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: React.Ref<HTMLTextAreaElement>;
  /** Grow with typed text from `rows` (default 3) up to 50% of its container, then scroll inside. */
  autoGrow?: boolean;
  /** From `md`: adds a top resize edge (`role="separator"`, drag / ArrowUp / ArrowDown ±24px / double-click reset, up to 80% of container). Phones: auto-grow only. */
  resizable?: boolean;
  /** Optional bounding container for 50% / 80% height caps (auto-detected when omitted). */
  containerRef?: React.RefObject<HTMLElement | null>;
};

/** Multi-line text on the field surface (FIELD_TEXTAREA), with optional reply-box auto-grow and top resize edge. */
export function Textarea({ ref, className, rows = 3, autoGrow = false, resizable = false, containerRef, id: idProp, ...rest }: TextareaProps) {
  ensureFocusModality();
  const t = useSemiLocale();
  const field = useField();
  const auto = useId();
  const textareaId = idProp ?? field?.id ?? (resizable ? `textarea-${auto}` : undefined);
  const ownRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const setRefs = (el: HTMLTextAreaElement | null) => {
    ownRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.RefObject<HTMLTextAreaElement | null>).current = el;
  };
  const { bounds, separatorHandlers } = useReplyResize({
    autoGrow,
    resizable,
    textareaRef: ownRef,
    wrapperRef,
    containerRef,
    value: rest.value,
    rows,
    disabled: rest.disabled,
  });
  const ta = (
    <textarea
      ref={setRefs}
      rows={rows}
      id={textareaId}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      required={field?.required}
      {...rest}
      className={cn(FIELD_TEXTAREA, INVALID, (autoGrow || resizable) && "resize-none", className)}
    />
  );
  if (!resizable) return ta;
  return (
    <div ref={wrapperRef} className="min-w-0 flex flex-col">
      <div
        role="separator"
        tabIndex={rest.disabled ? -1 : 0}
        aria-orientation="horizontal"
        aria-controls={textareaId}
        aria-label={t.replyResize}
        aria-valuenow={bounds.now}
        aria-valuemin={bounds.min}
        aria-valuemax={bounds.max}
        {...separatorHandlers}
        className="group hidden md:flex items-center justify-center h-2.5 cursor-row-resize select-none touch-none rounded-chip outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span aria-hidden className="w-8 h-1 rounded-full bg-field-line group-hover:bg-field-line-focus transition-colors" />
      </div>
      {ta}
    </div>
  );
}
