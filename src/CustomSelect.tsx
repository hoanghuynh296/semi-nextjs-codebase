"use client";

// App-styled dropdown (docs/DESIGN_SYSTEM.md: never a native <select>, its OS popup ignores the theme).
// The list opens in a fixed-position layer under (or above) the button, so it is never clipped by a scrolling panel or a modal.
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

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
  /** toolbar = 34px toolbar control · field = full-width form field · inline = bare text inside a row ·
   *  bare = no trigger styling (the caller passes it in buttonClassName, e.g. the automation code chips) */
  variant?: "toolbar" | "field" | "inline" | "bare";
  disabled?: boolean;
  /** Extra classes on the button (e.g. a "modified value" colour). */
  buttonClassName?: string;
  id?: string;
  "aria-label"?: string;
  title?: string;
}

const TRIGGER: Record<NonNullable<CustomSelectProps["variant"]>, string> = {
  toolbar:
    "h-[34px] px-3 bg-panel border border-line rounded-lg text-[12px] font-medium text-body hover:border-line-hover",
  field:
    "w-full h-9 px-3 bg-field border border-line rounded-lg text-[13px] text-contrast hover:border-line-hover focus-visible:border-primary-500/50",
  inline: "w-full h-7 px-0 bg-transparent text-[12px] font-medium text-body hover:text-contrast",
  bare: "",
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; minWidth: number; maxHeight: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const block = variant === "field" || variant === "inline";

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
  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(Math.max(0, options.findIndex((o) => o.value === value)));
      } else setActive((a) => step(a, e.key === "ArrowDown" ? 1 : -1));
    } else if ((e.key === "Enter" || e.key === " ") && open && active >= 0) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${block ? "block w-full min-w-0" : "inline-block"} ${className}`}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        title={iconOnly && selected ? selected.label : title ?? selected?.title}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          setOpen((v) => !v);
          setActive(options.findIndex((o) => o.value === value));
        }}
        onKeyDown={onKey}
        className={`flex items-center justify-between gap-2 outline-none cursor-pointer transition select-none disabled:opacity-40 disabled:cursor-not-allowed ${TRIGGER[variant]} ${buttonClassName}`}
      >
        <span className={`flex items-center gap-1.5 min-w-0 ${block ? "flex-1" : variant === "bare" ? "" : "max-w-[130px] sm:max-w-[180px]"}`}>
          {selected?.icon}
          {!(iconOnly && selected?.icon) && (
            <span className={`truncate ${selected ? "" : "text-muted"}`}>{selected ? selected.label : placeholder}</span>
          )}
        </span>
        <Icon name="chevronDown" className={`${variant === "bare" ? "hidden" : ""} w-3.5 h-3.5 text-muted transition-transform duration-150 shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={popRef}
            id={listId}
            role="listbox"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
            className="fixed z-[10001] max-w-[calc(100vw-16px)] overflow-y-auto overscroll-contain bg-panel border border-line rounded-xl shadow-2xl p-1 flex flex-col gap-0.5"
          >
            {options.length === 0 && <div className="px-3 py-2 text-[12px] text-muted">{placeholder}</div>}
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const head = opt.group && opt.group !== options[i - 1]?.group;
              return (
                <React.Fragment key={`${opt.group ?? ""}\u0000${opt.value}`}>
                  {head && <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted truncate">{opt.group}</div>}
                  <button
                    type="button"
                    role="option"
                    data-idx={i}
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    title={opt.title}
                    onClick={() => pick(opt)}
                    onPointerEnter={() => setActive(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition cursor-pointer flex items-center justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-raised text-contrast font-medium"
                        : i === active
                        ? "bg-raised/70 text-contrast"
                        : "text-body hover:bg-raised hover:text-contrast"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {iconsInList && opt.icon}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && <Icon name="check" className="w-3.5 h-3.5 text-accent-fg shrink-0" />}
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
