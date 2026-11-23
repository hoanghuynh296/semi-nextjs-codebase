"use client";

// Free-text input with suggestions (WAI-ARIA combobox): type to filter, ↑/↓ to move, Enter to pick, Escape to close.
// A value that is not in the list is kept as typed (the "not listed" hint says it will be added on save).
import React, { useEffect, useId, useRef, useState } from "react";
import { useSemiLocale } from "./locale";
import { useField } from "./Field";
import { Icon } from "./Icon";
import { createPortal } from "react-dom";
import { FLOATING_LAYER } from "./a11y";
import { useAnchoredPosition } from "./floating";

interface Option {
  value: string;
  label?: string;
}

interface CustomComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | Option)[];
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

  const normalizedOptions: Option[] = options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));
  const q = (value || "").toLowerCase();
  const filteredOptions = normalizedOptions.filter(
    (opt) => opt.value.toLowerCase().includes(q) || (opt.label && opt.label.toLowerCase().includes(q)),
  );

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

  const pick = (opt: Option) => {
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const n = filteredOptions.length;
      if (!n) return;
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % n : (a - 1 + n) % n));
    } else if (e.key === "Enter" && open && active >= 0 && filteredOptions[active]) {
      e.preventDefault();
      pick(filteredOptions[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;

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
          className="w-full h-field bg-field border border-control-line hover:border-control-line-hover rounded-control pl-3 pr-8 text-ui max-sm:text-lead text-strong placeholder:text-muted focus:border-focus focus:ring-1 focus:ring-focus transition outline-none disabled:opacity-40 aria-invalid:border-danger-fg"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2.5 p-1 text-muted hover:text-strong transition cursor-pointer"
        >
          <Icon name="chevronDown" className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && pos && createPortal(
        <div
          {...FLOATING_LAYER}
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel ?? placeholder}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.minWidth, maxHeight: Math.min(224, pos.maxHeight) }}
          className="fixed overflow-y-auto overscroll-contain bg-panel border border-line rounded-control shadow-overlay z-popover p-1 flex flex-col gap-0.5"
        >
          {filteredOptions.length === 0 ? (
            <div role="status" className="px-3 py-2 text-ui text-muted">
              {value ? t.notListed(value) : t.noOptions}
            </div>
          ) : (
            filteredOptions.map((opt, i) => {
              const isSelected = opt.value.toLowerCase() === q;
              return (
                <div
                  key={opt.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                  onPointerEnter={() => setActive(i)}
                  className={`w-full text-left px-3 py-1.5 rounded-control text-ui transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-item-selected text-strong font-medium"
                      : i === active
                        ? "bg-raised text-strong"
                        : "text-body hover:bg-raised hover:text-strong"
                  }`}
                >
                  <span className="truncate">{opt.label || opt.value}</span>
                  {isSelected && <Icon name="check" className="w-3.5 h-3.5 text-strong shrink-0" />}
                </div>
              );
            })
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
