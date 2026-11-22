"use client";

// Validation timing of a form (docs/DESIGN_SYSTEM.md §9b): a field says nothing while it is being filled for the first
// time, shows its error when it loses focus, then follows every change (the error clears as soon as it is fixed).
// With more than one error, FormErrorSummary puts an Alert above FormActions.
//   const form = useFormValidation(values, { name: (v) => (v.trim() ? undefined : "Nhập tên máy in.") });
//   <Field label="Tên" required error={form.errors.name}><Input onBlur={form.blur("name")} … /></Field>
//   <FormErrorSummary errors={form.errors} />
//   <FormActions … />   // onSubmit: if (!form.validate()) return;
import React, { useCallback, useState } from "react";
import { Alert } from "./Feedback";
import { useSemiLocale } from "./locale";

type Message = string | undefined | null | false;
/** One rule per field: returns the message, or nothing when the value is fine. `all` is every value, for "confirm password". */
export type FormRules<T> = { [K in keyof T]?: (value: T[K], all: T) => Message };
export type FormErrors<T> = { [K in keyof T]?: string };

export interface FormValidation<T> {
  /** The errors to show: only of fields that were blurred (or after `validate()`), always up to date with the values. */
  errors: FormErrors<T>;
  /** `onBlur={form.blur("name")}`: from now on the field's error shows and follows changes. */
  blur: (name: keyof T) => () => void;
  /** Marks every field as touched (submit pressed) and returns true when all rules pass. */
  validate: () => boolean;
  /** Forgets what was touched (after a save or a reset of the form). */
  reset: () => void;
}

export function useFormValidation<T extends Record<string, unknown>>(values: T, rules: FormRules<T>): FormValidation<T> {
  const [touched, setTouched] = useState<Partial<Record<keyof T, true>>>({});
  const messages = (Object.keys(rules) as Array<keyof T>).reduce<FormErrors<T>>((out, name) => {
    const m = rules[name]?.(values[name], values);
    if (m) out[name] = m;
    return out;
  }, {});
  const errors = (Object.keys(messages) as Array<keyof T>).reduce<FormErrors<T>>((out, name) => {
    if (touched[name]) out[name] = messages[name];
    return out;
  }, {});
  const blur = useCallback((name: keyof T) => () => setTouched((p) => (p[name] ? p : { ...p, [name]: true })), []);
  const validate = () => {
    setTouched(Object.fromEntries((Object.keys(rules) as Array<keyof T>).map((n) => [n, true])) as Partial<Record<keyof T, true>>);
    return Object.keys(messages).length === 0;
  };
  const reset = useCallback(() => setTouched({}), []);
  return { errors, blur, validate, reset };
}

/**
 * The summary of a form with several errors: an `Alert` listing them, placed above `FormActions`. One error shows only
 * under its field (the summary renders nothing), so a form never says the same thing twice.
 */
export function FormErrorSummary({ errors, className }: { errors: Record<string, string | undefined>; className?: string }) {
  const t = useSemiLocale();
  const list = Object.entries(errors).filter((e): e is [string, string] => !!e[1]);
  if (list.length < 2) return null;
  return (
    <Alert tone="danger" title={t.formErrors(list.length)} className={className}>
      <ul className="list-disc pl-4 space-y-0.5">
        {list.map(([name, m]) => (
          <li key={name}>{m}</li>
        ))}
      </ul>
    </Alert>
  );
}
