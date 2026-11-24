"use client";

// Command palette: type to filter actions and places, ↑/↓ to move, Enter to run. Command is the inline list;
// CommandDialog opens it over the page (⌘K / Ctrl+K with useHotkey); CommandPalette is the app-wide "search or create"
// box (L1) with coloured action tiles, a key legend and ⌘↵ to open in a new tab, fed by the items pages register
// (useRegisterCommands). Matching ignores case and Vietnamese marks.
import React, { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icon, IconTile, type IconName, type TileTone } from "./Icon";
import { Kbd } from "./Kbd";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import { normalizeSearch } from "./listQuery";
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
  /** One short line under the label ("Nhà cung cấp · Đắk Lắk"). */
  hint?: string;
  /** Colour of the icon tile in a `size="lg"` list (actions); places and records stay grey. */
  tone?: TileTone;
  /** The address the item opens: ⌘↵ / Ctrl+↵ (and a middle or ⌘-click) open it in a new tab. Enter still runs `onSelect`. */
  href?: string;
}

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

/** Apple keyboards use ⌘ for app shortcuts; Ctrl+K there is "delete to end of line" in every text field. */
const isApple = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || navigator.userAgent);

/**
 * Register a global shortcut: ⌘ + key on Apple devices, Ctrl + key elsewhere (default K). The handler runs on keydown
 * and the browser action is prevented. It does nothing when a widget already handled the key (`preventDefault()`) or
 * focus is in a rich-text editor (contenteditable), which owns its own Ctrl/⌘ shortcuts.
 */
export function useHotkey(handler: () => void, key = "k") {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const apple = isApple();
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.shiftKey || e.key.toLowerCase() !== key.toLowerCase()) return;
      if (apple ? !e.metaKey || e.ctrlKey : !e.ctrlKey || e.metaKey) return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      ref.current();
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
  size = "md",
  initialQuery = "",
  label,
  inputEnd,
  footer,
  onOpenInNewTab,
}: {
  items: CommandItem[];
  placeholder?: string;
  /** Shown when nothing matches (default from the locale); a function gets the query. */
  emptyText?: React.ReactNode | ((query: string) => React.ReactNode);
  /** Escape on an empty query (CommandDialog closes). */
  onEscape?: () => void;
  autoFocus?: boolean;
  className?: string;
  /** `lg`: taller rows with an icon tile and the hint line, `text-overline` group headings (CommandPalette). */
  size?: "md" | "lg";
  /** The query when the list mounts. */
  initialQuery?: string;
  /** Accessible name of the listbox (default from the locale). */
  label?: string;
  /** Shown at the end of the input row (an Esc key cap). */
  inputEnd?: React.ReactNode;
  /** Shown under the list (a key legend). */
  footer?: React.ReactNode;
  /** ⌘↵ / Ctrl+↵ on an item with `href` (default: open `href` in a new tab). */
  onOpenInNewTab?: (item: CommandItem) => void;
}) {
  const t = useSemiLocale();
  const lg = size === "lg";
  const [query, setQuery] = useState(initialQuery);
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
  const newTab = (it?: CommandItem) => {
    if (!it || it.disabled) return;
    if (!it.href) return run(it);
    if (onOpenInNewTab) onOpenInNewTab(it);
    else {
      // an in-app address in a new tab (a link click, so popup blockers and the browser's own rules apply)
      const a = document.createElement("a");
      a.href = it.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    }
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      return newTab(results[active]);
    }
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
      <div className={cn("flex items-center border-b border-divider focus-within:border-focus shrink-0", lg ? "gap-3 px-4 h-14" : "gap-2 px-3 h-12")}>
        <Icon name="search" className={cn("text-muted shrink-0", lg ? "w-5 h-5" : "w-4 h-4")} />
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
          className={cn("flex-1 min-w-0 h-full bg-transparent text-strong placeholder:text-muted outline-none", lg ? "text-lead max-sm:text-input" : "text-ui max-sm:text-input")}
        />
        {inputEnd}
      </div>
      <div ref={listRef} id={`${base}-list`} role="listbox" aria-label={label ?? t.commandLabel} className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain", lg ? "p-2" : "p-1.5")}>
        {results.length === 0 && (
          <div className="px-3 py-8 text-center text-ui text-muted">{typeof emptyText === "function" ? emptyText(query) : (emptyText ?? t.commandEmpty)}</div>
        )}
        {groups.map((g, gi) => (
          <div key={g.name || gi} role="group" aria-labelledby={g.name ? `${base}-g-${gi}` : undefined} className="py-1">
            {g.name && (
              <div id={`${base}-g-${gi}`} role="presentation" className={lg ? "px-3 pt-2 pb-1 text-overline text-muted" : "px-2 pb-1 text-chrome font-medium text-muted"}>
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
                onClick={(e) => (e.metaKey || e.ctrlKey ? newTab(it) : run(it))}
                onAuxClick={(e) => e.button === 1 && it.href && newTab(it)}
                className={cn(
                  "flex items-center rounded-control text-ui cursor-pointer",
                  lg ? "gap-3 px-2.5 py-2" : cn("gap-2.5 px-2.5", it.hint ? "py-1.5" : "h-9"),
                  it.disabled ? "opacity-40 cursor-not-allowed" : index === active ? (lg ? "bg-tint-hover text-strong" : "bg-raised text-strong") : "text-body",
                )}
              >
                {it.icon &&
                  (!lg ? (
                    <Icon name={it.icon} className="w-4 h-4 text-muted shrink-0" />
                  ) : it.tone ? (
                    <IconTile name={it.icon} tone={it.tone} size="sm" />
                  ) : (
                    <span className="w-8 h-8 shrink-0 rounded-control bg-tint flex items-center justify-center text-muted">
                      <Icon name={it.icon} className="w-4 h-4" />
                    </span>
                  ))}
                {it.hint ? (
                  <span className="flex-1 min-w-0">
                    <span className={cn("block truncate", lg && "text-ui font-medium text-strong")}>{it.label}</span>
                    <span className="block text-chrome text-muted truncate">{it.hint}</span>
                  </span>
                ) : (
                  <span className={cn("flex-1 min-w-0 truncate", lg && "text-ui font-medium text-strong")}>{it.label}</span>
                )}
                {it.shortcut && <Kbd keys={it.shortcut} />}
              </div>
            ))}
          </div>
        ))}
      </div>
      {footer}
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

/* ── CommandPalette (L1) ──────────────────────────────────────────────────────────────────────────────────────── */

// Items registered by the mounted pages, and the open state of an uncontrolled palette: a tiny store, so a page
// adds its quick actions without a provider and the palette in the layout picks them up.
const registry = new Map<symbol, CommandItem[]>();
let registered: CommandItem[] = [];
let paletteOpen = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const EMPTY: CommandItem[] = [];

/**
 * Add a page's own items to the CommandPalette while the page is mounted ("Thêm nhà cung cấp" on the suppliers page,
 * the records it shows). Pass a memoised array; the items leave when the page unmounts.
 */
export function useRegisterCommands(items: CommandItem[]) {
  useEffect(() => {
    const key = Symbol("commands");
    registry.set(key, items);
    registered = [...registry.values()].flat();
    emit();
    return () => {
      registry.delete(key);
      registered = [...registry.values()].flat();
      emit();
    };
  }, [items]);
}

/** Open (or close) an uncontrolled CommandPalette from anywhere: a SearchPill, a "Tìm hoặc tạo" button. */
export function openCommandPalette(open = true) {
  paletteOpen = open;
  emit();
}

/**
 * The app-wide "search or create" box (L1): one dialog for search and quick actions, opened with ⌘K / Ctrl+K. Mount
 * it once in the root layout with the app's places; pages add their own items with useRegisterCommands. Groups get
 * `text-overline` headings, actions a coloured tile (`tone`), records a hint line; the footer shows the keys
 * (↑↓ select, ↵ open, ⌘↵ new tab for items with `href`, Esc close). Uncontrolled unless `open` is given.
 */
export function CommandPalette({
  items = EMPTY,
  open: openProp,
  onOpenChange,
  hotkey = "k",
  placeholder,
  emptyText,
  initialQuery,
  onOpenInNewTab,
}: {
  /** The app's own items (places, global actions). Items registered by pages are listed first. */
  items?: CommandItem[];
  /** Controlled open state; leave out to let the palette (⌘K, openCommandPalette) manage it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** ⌘ / Ctrl + this key toggles the palette; `false` binds nothing. @default "k" */
  hotkey?: string | false;
  placeholder?: string;
  emptyText?: React.ReactNode | ((query: string) => React.ReactNode);
  /** The query when it opens (a `?q=` deep link). */
  initialQuery?: string;
  onOpenInNewTab?: (item: CommandItem) => void;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fromPages = useSyncExternalStore(subscribe, () => registered, () => EMPTY);
  const own = useSyncExternalStore(subscribe, () => paletteOpen, () => false);
  const open = openProp ?? own;
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) openCommandPalette(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const openRef = useRef(open);
  openRef.current = open;
  useHotkey(() => hotkey && setOpen(!openRef.current), hotkey || "\u0000");
  useDialog(ref, open && mounted, () => setOpen(false));
  const all = useMemo(
    () =>
      [...fromPages, ...items].map((it) => ({
        ...it,
        onSelect: () => {
          setOpen(false);
          it.onSelect();
        },
      })),
    [fromPages, items, setOpen],
  );
  if (!open || !mounted) return null;
  const legend = (keys: string[], text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <Kbd keys={keys} /> {text}
    </span>
  );
  return createPortal(
    <div className="fixed inset-0 z-dialog flex items-start justify-center p-3 sm:p-4 pt-[8vh] sm:pt-[12vh]">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t.paletteLabel}
        className="relative w-full max-w-[640px] max-h-[min(560px,80dvh)] flex flex-col bg-panel-4 border border-line rounded-panel shadow-overlay overflow-hidden"
      >
        <Command
          items={all}
          size="lg"
          autoFocus
          initialQuery={initialQuery}
          placeholder={placeholder ?? t.palettePlaceholder}
          label={t.paletteLabel}
          emptyText={emptyText ?? t.paletteEmpty}
          onEscape={() => setOpen(false)}
          onOpenInNewTab={
            onOpenInNewTab &&
            ((it) => {
              setOpen(false);
              onOpenInNewTab(it);
            })
          }
          inputEnd={<Kbd className="max-sm:hidden">Esc</Kbd>}
          footer={
            <div className="max-sm:hidden flex items-center gap-4 h-10 px-4 border-t border-divider text-chrome text-muted shrink-0">
              {legend(["↑", "↓"], t.paletteSelect)}
              {legend(["↵"], t.paletteOpen)}
              {legend(["⌘", "↵"], t.paletteNewTab)}
              <span className="ml-auto">{legend(["Esc"], t.close)}</span>
            </div>
          }
        />
      </div>
    </div>,
    document.body,
  );
}
