"use client";

// A text area that says what it can do (#94 L15, #148, docs/DESIGN_SYSTEM.md §9b): a hint row under the text
// ("Gõ @ để nhắc nhà cung cấp · Gõ / để chèn mẫu") and a suggestion list portaled with the Popover engine (flips above
// when there is no room below, never clipped by a pane or modal). `value` (or `insert`) replaces the trigger word:
// a token ("@s1") or plain text (a snippet). Optional reply-box auto-grow + top resize edge (md+).
import React, { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useField } from "./Field";
import { Icon, type IconName } from "./Icon";
import { ensureFocusModality, FLOATING_LAYER } from "./a11y";
import { useAnchoredPosition } from "./floating";
import { useSemiLocale } from "./locale";
import { useReplyResize } from "./useReplyResize";
import { cn } from "../styles/utils";

export interface HintToken {
  /** Short key or handle ("@s1", "/bao-gia"), or the inserted text itself when `insert` is omitted. Replaces the trigger word. */
  value: string;
  /** Text inserted in place of the trigger word (defaults to `value`), followed by a space. Use for plain-text snippets or templates. */
  insert?: string;
  label: string;
  /** One muted line (a region, a subject). */
  hint?: string;
  icon?: IconName;
  /** Show `value` on the right of the suggestion row (defaults to `true` when `insert` is omitted, `false` when `insert` is set). */
  showValue?: boolean;
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
  rows,
  autoGrow = false,
  resizable = false,
  containerRef,
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
  /** Visible row count (defaults to 3 when `autoGrow` / `resizable` is set, else 4). */
  rows?: number;
  /** Grow with typed text from `rows` (default 3) up to 50% of its container, then scroll inside. */
  autoGrow?: boolean;
  /** From `md`: adds a top resize edge (`role="separator"`, drag / ArrowUp / ArrowDown ±24px / double-click reset, up to 80% of container). Phones: auto-grow only. */
  resizable?: boolean;
  /** Optional bounding container for 50% / 80% height caps (auto-detected when omitted). */
  containerRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
  /** Set by the surrounding Field when omitted. */
  id?: string;
  className?: string;
}) {
  ensureFocusModality();
  const t = useSemiLocale();
  const field = useField();
  const auto = useId();
  const textareaId = id ?? field?.id ?? `${auto}-input`;
  const listId = `${auto}-list`;
  const effectiveRows = rows ?? (autoGrow || resizable ? 3 : 4);
  const ref = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [caret, setCaret] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [focused, setFocused] = useState(false);

  const { bounds, separatorHandlers } = useReplyResize({
    autoGrow,
    resizable,
    textareaRef: ref,
    wrapperRef: boxRef,
    containerRef,
    value,
    rows: effectiveRows,
    extraHeightRef: hintRef,
    disabled,
  });

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
  // Positioned with the Popover engine and portaled at z-popover: flips above when near the bottom, never clipped.
  const pos = useAnchoredPosition(boxRef, open, { minWidth: 280, gap: 6 });

  const readCaret = (el: HTMLTextAreaElement) => setCaret(el.selectionStart === el.selectionEnd ? el.selectionStart : null);

  const insertToken = (tok: HintToken) => {
    if (!word) return;
    const after = value.slice(word.end);
    const replacement = tok.insert ?? tok.value;
    const text = `${replacement}${after.startsWith(" ") ? "" : " "}`;
    const next = value.slice(0, word.start) + text + after;
    const posCaret = word.start + text.length + (after.startsWith(" ") ? 1 : 0);
    pendingCaret.current = posCaret;
    onChange(next);
    setActive(0);
    setCaret(posCaret);
  };

  // after an insert: put the caret after the token in the same commit as the new value, before the next key
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const posCaret = pendingCaret.current;
    if (!el || posCaret === null || el.value !== value) return;
    pendingCaret.current = null;
    el.focus();
    el.setSelectionRange(posCaret, posCaret);
  }, [value]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // an input method is composing (Vietnamese Telex): Safari confirms it with an Enter whose isComposing is already
    // false, but keyCode 229
    if (!open || e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + matches.length) % matches.length);
    } else if ((e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      insertToken(matches[current]);
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
      {resizable && (
        <div
          role="separator"
          tabIndex={disabled ? -1 : 0}
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
      )}
      <div
        ref={boxRef}
        data-field-frame=""
        className={cn(
          "rounded-control bg-field border border-field-line focus-within:border-field-line-focus focus-within:bg-field-focus has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-focus transition-colors",
          field?.invalid && "border-danger-fg focus-within:border-danger-fg",
          disabled && "opacity-40",
        )}
      >
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          rows={effectiveRows}
          disabled={disabled}
          aria-label={field ? undefined : label}
          aria-describedby={[`${auto}-hint`, field?.describedBy].filter(Boolean).join(" ")}
          aria-invalid={field?.invalid || undefined}
          // ARIA in HTML lists no role for <textarea>, but a combobox is what screen readers follow for a suggestion list
          // (aria-expanded, aria-activedescendant are not supported on a plain textbox); axe accepts it
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={open}
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
          className="block w-full resize-none bg-transparent outline-none px-4 pt-3 text-ui max-sm:text-input text-strong placeholder:text-muted disabled:cursor-not-allowed"
        />
        <p ref={hintRef} id={`${auto}-hint`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2.5 pt-1 text-ui text-body">
          <Icon name="sparkles" className="w-3.5 h-3.5 shrink-0" />
          {triggers.map((tr) => (
            <span key={tr.char}>
              {t.hintType} <kbd className="px-1 rounded-chip bg-tint-hover text-strong font-sans">{tr.char}</kbd> {tr.hint}
            </span>
          ))}
        </p>
      </div>
      <div role="status" className="sr-only">
        {open ? t.hintSuggestions(matches.length) : ""}
      </div>
      {open &&
        pos &&
        createPortal(
          <div
            {...FLOATING_LAYER}
            id={listId}
            role="listbox"
            aria-label={trigger!.hint}
            style={{
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              minWidth: Math.min(pos.minWidth, 320),
              maxWidth: "min(24rem, calc(100vw - 16px))",
              maxHeight: pos.maxHeight,
            }}
            className="fixed z-popover overflow-y-auto overscroll-contain bg-panel border border-line rounded-card shadow-overlay p-1.5"
          >
            {matches.map((m, n) => {
              const showVal = m.showValue ?? m.insert === undefined;
              return (
                <div
                  key={`${m.value}\u0000${m.label}`}
                  id={optionId(n)}
                  role="option"
                  aria-selected={n === current}
                  // keep focus (and the caret) in the text area
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertToken(m)}
                  onMouseMove={() => setActive(n)}
                  className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-control cursor-pointer", n === current && "bg-item-selected")}
                >
                  {m.icon && <Icon name={m.icon} className="w-4 h-4 text-muted shrink-0" />}
                  <span className="flex-1 min-w-0">
                    <span className="block text-ui font-medium text-strong truncate">{m.label}</span>
                    {m.hint && <span className="block text-chrome text-muted truncate">{m.hint}</span>}
                  </span>
                  {showVal && <span className="max-w-28 truncate text-chrome text-muted shrink-0">{m.value}</span>}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
