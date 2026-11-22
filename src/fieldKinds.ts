// What each `Field kind` sets on its control (docs/DESIGN_SYSTEM.md "Form fields"): the keyboard a phone shows, what the
// browser may autofill and the label of the Enter key. Pure data, no React: the unit tests read it directly.

export type FieldKind = "email" | "tel" | "number" | "money" | "url" | "search" | "password";

export interface KindAttrs {
  type: "text" | "email" | "tel" | "url" | "search" | "password";
  inputMode: "text" | "email" | "tel" | "url" | "search" | "numeric" | "decimal";
  autoComplete: string;
  enterKeyHint: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
}

/**
 * `number` and `money` stay `type="text"` (a native `type="number"` has no keyboard-safe formatting and spinner arrows;
 * `NumberInput` is the number control) and ask for the numeric keypad: `number` allows a decimal point, `money` is whole
 * units (VND). Pass `inputMode="decimal"` on the control for a currency with cents. A new password field passes
 * `autoComplete="new-password"` on the control.
 */
export const FIELD_KINDS: Record<FieldKind, KindAttrs> = {
  email: { type: "email", inputMode: "email", autoComplete: "email", enterKeyHint: "next" },
  tel: { type: "tel", inputMode: "tel", autoComplete: "tel", enterKeyHint: "next" },
  number: { type: "text", inputMode: "decimal", autoComplete: "off", enterKeyHint: "next" },
  money: { type: "text", inputMode: "numeric", autoComplete: "off", enterKeyHint: "next" },
  url: { type: "url", inputMode: "url", autoComplete: "url", enterKeyHint: "next" },
  search: { type: "search", inputMode: "search", autoComplete: "off", enterKeyHint: "search" },
  password: { type: "password", inputMode: "text", autoComplete: "current-password", enterKeyHint: "go" },
};

/** The attributes of a kind (an empty object for no kind, so a spread leaves the control alone). */
export function kindAttrs(kind?: FieldKind): Partial<KindAttrs> {
  return kind ? FIELD_KINDS[kind] : {};
}
