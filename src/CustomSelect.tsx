"use client";

// App-styled dropdown (docs/DESIGN_SYSTEM.md: never a native <select>, its OS popup ignores the theme).
// The list opens in a fixed-position layer under (or above) the button, so it is never clipped by a scrolling panel or a modal.
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useSemiLocale } from "./locale";
import { useField } from "./Field";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { FLOATING_LAYER } from "./a11y";

export interface CustomSelectOption {
  value: string;
  label: string;
  /** Shown before the label of the selected option in the button (not in the list), e.g. a 16px <Icon />. */
  icon?: React.ReactNode;
  /** Group heading the option is listed under (options of a group must be consecutive). */
  group?: string;
  disabled?: boolean;
  /** Tooltip / second line text. */
  title?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  /** Which edge the option list lines up with (use "right" for a select at the right edge of the screen). */
  align?: "left" | "right";
  /** Show each option's icon in the list too (default: only on the button). */
  iconsInList?: boolean;
  /** The button shows only the selected option's icon (its label becomes the tooltip), e.g. the AI profile logo. */
  iconOnly?: boolean;
  /** toolbar = h-control toolbar control (34px) · field = full-width form field · inline = bare text inside a row ·
   *  bare = no trigger styling (the caller passes it in buttonClassName, e.g. the automation code chips) */
  variant?: "toolbar" | "field" | "inline" | "bare";
  disabled?: boolean;
  /** Extra classes on the button (e.g. a "modified value" colour). */
  buttonClassName?: string;
  id?: string;
  /** What the select chooses (e.g. "Sắp xếp") when no visible label names it. The button is announced as this name
   *  followed by the value it shows, so speech users can say what they see. */
  "aria-label"?: string;
  title?: string;
}

const TRIGGER: Record<NonNullable<CustomSelectProps["variant"]>, string> = {
  toolbar:
    "h-control pointer-coarse:max-sm:min-h-11 px-3 bg-field border border-field-line rounded-control text-ui font-medium text-body hover:text-strong focus:border-field-line-focus focus:bg-field-focus focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  field:
    "w-full h-field pointer-coarse:max-sm:min-h-11 px-3 bg-field border border-field-line rounded-control text-ui text-strong focus:border-field-line-focus focus:bg-field-focus focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:border-danger-fg aria-invalid:focus:border-danger-fg",
  inline: "w-full h-7 px-0 bg-transparent text-ui font-medium text-body hover:text-strong rounded-chip focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  bare: "",
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder: placeholderProp,
  className = "",
  align = "left",
  iconsInList = false,
  iconOnly = false,
  variant = "toolbar",
  disabled = false,
  buttonClassName = "",
  id,
  title,
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const t = useSemiLocale();
  const placeholder = placeholderProp ?? t.select;
  const field = useField();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; minWidth: number; maxHeight: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const block = variant === "field" || variant === "inline";
  // The button shows the chosen value; an aria-label alone would replace it, so speech users saying what they see
  // could not reach it (WCAG 2.5.3). The name is the label followed by the visible value instead.
  const showsText = !(iconOnly && selected?.icon);
  const shown = selected ? selected.label : placeholder;
  const name = ariaLabel && showsText && !ariaLabel.includes(shown) ? `${ariaLabel}: ${shown}` : ariaLabel;

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minWidth = Math.min(Math.max(r.width, 180), vw - 16);
    const left = align === "right" ? Math.max(8, r.right - minWidth) : Math.min(Math.max(8, r.left), vw - minWidth - 8);
    const below = vh - r.bottom - 8;
    const above = r.top - 8;
    if (below >= 240 || below >= above) setPos({ left, top: r.bottom + 4, minWidth, maxHeight: Math.min(320, below - 4) });
    else setPos({ left, bottom: vh - r.top + 4, minWidth, maxHeight: Math.min(320, above - 4) });
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  useEffect(() => {
    if (open && active >= 0) popRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const pick = (o: CustomSelectOption) => {
    if (o.disabled) return;
    onChange(o.value);
    setOpen(false);
    btnRef.current?.focus();
  };
  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i;
    return from;
  };
  // type-ahead: letters typed within 500 ms build a prefix; the next enabled option starting with it becomes active
  const typed = useRef({ text: "", at: 0 });
  const typeAhead = (ch: string, from: number) => {
    const now = Date.now();
    const text = (now - typed.current.at < 500 ? typed.current.text : "") + ch.toLowerCase();
    typed.current = { text, at: now };
    const n = options.length;
    const start = text.length > 1 ? Math.max(from, 0) : from + 1;
    for (let k = 0; k < n; k++) {
      const i = (start + k + n) % n;
      if (!options[i].disabled && options[i].label.toLowerCase().startsWith(text)) return i;
    }
    return -1;
  };
  const optionId = (i: number) => `${listId}-o-${i}`;
  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const current = Math.max(0, options.findIndex((o) => o.value === value));
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(current);
      } else setActive((a) => step(a, e.key === "ArrowDown" ? 1 : -1));
    } else if ((e.key === "Home" || e.key === "End") && open) {
      e.preventDefault();
      setActive(e.key === "Home" ? step(-1, 1) : step(options.length, -1));
    } else if ((e.key === "Enter" || e.key === " ") && open && active >= 0) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab" && open) {
      setOpen(false); // focus moves on as usual; the list does not stay open behind it
    } else if (e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const i = typeAhead(e.key, open ? active : current);
      if (i < 0) return;
      e.preventDefault();
      if (open) setActive(i);
      else onChange(options[i].value); // closed: like a native select, typing picks
    }
  };

  return (
    <div data-semi="CustomSelect" className={`relative ${block ? "block w-full min-w-0" : "inline-block"} ${className}`}>
      <button
        ref={btnRef}
        id={id ?? field?.id}
        type="button"
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        disabled={disabled}
        title={iconOnly && selected ? selected.label : title ?? selected?.title}
        aria-label={name}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        onClick={() => {
          setOpen((v) => !v);
          setActive(options.findIndex((o) => o.value === value));
        }}
        onKeyDown={onKey}
        className={`flex items-center justify-between gap-2 outline-none cursor-pointer transition-hover select-none disabled:opacity-40 disabled:cursor-not-allowed ${TRIGGER[variant]} ${buttonClassName}`}
      >
        <span className={`flex items-center gap-1.5 min-w-0 ${block ? "flex-1" : variant === "bare" ? "" : "max-w-[130px] sm:max-w-[180px]"}`}>
          {selected?.icon}
          {showsText && <span className={`truncate ${selected ? "" : "text-muted"}`}>{shown}</span>}
        </span>
        <Icon name="chevronDown" className={`${variant === "bare" ? "hidden" : ""} w-3.5 h-3.5 text-muted [transition:transform_var(--motion-hover)] motion-reduce:transition-none shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            {...FLOATING_LAYER}
            ref={popRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel ?? placeholder}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
            className="fixed z-popover max-w-[calc(100vw-16px)] overflow-y-auto overscroll-contain bg-panel border border-line rounded-card shadow-overlay p-1 flex flex-col gap-0.5"
          >
            {options.length === 0 && <div className="px-3 py-2 text-ui text-muted">{placeholder}</div>}
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const head = opt.group && opt.group !== options[i - 1]?.group;
              return (
                <React.Fragment key={`${opt.group ?? ""}\u0000${opt.value}`}>
                  {head && <div className="px-3 pt-2 pb-1 text-chrome font-medium text-muted truncate">{opt.group}</div>}
                  <button
                    type="button"
                    role="option"
                    id={optionId(i)}
                    tabIndex={-1}
                    data-idx={i}
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    title={opt.title}
                    onClick={() => pick(opt)}
                    onPointerEnter={() => setActive(i)}
                    className={`w-full text-left px-3 py-2 rounded-control text-ui transition-hover cursor-pointer flex items-center justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-item-selected text-strong font-medium"
                        : i === active
                        ? "bg-item-hover text-strong"
                        : "text-body hover:bg-item-hover active:bg-item-hover hover:text-strong"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {iconsInList && opt.icon}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && <Icon name="check" className="w-3.5 h-3.5 text-strong shrink-0" />}
                  </button>
                </React.Fragment>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
