"use client";

// Searchable multi-select: chosen values show as removable chips, an add button ("Thêm" / "Add") opens a portaled
// popover with a quiet search field and a checkbox listbox. ↑/↓ move, Enter/Space toggle, Escape closes and returns
// focus; search is IME-safe (Vietnamese Telex) and diacritic-aware; supports `group` headings like CustomSelect.
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { useField } from "./Field";
import { Icon } from "./Icon";
import { ensureFocusModality, FLOATING_LAYER } from "./a11y";
import { useAnchoredPosition } from "./floating";
import { normalizeSearch } from "./listQuery";
import { useSemiLocale } from "./locale";
import { FIELD_INPUT } from "../styles/surfaces";
import { cn } from "../styles/utils";

export interface MultiComboboxOption {
  value: string;
  label: string;
  /** Group heading the option is listed under (options of a group must be consecutive). */
  group?: string;
  disabled?: boolean;
  /** Optional muted secondary line under the label. */
  hint?: string;
}

/** Alias of `MultiComboboxOption`. */
export type MultiOption = MultiComboboxOption;

/**
 * Searchable multi-select with removable chips and a portaled search + checkbox popover.
 * Supports option groups (`group`), diacritic-aware search and Vietnamese Telex IME composition.
 */
export function MultiCombobox({
  value,
  onChange,
  options,
  label,
  addLabel,
  searchPlaceholder,
  empty,
  disabled = false,
  id,
  className,
}: {
  /** Selected option values (controlled). */
  value: string[];
  onChange: (next: string[]) => void;
  options: MultiComboboxOption[];
  /** Accessible name of the field ("Mặt hàng cung ứng") when not inside a `Field`. */
  label?: string;
  /** Label on the button that opens the picker (defaults to "Thêm" / "Add"). */
  addLabel?: string;
  /** Placeholder inside the popover's search input. */
  searchPlaceholder?: string;
  /** Shown when nothing matches the search query. */
  empty?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  ensureFocusModality();
  const t = useSemiLocale();
  const field = useField();
  const auto = useId();
  const popId = `${auto}-pop`;
  const listId = `${auto}-list`;
  const btnId = `${auto}-btn`;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const pos = useAnchoredPosition(triggerRef, open, { minWidth: 300, gap: 6 });

  const chosen = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o]));
    return value.map((v) => map.get(v) ?? { value: v, label: v });
  }, [options, value]);

  const needle = normalizeSearch(q.trim());
  const shown = useMemo(
    () =>
      !needle
        ? options
        : options.filter(
            (o) =>
              normalizeSearch(o.label).includes(needle) ||
              normalizeSearch(o.value).includes(needle) ||
              (o.hint ? normalizeSearch(o.hint).includes(needle) : false),
          ),
    [options, needle],
  );
  const enabledIndices = useMemo(
    () => shown.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0),
    [shown],
  );
  const groups = useMemo(() => {
    const out: { name: string; items: { opt: MultiComboboxOption; index: number }[] }[] = [];
    shown.forEach((opt, index) => {
      const name = opt.group ?? "";
      const prev = out[out.length - 1];
      if (prev && prev.name === name) prev.items.push({ opt, index });
      else out.push({ name, items: [{ opt, index }] });
    });
    return out;
  }, [shown]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    setQ("");
    setActive(-1);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open || !pos) return;
    searchRef.current?.focus({ preventScroll: true });
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (!popRef.current?.contains(el) && !triggerRef.current?.contains(el)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) popRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const toggle = (v: string) => {
    if (disabled) return;
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  const addText = addLabel ?? t.addShort;
  const fieldName = label ?? t.select;
  const searchLabel = label ? `${t.search.replace(/…$/, "")} ${label.toLocaleLowerCase("vi")}` : t.search.replace(/…$/, "");

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ignore keys while an IME (Vietnamese Telex / VNI) is composing, including Safari's trailing keyCode 229 Enter.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!enabledIndices.length) return;
      const posIdx = enabledIndices.indexOf(active);
      if (posIdx < 0) setActive(e.key === "ArrowDown" ? enabledIndices[0] : enabledIndices[enabledIndices.length - 1]);
      else setActive(enabledIndices[(posIdx + (e.key === "ArrowDown" ? 1 : -1) + enabledIndices.length) % enabledIndices.length]);
    } else if ((e.key === "Home" || e.key === "End") && q === "") {
      if (!enabledIndices.length) return;
      e.preventDefault();
      setActive(e.key === "Home" ? enabledIndices[0] : enabledIndices[enabledIndices.length - 1]);
    } else if (e.key === "Enter") {
      if (active >= 0 && shown[active] && !shown[active].disabled) {
        e.preventDefault();
        toggle(shown[active].value);
      } else if (enabledIndices.length > 0) {
        e.preventDefault();
        toggle(shown[enabledIndices[0]].value);
      }
    } else if (e.key === " " && active >= 0 && shown[active] && !shown[active].disabled) {
      e.preventDefault();
      toggle(shown[active].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    }
  };

  const renderOption = (opt: MultiComboboxOption, i: number) => {
    const checked = value.includes(opt.value);
    const isActive = i === active;
    return (
      <div
        key={`${opt.group ?? ""}\u0000${opt.value}`}
        id={optionId(i)}
        data-idx={i}
        role="option"
        aria-selected={checked}
        aria-disabled={opt.disabled || undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => !opt.disabled && toggle(opt.value)}
        onPointerEnter={() => !opt.disabled && setActive(i)}
        className={cn(
          "w-full min-h-control px-2.5 py-1.5 rounded-control text-ui transition-colors flex items-center gap-2.5 select-none",
          opt.disabled
            ? "opacity-40 cursor-not-allowed text-muted"
            : isActive
              ? "bg-item-hover text-strong cursor-pointer"
              : checked
                ? "text-strong hover:bg-item-hover cursor-pointer"
                : "text-body hover:bg-item-hover hover:text-strong cursor-pointer",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "w-4 h-4 rounded-chip border flex items-center justify-center shrink-0 transition-colors",
            checked ? "bg-inverted border-transparent text-on-inverted" : "bg-field border-control-line",
          )}
        >
          {checked && <Icon name="check" className="w-3 h-3" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate">{opt.label}</span>
          {opt.hint && <span className="block text-chrome text-muted truncate">{opt.hint}</span>}
        </span>
      </div>
    );
  };

  return (
    <div
      role="group"
      aria-label={field ? undefined : label}
      aria-labelledby={field ? field.labelId : undefined}
      className={cn("flex flex-wrap items-center gap-2 min-w-0", className)}
    >
      {chosen.map((o) => (
        <span
          key={o.value}
          className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-raised border border-field-line text-ui text-strong max-w-full"
        >
          <span className="truncate">{o.label}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => toggle(o.value)}
            aria-label={t.removeChoice(o.label)}
            title={t.removeChoice(o.label)}
            className="w-6 h-6 rounded-full inline-flex items-center justify-center text-muted hover:text-strong hover:bg-item-hover transition-colors outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="close" className="w-3 h-3" />
          </button>
        </span>
      ))}
      <Button
        ref={triggerRef}
        id={id ?? field?.id ?? btnId}
        size="sm"
        variant="subtle"
        icon="plus"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-label={!field && label ? `${addText} ${label.toLocaleLowerCase("vi")}` : undefined}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        {addText}
      </Button>

      {open &&
        pos &&
        createPortal(
          <div
            {...FLOATING_LAYER}
            ref={popRef}
            id={popId}
            role="dialog"
            aria-label={fieldName}
            onBlur={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && !popRef.current?.contains(next) && !triggerRef.current?.contains(next)) close(false);
            }}
            style={{
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              width: pos.minWidth,
              maxHeight: Math.max(pos.maxHeight, 220),
            }}
            className="fixed z-popover bg-panel border border-line rounded-card shadow-overlay p-2 flex flex-col gap-2"
          >
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-expanded={true}
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={active >= 0 ? optionId(active) : undefined}
              aria-label={searchLabel}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(-1);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder ?? t.search}
              className={FIELD_INPUT}
            />
            <div
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={fieldName}
              className="max-h-60 overflow-y-auto overscroll-contain flex flex-col gap-0.5"
            >
              {shown.length === 0 ? (
                <div role="status" className="px-2.5 py-2 text-ui text-muted">
                  {empty ?? t.noResults}
                </div>
              ) : (
                groups.map((g, gi) =>
                  g.name ? (
                    <div key={`${g.name}-${gi}`} role="group" aria-labelledby={`${listId}-g-${gi}`} className="flex flex-col gap-0.5">
                      <div id={`${listId}-g-${gi}`} role="presentation" className="px-2.5 pt-2 pb-1 text-chrome font-medium text-muted truncate">
                        {g.name}
                      </div>
                      {g.items.map(({ opt, index }) => renderOption(opt, index))}
                    </div>
                  ) : (
                    <React.Fragment key={`ungrouped-${gi}`}>{g.items.map(({ opt, index }) => renderOption(opt, index))}</React.Fragment>
                  ),
                )
              )}
            </div>
            <div className="text-chrome text-muted px-2 pt-1.5 border-t border-divider tabular-nums">{t.selectedCount(value.length)}</div>
          </div>,
          document.body,
        )}
    </div>
  );
}
