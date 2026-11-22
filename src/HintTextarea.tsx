"use client";

// A text area that says what it can do (#94 L15, docs/DESIGN_SYSTEM.md §9b): a hint row under the text ("Gõ @ để nhắc
// nhà cung cấp · Gõ / để chèn mẫu") and a suggestion list while the word at the caret starts with a trigger.
// Textbox + listbox (aria-autocomplete="list", aria-activedescendant): ↑ / ↓ move, Enter or Tab inserts, Escape closes
// the list (and only the list). Keys typed while an input method is composing (Vietnamese Telex) are left alone.
import React, { useId, useMemo, useRef, useState } from "react";
import { useField } from "./Field";
import { Icon, type IconName } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export interface HintToken {
  /** What is inserted, with its trigger ("@s1", "/bao-gia"); a space follows it. */
  value: string;
  label: string;
  /** One muted line (a region, a subject). */
  hint?: string;
  icon?: IconName;
}

export interface HintTrigger {
  /** One character that opens the list at the start of a word: "@" for mentions, "/" for commands or templates. */
  char: string;
  /** What it does, after "Gõ @" ("để nhắc nhà cung cấp"). */
  hint: string;
  items: HintToken[];
}

const MAX_SHOWN = 6;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function HintTextarea({
  value,
  onChange,
  triggers,
  label,
  placeholder,
  rows = 4,
  disabled = false,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** One per trigger character, each with its suggestions. */
  triggers: HintTrigger[];
  /** Accessible name when there is no surrounding `Field` label. */
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** Set by the surrounding Field when omitted. */
  id?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const field = useField();
  const auto = useId();
  const listId = `${auto}-list`;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [focused, setFocused] = useState(false);

  const chars = triggers.map((tr) => escape(tr.char)).join("");
  const word = useMemo(() => {
    if (!chars) return null;
    const before = value.slice(0, caret ?? value.length);
    const m = new RegExp(`(^|\\s)([${chars}])(\\S*)$`).exec(before);
    return m ? { char: m[2], q: fold(m[3]), start: before.length - m[3].length - 1, end: before.length } : null;
  }, [value, caret, chars]);
  const trigger = word ? triggers.find((tr) => tr.char === word.char) : undefined;
  const matches = useMemo(
    () => (trigger && word ? trigger.items.filter((it) => fold(it.label).includes(word.q) || fold(it.value).includes(word.q)).slice(0, MAX_SHOWN) : []),
    [trigger, word],
  );
  const open = focused && !dismissed && !disabled && matches.length > 0;
  const current = Math.min(active, matches.length - 1);

  const readCaret = (el: HTMLTextAreaElement) => setCaret(el.selectionStart === el.selectionEnd ? el.selectionStart : null);

  const insert = (tok: HintToken) => {
    if (!word) return;
    const after = value.slice(word.end);
    const text = `${tok.value}${after.startsWith(" ") ? "" : " "}`;
    const next = value.slice(0, word.start) + text + after;
    const pos = word.start + text.length + (after.startsWith(" ") ? 1 : 0);
    onChange(next);
    setActive(0);
    setCaret(pos);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + matches.length) % matches.length);
    } else if ((e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      insert(matches[current]);
    } else if (e.key === "Escape") {
      // close the list, not the dialog around it
      e.preventDefault();
      e.stopPropagation();
      setDismissed(true);
    }
  };

  const optionId = (n: number) => `${auto}-opt-${n}`;
  return (
    <div className={cn("relative min-w-0", className)}>
      <div className={cn("rounded-card bg-tint border border-control-line hover:border-control-line-hover focus-within:border-focus focus-within:ring-1 focus-within:ring-focus transition-colors", disabled && "opacity-40")}>
        <textarea
          ref={ref}
          id={id ?? field?.id}
          value={value}
          rows={rows}
          disabled={disabled}
          aria-label={field ? undefined : label}
          aria-describedby={[`${auto}-hint`, field?.describedBy].filter(Boolean).join(" ")}
          aria-invalid={field?.invalid || undefined}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? optionId(current) : undefined}
          placeholder={placeholder}
          onChange={(e) => {
            setDismissed(false);
            setActive(0);
            onChange(e.target.value);
            readCaret(e.target);
          }}
          onSelect={(e) => readCaret(e.currentTarget)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="block w-full resize-none bg-transparent outline-none px-4 pt-3 text-ui max-sm:text-title-lg text-contrast placeholder:text-muted disabled:cursor-not-allowed"
        />
        <p id={`${auto}-hint`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2.5 pt-1 text-caption text-body">
          <Icon name="sparkles" className="w-3.5 h-3.5 shrink-0" />
          {triggers.map((tr) => (
            <span key={tr.char}>
              {t.hintType} <kbd className="px-1 rounded-chip bg-tint-hover text-contrast font-sans">{tr.char}</kbd> {tr.hint}
            </span>
          ))}
        </p>
      </div>
      <div role="status" className="sr-only">
        {open ? t.hintSuggestions(matches.length) : ""}
      </div>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={trigger!.hint}
          className="absolute left-2 right-2 sm:right-auto sm:w-80 top-full mt-1 z-popover bg-panel-4 border border-line rounded-card shadow-overlay p-1.5"
        >
          {matches.map((m, n) => (
            <div
              key={m.value}
              id={optionId(n)}
              role="option"
              aria-selected={n === current}
              // keep focus (and the caret) in the text area
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(m)}
              onMouseMove={() => setActive(n)}
              className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-control cursor-pointer", n === current && "bg-tint-hover")}
            >
              {m.icon && <Icon name={m.icon} className="w-4 h-4 text-muted shrink-0" />}
              <span className="flex-1 min-w-0">
                <span className="block text-label font-medium text-contrast truncate">{m.label}</span>
                {m.hint && <span className="block text-caption text-muted truncate">{m.hint}</span>}
              </span>
              <span className="text-caption text-muted shrink-0">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
