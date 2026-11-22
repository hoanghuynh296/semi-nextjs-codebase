"use client";

// Search and filters (#99, C-032 L2 + L17): the sticky context bar of a list page, its wide pill search and the
// result line under it ("query · N kết quả" with the sort on the right).
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Menu } from "./Overlay";
import { useSemiLocale } from "./locale";
import { STICKY_TOOLBAR } from "../styles/surfaces";
import { cn } from "../styles/utils";

/** A sort choice shown by ResultLine (a menu) and FilterPanel (a row of chips). */
export interface SortDef {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/**
 * The search, the filter chips and the result line of a list page, pinned to the top of the scrolling content while
 * the rows scroll under it. It is `STICKY_TOOLBAR` (opaque, bleeds to the panel's side padding, below the safe area on
 * phones) stacked as a column. One per page, in place of a SubpageToolbar.
 */
export function StickyContextBar({
  children,
  label,
  className,
}: {
  /** Usually SearchPill, then FilterChipRow (PhoneFilterBar on phones), then ResultLine. */
  children: React.ReactNode;
  /** Accessible name of the region ("Tìm và lọc khách hàng"); leave it out when the bar holds only a search. */
  label?: string;
  className?: string;
}) {
  return (
    <div role={label ? "search" : undefined} aria-label={label} className={cn(STICKY_TOOLBAR, "flex flex-col gap-2 mb-3", className)}>
      {children}
    </div>
  );
}

/**
 * The wide pill search of a list page: one per page, it feeds the list (or DataTable). Typing calls `onChange` after
 * `debounce` ms; the clear button and Escape clear at once. `focusKey` ("/") focuses it from anywhere on the page
 * (not while typing in another field).
 */
export function SearchPill({
  value,
  onChange,
  label,
  placeholder,
  debounce = 250,
  focusKey,
  shortcut,
  trailing,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name ("Tìm khách hàng"); also the placeholder when none is given. */
  label: string;
  placeholder?: string;
  /** Milliseconds to wait after the last key before `onChange` (0: every key). */
  debounce?: number;
  /** A key that focuses the field from anywhere on the page, e.g. "/". Shown as a key cap while the field is empty. */
  focusKey?: string;
  /** Key cap shown while empty when the app binds the shortcut itself ("⌘K" for a command palette). */
  shortcut?: string;
  /** Extra tools at the right end (image search, voice): IconButtons. */
  trailing?: React.ReactNode;
  className?: string;
}) {
  const t = useSemiLocale();
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sent = useRef(value);
  // the value changed from outside (back / forward, a "Xoá lọc" that also clears the query): show it
  useEffect(() => {
    if (value !== sent.current) {
      // a pending debounced send would overwrite what came from outside (Back / Forward restoring the URL)
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      sent.current = value;
      setText(value);
    }
  }, [value]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const emit = (next: string, now = false) => {
    if (timer.current) clearTimeout(timer.current);
    const send = () => {
      sent.current = next;
      onChange(next);
    };
    if (now || debounce <= 0) send();
    else timer.current = setTimeout(send, debounce);
  };
  useEffect(() => {
    if (!focusKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== focusKey || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusKey]);
  const hint = shortcut ?? focusKey;
  const clear = () => {
    setText("");
    emit("", true);
    inputRef.current?.focus();
  };
  return (
    <div className={cn("flex items-center gap-2 h-11 pl-4 pr-1.5 rounded-full bg-tint border border-control-line hover:border-control-line-hover focus-within:border-focus focus-within:ring-1 focus-within:ring-focus transition-colors", className)}>
      <Icon name="search" className="w-[18px] h-[18px] text-muted shrink-0" />
      <input
        ref={inputRef}
        type="search"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          emit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && text) {
            e.preventDefault(); // clears the search, not a Modal around it
            e.stopPropagation();
            clear();
          } else if (e.key === "Enter") emit(text, true);
        }}
        placeholder={placeholder ?? label}
        aria-label={label}
        enterKeyHint="search"
        className="flex-1 min-w-0 h-full bg-transparent outline-none text-ui max-sm:text-title-lg text-contrast placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          onClick={clear}
          aria-label={t.clearSearch}
          title={t.clearSearch}
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-muted hover:text-contrast hover:bg-tint-hover outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      ) : (
        hint && (
          <kbd aria-hidden className="max-sm:hidden inline-flex h-6 min-w-6 px-1.5 mr-1.5 items-center justify-center rounded-chip border border-line text-caption font-medium text-body font-sans">
            {hint}
          </kbd>
        )
      )}
      {trailing}
    </div>
  );
}

/**
 * The line under the search: `“query” · N kết quả` on the left (announced politely when it changes), the sort menu on
 * the right. Leave out `query` for a plain count.
 */
export function ResultLine({
  count,
  query,
  unit,
  sort,
  trailing,
  className,
}: {
  count: number;
  query?: string;
  /** What is counted ("khách hàng"); default the locale's "kết quả". */
  unit?: string;
  sort?: SortDef;
  /** More tools at the right end, after the sort (a ViewSwitch when there is no chip row). */
  trailing?: React.ReactNode;
  className?: string;
}) {
  const t = useSemiLocale();
  const current = sort?.options.find((o) => o.value === sort.value);
  return (
    <div className={cn("flex items-center gap-3 min-h-8 text-label", className)}>
      <p className="flex-1 min-w-0 truncate text-muted" aria-live="polite" aria-atomic="true">
        {query ? (
          <>
            <span className="text-contrast font-medium">“{query}”</span> ·{" "}
          </>
        ) : null}
        <span className="tabular-nums">{unit ? `${t.number(count)} ${unit}` : t.results(count)}</span>
      </p>
      {sort && current && (
        <Menu
          label={t.sort}
          items={sort.options.map((o) => ({ label: o.label, icon: o.value === sort.value ? "check" : undefined, onSelect: () => sort.onChange(o.value) }))}
          trigger={
            <button
              type="button"
              aria-label={`${t.sort}: ${current.label}`}
              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2 rounded-control text-label font-medium text-body hover:text-contrast hover:bg-tint outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Icon name="sliders" className="w-3.5 h-3.5 text-muted" />
              {current.label}
              <Icon name="chevronDown" className="w-3.5 h-3.5 text-muted" />
            </button>
          }
        />
      )}
      {trailing}
    </div>
  );
}
