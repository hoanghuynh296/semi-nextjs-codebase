"use client";

// Free-text input with suggestions (WAI-ARIA combobox): type to filter, ↑/↓ to move, Enter to pick, Escape to close.
// Supports optional `group` headings (same contract as CustomSelect), diacritic-aware search and IME-safe keys.
// A value that is not in the list is kept as typed (the "not listed" hint says it will be added on save).
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSemiLocale } from "./locale";
import { useField } from "./Field";
import { Icon } from "./Icon";
import { ensureFocusModality, FLOATING_LAYER } from "./a11y";
import { useAnchoredPosition } from "./floating";
import { normalizeSearch } from "./listQuery";
import { FIELD_INPUT } from "../styles/surfaces";
import { cn } from "../styles/utils";

export interface CustomComboboxOption {
  value: string;
  label?: string;
  /** Group heading the option is listed under (options of a group must be consecutive). */
  group?: string;
  disabled?: boolean;
}

interface CustomComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | CustomComboboxOption)[];
  placeholder?: string;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
}

export function CustomCombobox({
  value,
  onChange,
  options,
  placeholder: placeholderProp,
  required = false,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  disabled = false,
}: CustomComboboxProps) {
  ensureFocusModality();
  const t = useSemiLocale();
  const placeholder = placeholderProp ?? t.selectOrCreate;
  const field = useField();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  // the list is portaled with fixed positioning, so a scrolling panel or a modal never clips it
  const pos = useAnchoredPosition(containerRef, open, { minWidth: 0, gap: 6 });

  const normalizedOptions = useMemo<CustomComboboxOption[]>(
    () => options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt)),
    [options],
  );
  const qRaw = (value || "").trim();
  const q = normalizeSearch(qRaw);
  const filteredOptions = useMemo(
    () =>
      !q
        ? normalizedOptions
        : normalizedOptions.filter(
            (opt) => normalizeSearch(opt.value).includes(q) || (opt.label ? normalizeSearch(opt.label).includes(q) : false),
          ),
    [normalizedOptions, q],
  );
  const enabledIndices = useMemo(
    () => filteredOptions.map((opt, i) => (opt.disabled ? -1 : i)).filter((i) => i >= 0),
    [filteredOptions],
  );
  const groups = useMemo(() => {
    const out: { name: string; items: { opt: CustomComboboxOption; index: number }[] }[] = [];
    filteredOptions.forEach((opt, index) => {
      const name = opt.group ?? "";
      const prev = out[out.length - 1];
      if (prev && prev.name === name) prev.items.push({ opt, index });
      else out.push({ name, items: [{ opt, index }] });
    });
    return out;
  }, [filteredOptions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const el = e.target as Node;
      if (!containerRef.current?.contains(el) && !listRef.current?.contains(el)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) setActive(-1);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const pick = (opt: CustomComboboxOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        if (enabledIndices.length) setActive(e.key === "ArrowDown" ? enabledIndices[0] : enabledIndices[enabledIndices.length - 1]);
        return;
      }
      if (!enabledIndices.length) return;
      const posIdx = enabledIndices.indexOf(active);
      if (posIdx < 0) setActive(e.key === "ArrowDown" ? enabledIndices[0] : enabledIndices[enabledIndices.length - 1]);
      else setActive(enabledIndices[(posIdx + (e.key === "ArrowDown" ? 1 : -1) + enabledIndices.length) % enabledIndices.length]);
    } else if (e.key === "Enter" && open && active >= 0 && filteredOptions[active] && !filteredOptions[active].disabled) {
      e.preventDefault();
      pick(filteredOptions[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;

  const renderOption = (opt: CustomComboboxOption, i: number) => {
    const isSelected = opt.value.toLowerCase() === qRaw.toLowerCase();
    return (
      <div
        key={`${opt.group ?? ""}\u0000${opt.value}`}
        id={optionId(i)}
        data-idx={i}
        role="option"
        aria-selected={isSelected}
        aria-disabled={opt.disabled || undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => pick(opt)}
        onPointerEnter={() => !opt.disabled && setActive(i)}
        className={cn(
          "w-full text-left px-3 py-1.5 rounded-control text-ui transition-colors flex items-center justify-between gap-2",
          opt.disabled
            ? "opacity-40 cursor-not-allowed text-muted"
            : isSelected
              ? "bg-item-selected text-strong font-medium cursor-pointer"
              : i === active
                ? "bg-item-hover text-strong cursor-pointer"
                : "text-body hover:bg-item-hover hover:text-strong cursor-pointer",
        )}
      >
        <span className="truncate">{opt.label || opt.value}</span>
        {isSelected && <Icon name="check" className="w-3.5 h-3.5 text-strong shrink-0" />}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          id={id ?? field?.id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-label={ariaLabel}
          aria-describedby={describedBy ?? field?.describedBy}
          aria-invalid={(invalid ?? field?.invalid) || undefined}
          required={required || field?.required}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            // tabbing (or clicking) away closes the list; option clicks keep focus (mousedown is prevented)
            const next = e.relatedTarget as Node | null;
            if (!next || (!containerRef.current?.contains(next) && !listRef.current?.contains(next))) setOpen(false);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(FIELD_INPUT, "pr-8 aria-invalid:border-danger-fg aria-invalid:focus:border-danger-fg")}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2.5 p-1 text-muted hover:text-strong transition-hover cursor-pointer"
        >
          <Icon name="chevronDown" className={`w-3.5 h-3.5 [transition:transform_var(--motion-hover)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open &&
        pos &&
        createPortal(
          <div
            {...FLOATING_LAYER}
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel ?? placeholder}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.minWidth, maxHeight: Math.min(256, pos.maxHeight) }}
            className="fixed overflow-y-auto overscroll-contain bg-panel border border-line rounded-card shadow-overlay z-popover p-1 flex flex-col gap-0.5"
          >
            {filteredOptions.length === 0 ? (
              <div role="status" className="px-3 py-2 text-ui text-muted">
                {value ? t.notListed(value) : t.noOptions}
              </div>
            ) : (
              groups.map((g, gi) =>
                g.name ? (
                  <div key={`${g.name}-${gi}`} role="group" aria-labelledby={`${listId}-g-${gi}`} className="flex flex-col gap-0.5">
                    <div id={`${listId}-g-${gi}`} role="presentation" className="px-3 pt-2 pb-1 text-chrome font-medium text-muted truncate">
                      {g.name}
                    </div>
                    {g.items.map(({ opt, index }) => renderOption(opt, index))}
                  </div>
                ) : (
                  <React.Fragment key={`ungrouped-${gi}`}>{g.items.map(({ opt, index }) => renderOption(opt, index))}</React.Fragment>
                ),
              )
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
