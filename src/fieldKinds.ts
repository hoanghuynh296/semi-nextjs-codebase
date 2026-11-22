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
 * `NumberInput` is the number control) and ask for the decimal keypad (the plain numeric one has no separator key, and
 * Vietnamese amounts are typed "1.250.000" or "1,5"). The text then holds separators: parse it with the number helpers
 * (`parseMoney` / `parseNumber`, #69), not `Number()`. A whole-number field passes `inputMode="numeric"` on the control.
 * A new password field passes `autoComplete="new-password"` on the control. `NumberInput` takes only `autoComplete` and
 * `enterKeyHint` from a kind (it keeps its own type and keypad).
 */
export const FIELD_KINDS: Record<FieldKind, KindAttrs> = {
  email: { type: "email", inputMode: "email", autoComplete: "email", enterKeyHint: "next" },
  tel: { type: "tel", inputMode: "tel", autoComplete: "tel", enterKeyHint: "next" },
  number: { type: "text", inputMode: "decimal", autoComplete: "off", enterKeyHint: "next" },
  money: { type: "text", inputMode: "decimal", autoComplete: "off", enterKeyHint: "next" },
  url: { type: "url", inputMode: "url", autoComplete: "url", enterKeyHint: "next" },
  search: { type: "search", inputMode: "search", autoComplete: "off", enterKeyHint: "search" },
  password: { type: "password", inputMode: "text", autoComplete: "current-password", enterKeyHint: "go" },
};

/** The attributes of a kind (an empty object for no kind, so a spread leaves the control alone). */
export function kindAttrs(kind?: FieldKind): Partial<KindAttrs> {
  return kind ? FIELD_KINDS[kind] : {};
}
