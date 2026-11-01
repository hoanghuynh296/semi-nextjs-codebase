"use client";

// Command palette: type to filter actions and places, ↑/↓ to move, Enter to run. Command is the inline list;
// CommandDialog opens it over the page (⌘K / Ctrl+K with useHotkey). Matching ignores case and Vietnamese marks.
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";
import { Kbd } from "./Kbd";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export interface CommandItem {
  id: string;
  label: string;
  /** Heading the item is listed under ("Trang", "Thao tác"). Items of a group are shown together, in order. */
  group?: string;
  icon?: IconName;
  /** Shortcut shown on the right, e.g. ["⌘", "N"]; the app binds the key itself. */
  shortcut?: string[];
  /** Extra words that should find it (synonyms, English names). */
  keywords?: string[];
  disabled?: boolean;
  onSelect: () => void;
}

/** Lowercase, no Vietnamese marks (đ → d): "Đơn hàng" matches "don hang". */
export const normalizeSearch = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();

/** Items whose label, group or keywords contain every word of the query; label prefix matches first. */
export function filterCommands(items: CommandItem[], query: string): CommandItem[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  const scored = items
    .map((it, i) => {
      const label = normalizeSearch(it.label);
      const hay = [label, normalizeSearch(it.group ?? ""), ...(it.keywords ?? []).map(normalizeSearch)].join(" ");
      if (!words.every((w) => hay.includes(w))) return null;
      return { it, i, score: label.startsWith(words[0]) ? 0 : label.includes(words[0]) ? 1 : 2 };
    })
    .filter((x): x is { it: CommandItem; i: number; score: number } => x !== null);
  return scored.sort((a, b) => a.score - b.score || a.i - b.i).map((x) => x.it);
}

/** Register a global ⌘ / Ctrl + key shortcut (default ⌘K). The handler runs on keydown; the browser action is prevented. */
export function useHotkey(handler: () => void, key = "k") {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);
}

/**
 * The searchable list itself (inside a page, a Popover or CommandDialog). The input is an ARIA combobox that owns a
 * listbox; the active option follows aria-activedescendant so focus never leaves the input.
 */
export function Command({
  items,
  placeholder,
  emptyText,
  onEscape,
  autoFocus = false,
  className,
}: {
  items: CommandItem[];
  placeholder?: string;
  /** Shown when nothing matches (default from the locale). */
  emptyText?: React.ReactNode;
  /** Escape on an empty query (CommandDialog closes). */
  onEscape?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const t = useSemiLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => filterCommands(items, query), [items, query]);
  const enabled = results.map((r, i) => (r.disabled ? -1 : i)).filter((i) => i >= 0);
  const groups = useMemo(() => {
    const out: { name: string; items: { it: CommandItem; index: number }[] }[] = [];
    results.forEach((it, index) => {
      const name = it.group ?? "";
      const g = out.find((x) => x.name === name) ?? (out.push({ name, items: [] }), out[out.length - 1]);
      g.items.push({ it, index });
    });
    return out;
  }, [results]);
  useEffect(() => setActive(enabled[0] ?? 0), [query]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const move = (dir: 1 | -1) => {
    if (!enabled.length) return;
    const k = enabled.indexOf(active);
    setActive(enabled[(k + dir + enabled.length) % enabled.length]);
  };
  const run = (it?: CommandItem) => it && !it.disabled && it.onSelect();
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Home: () => setActive(enabled[0] ?? 0),
      End: () => setActive(enabled[enabled.length - 1] ?? 0),
      Enter: () => run(results[active]),
      Escape: () => (query ? setQuery("") : onEscape?.()),
    };
    if (!keys[e.key] || (e.key === "Home" || e.key === "End" ? !e.ctrlKey && !e.metaKey && query !== "" : false)) return;
    e.preventDefault();
    if (e.key === "Escape" && !query) e.stopPropagation();
    keys[e.key]();
  };
  const optionId = (i: number) => `${base}-o-${i}`;
  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div className="flex items-center gap-2 px-3 h-12 border-b border-divider shrink-0">
        <Icon name="search" className="w-4 h-4 text-muted shrink-0" />
        <input
          role="combobox"
          aria-expanded
          aria-controls={`${base}-list`}
          aria-activedescendant={results[active] ? optionId(active) : undefined}
          aria-autocomplete="list"
          aria-label={placeholder ?? t.commandPlaceholder}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder ?? t.commandPlaceholder}
          className="flex-1 min-w-0 h-full bg-transparent text-ui text-contrast placeholder:text-muted outline-none"
        />
      </div>
      <div ref={listRef} id={`${base}-list`} role="listbox" aria-label={t.commandLabel} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1.5">
        {results.length === 0 && <div className="px-3 py-8 text-center text-ui text-muted">{emptyText ?? t.commandEmpty}</div>}
        {groups.map((g, gi) => (
          <div key={g.name || gi} role="group" aria-labelledby={g.name ? `${base}-g-${gi}` : undefined} className="py-1">
            {g.name && (
              <div id={`${base}-g-${gi}`} role="presentation" className="px-2 pb-1 text-caption font-medium text-muted">
                {g.name}
              </div>
            )}
            {g.items.map(({ it, index }) => (
              <div
                key={it.id}
                id={optionId(index)}
                role="option"
                data-idx={index}
                aria-selected={index === active}
                aria-disabled={it.disabled || undefined}
                onPointerMove={() => !it.disabled && setActive(index)}
                onClick={() => run(it)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 h-9 rounded-control text-ui cursor-pointer",
                  it.disabled ? "opacity-40 cursor-not-allowed" : index === active ? "bg-raised text-contrast" : "text-body",
                )}
              >
                {it.icon && <Icon name={it.icon} className="w-4 h-4 text-muted shrink-0" />}
                <span className="flex-1 min-w-0 truncate">{it.label}</span>
                {it.shortcut && <Kbd keys={it.shortcut} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The command palette over the page: a modal dialog near the top, closed by Escape, a click outside or a pick. */
export function CommandDialog({
  open,
  onOpenChange,
  items,
  placeholder,
  emptyText,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyText?: React.ReactNode;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useDialog(ref, open && mounted, () => onOpenChange(false));
  const wrapped = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        onSelect: () => {
          onOpenChange(false);
          it.onSelect();
        },
      })),
    [items, onOpenChange],
  );
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-dialog flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => onOpenChange(false)} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t.commandLabel}
        className="relative w-full max-w-xl max-h-[min(480px,70dvh)] flex flex-col bg-panel border border-line rounded-panel shadow-overlay overflow-hidden"
      >
        <Command items={wrapped} placeholder={placeholder} emptyText={emptyText} onEscape={() => onOpenChange(false)} autoFocus />
      </div>
    </div>,
    document.body,
  );
}
