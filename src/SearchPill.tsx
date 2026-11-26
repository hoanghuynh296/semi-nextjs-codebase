"use client";

// Search and filters (#99, C-032 L2 + L17; 1.0 #150): the sticky context bar of a list page (layout-pin on md+,
// focus-pin in 250ms ease-out, gesture-aware unpin, pinned BarActions slot) and its wide pill search.
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Menu, Tooltip } from "./Overlay";
import { useSemiLocale } from "./locale";
import { useStickyBarPin } from "./stickyBar";
import { STICKY_TOOLBAR } from "../styles/surfaces";
import { cn } from "../styles/utils";
import { holdPending, subscribeUrl } from "./urlState";

/** A sort choice shown by FilterChipRow / PhoneFilterBar (a menu) and FilterPanel (a row of chips). */
export interface SortDef {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** One page action shown inside `SearchPill` via `BarActions` while `StickyContextBar` is pinned. */
export interface BarAction {
  key: string;
  label: string;
  icon: IconName;
  onSelect?: () => void;
  /** Marks the page's main action (always placed last, on the right, matching the title row). */
  primary?: boolean;
  /**
   * Button variant when shown directly in the bar. Defaults to `"inverse"` for `primary` actions (matching content-card
   * title rows) and `"ghost"` for secondary actions. Pass `"primary"` only if the page's title-row action itself is the
   * brand primary button.
   */
  variant?: "inverse" | "primary" | "subtle" | "ghost";
  disabled?: boolean;
}

/**
 * Page actions that move inside `SearchPill`'s `trailing` slot while `StickyContextBar` is pinned (`data-stuck`) and
 * hide while the search field has focus (`data-searching`, 150ms fade, out of the accessibility tree and taking zero
 * layout space when hidden so the `"/"` shortcut hint never shifts).
 *
 * Always renders at most **2 slots**, in the title row's order (`[•••][main action]`, 8px apart, last button inset
 * matching the `"/"` hint): with more than two actions (or any `menu` items), the main action stays on the right and
 * the rest collapse into `•••` on the left.
 */
export function BarActions({
  actions,
  menu,
  moreLabel,
  className,
}: {
  /** Primary and secondary page actions (in title-row order: secondary left, `primary` last). */
  actions: BarAction[];
  /** Extra overflow items always placed inside the `•••` menu. */
  menu?: BarAction[];
  /** Accessible name and tooltip of the `•••` overflow button (default locale `moreActions`). */
  moreLabel?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const hasMenu = Boolean(menu && menu.length > 0);
  if (!actions.length && !hasMenu) return null;
  const ordered = [...actions.filter((a) => !a.primary), ...actions.filter((a) => a.primary)];
  const hasOverflow = hasMenu || ordered.length > 2;
  const rest = [...(menu ?? []), ...(hasOverflow && ordered.length > 1 ? ordered.slice(0, -1) : [])];
  const shown = hasOverflow ? ordered.slice(-1) : ordered;
  const overflowLabel = moreLabel ?? t.moreActions;

  return (
    <div data-semi="BarActions" data-bar-actions="" className={cn("semi-bar-actions", className)}>
      {rest.length > 0 && (
        <Menu
          label={overflowLabel}
          items={rest.map((a) => ({
            label: a.label,
            icon: a.icon,
            disabled: a.disabled,
            onSelect: a.onSelect,
          }))}
          trigger={
            <Tooltip content={overflowLabel}>
              <Button size="sm" variant="ghost" iconOnly icon="more" aria-label={overflowLabel} />
            </Tooltip>
          }
        />
      )}
      {shown.map((a) => (
        <Tooltip key={a.key} content={a.label}>
          <Button
            size="sm"
            variant={a.variant ?? (a.primary ? "inverse" : "ghost")}
            iconOnly
            icon={a.icon}
            aria-label={a.label}
            disabled={a.disabled}
            onClick={a.onSelect}
          />
        </Tooltip>
      ))}
    </div>
  );
}

/**
 * The search and filter bar of a list page, pinned to the top of the scrolling content while the rows scroll under it.
 *
 * Pin behaviour (#150):
 * - Pins when the scroller scrolls past the bar, or when the search text field gets focus (250ms ease-out, instant
 *   under reduced motion, cancelled by wheel/touch; works on short lists too; chips/sort/view buttons do not pin).
 * - From `md` (768px), pins by layout: the scroller's exact scroll range equals `--sticky-pin` and the list area (or
 *   each `ListReaderLayout` panel) scrolls independently with `overscroll-behavior: contain`. Below `md`, keeps native
 *   touch scrolling.
 * - One upward gesture never unpins, with or without layout-pin (#207): it stops at the pin. Only a new upward wheel
 *   gesture, after a 400ms stop at the pin with the list at its top, unpins; momentum, flings and slow trackpad
 *   pauses (up to ~350ms) stay one gesture.
 * - Exposes `data-stuck` and `data-searching` on the bar and `--sticky-pin` / `--sticky-view` on the scroller, clearing
 *   them on unmount. The pin and `data-stuck` are measured from the scroller's padding edge (where sticky children stick).
 * - Never writes `scrollTop` while the browser scrolls natively (#193): holds are decided on the first wheel event of a
 *   gesture. Without layout-pin (below `md`, or a scroller outside `AppShell`), while pinned every wheel gesture over
 *   the page is driven by the bar from its first event (eased, clamped at the pin), so it never passes the pin.
 */
export function StickyContextBar({
  children,
  label,
  pin = true,
  className,
}: {
  /** Usually SearchPill (with optional BarActions in `trailing`), then FilterChipRow (PhoneFilterBar on phones). The list sits 16px under the filter row. */
  children: React.ReactNode;
  /** Accessible name of the region ("Tìm và lọc khách hàng"); leave it out when the bar holds only a search. */
  label?: string;
  /** Enable trackpad-proven layout pinning, focus-pin and `data-stuck` / `data-searching` state (default `true`). */
  pin?: boolean;
  className?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  useStickyBarPin(barRef, pin);
  // STICKY_TOOLBAR has py-2.5 (10px bottom padding) + -my-2.5; mb-1.5 (6px) leaves 16px from the filter row to the list.
  return (
    <div data-semi="StickyContextBar"
      ref={barRef}
      data-sticky-bar=""
      role={label ? "search" : undefined}
      aria-label={label}
      className={cn(STICKY_TOOLBAR, "shrink-0 flex flex-col gap-2 mb-1.5", className)}
    >
      {children}
    </div>
  );
}

/**
 * The wide pill search of a list page: one per page, it feeds the list (or DataTable). Typing calls `onChange` after
 * `debounce` ms; the clear button and Escape clear at once. A history push of useFilterParams / useDetailParam /
 * openDetail during the debounce sends the pending text first, so the query stays on the entry it was typed on. `focusKey` ("/") focuses it from anywhere on the page
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
  /**
   * Gets the text after the debounce. For a query in the URL write it at once with
   * `useFilterParams().setParams({ q: v }, "replace")`: a push during the debounce (opening a row, a filter chip) then
   * keeps it on the list's entry. `router.replace`, nuqs or state + an effect land after that push.
   */
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
  /** Extra tools at the right end (pinned `<BarActions />`, image search, voice). */
  trailing?: React.ReactNode;
  className?: string;
}) {
  const t = useSemiLocale();
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // the pending send: held by the shared URL state, so a push (opening a row, a filter chip) sends it first onto the
  // current entry instead of it replacing the pushed one late (#128); the path it was typed on
  const pending = useRef<{ release: () => void; path: string } | null>(null);
  const sent = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current?.release();
    pending.current = null;
  };
  // the value changed from outside (back / forward, a "Xoá lọc" that also clears the query): show it
  useEffect(() => {
    if (value !== sent.current) {
      // a pending debounced send would overwrite what came from outside (Back / Forward restoring the URL)
      cancel();
      sent.current = value;
      setText(value);
    }
  }, [value]);
  // another route (a search in a layout, a Link clicked while typing): the text belongs to the page it was typed on
  useEffect(
    () =>
      subscribeUrl(() => {
        if (pending.current && pending.current.path !== window.location.pathname) cancel();
      }),
    [],
  );
  useEffect(() => cancel, []);
  const emit = (next: string, now = false) => {
    cancel();
    const path = window.location.pathname;
    const send = () => {
      cancel();
      if (window.location.pathname !== path) return;
      sent.current = next;
      onChangeRef.current(next);
    };
    if (now || debounce <= 0) send();
    else {
      timer.current = setTimeout(send, debounce);
      pending.current = { release: holdPending(send), path };
    }
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
    <div data-semi="SearchPill" data-field-frame="" className={cn("flex items-center gap-2 h-11 pl-4 pr-1.5 rounded-full bg-field border border-field-line focus-within:border-field-line-focus focus-within:bg-field-focus has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus transition-colors", className)}>
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
        className="flex-1 min-w-0 h-full bg-transparent outline-none text-ui max-sm:text-input text-strong placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          onClick={clear}
          aria-label={t.clearSearch}
          title={t.clearSearch}
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-muted hover:text-strong hover:bg-tint-hover outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      ) : (
        hint && (
          <kbd aria-hidden className="max-sm:hidden inline-flex h-6 min-w-6 px-1.5 mr-1.5 items-center justify-center rounded-chip border border-line text-chrome font-medium text-body font-sans">
            {hint}
          </kbd>
        )
      )}
      {trailing}
    </div>
  );
}
