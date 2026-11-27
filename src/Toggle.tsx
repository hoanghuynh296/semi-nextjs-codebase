"use client";

// On / off buttons: Toggle for one (bold, pin, mute), ToggleGroup for a set of icon or short-text options, one or
// several at a time (list / grid view, text styles).
import React, { useRef } from "react";
import { Icon, type IconName } from "./Icon";
import { FOCUS_RING, cn } from "../styles/utils";

// the BTN_HIT pair: at least 44 × 44px on a touch phone (pointer-coarse + max-sm), the drawn size elsewhere
const ITEM =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 min-w-control pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11 px-2.5 rounded-control text-ui font-medium transition-hover motion-safe:active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
const SEG_STATE = (on: boolean) => (on ? "bg-raised-2 text-strong" : "text-muted hover:text-strong hover:bg-item-hover");

/** One button that stays pressed (aria-pressed). Icon-only needs an aria-label. */
export function Toggle({
  pressed,
  onPressedChange,
  icon,
  disabled,
  className,
  children,
  ...aria
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
  title?: string;
}) {
  return (
    <button data-semi="Toggle"
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onPressedChange(!pressed)}
      className={cn(ITEM, "h-control", pressed ? "bg-item-selected text-strong" : "bg-subtle-button text-muted hover:text-strong hover:bg-item-hover", FOCUS_RING, className)}
      {...aria}
    >
      {icon && <Icon name={icon} className="w-4 h-4" />}
      {children}
    </button>
  );
}

export interface ToggleOption<T extends string> {
  key: T;
  label?: React.ReactNode;
  icon?: IconName;
  /** Accessible name, required when there is no label (icon only). */
  "aria-label"?: string;
  disabled?: boolean;
}

/**
 * A set of toggles on one track. type="single" (default) behaves like a radio group (←/→ move and select);
 * type="multiple" is a toolbar of independent toggles. Value is a list of keys in both cases.
 */
export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  type = "single",
  label,
  className,
}: {
  options: ToggleOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  type?: "single" | "multiple";
  /** Accessible name of the group. */
  label: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const pick = (key: T) => {
    if (type === "single") onChange([key]);
    else onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const k = enabled.indexOf(i);
    const to = { ArrowRight: enabled[(k + 1) % enabled.length], ArrowLeft: enabled[(k - 1 + enabled.length) % enabled.length], Home: enabled[0], End: enabled[enabled.length - 1] }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const el = refs.current[to];
    el?.focus({ preventScroll: true });
    // keep the focused option fully inside the track when it scrolls sideways (only the track moves, never the page)
    const track = el?.parentElement;
    if (el && track) {
      const [r, t] = [el.getBoundingClientRect(), track.getBoundingClientRect()];
      if (r.left < t.left) track.scrollLeft -= t.left - r.left + 4;
      else if (r.right > t.right) track.scrollLeft += r.right - t.right + 4;
    }
    if (type === "single") onChange([options[to].key]);
  };
  const single = type === "single";
  const current = options.findIndex((o) => value.includes(o.key));
  return (
    // Never wider than its container: labels do not wrap, so a narrow row scrolls sideways inside the track (no
    // scrollbar; focus() scrolls the focused option into view) instead of spilling past the page edge (#187).
    <div data-semi="ToggleGroup"
      role={single ? "radiogroup" : "toolbar"}
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5 bg-raised p-1 h-control pointer-coarse:max-sm:h-auto rounded-control shrink-0 max-w-full overflow-x-auto overscroll-x-contain no-scrollbar", className)}
    >
      {options.map((o, i) => {
        const on = value.includes(o.key);
        return (
          <button
            key={o.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role={single ? "radio" : undefined}
            aria-checked={single ? on : undefined}
            aria-pressed={single ? undefined : on}
            aria-label={o["aria-label"]}
            title={o["aria-label"]}
            disabled={o.disabled}
            tabIndex={single ? (i === (current >= 0 ? current : enabled[0]) ? 0 : -1) : 0}
            onClick={() => pick(o.key)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(ITEM, "h-full", SEG_STATE(on), FOCUS_RING)}
          >
            {o.icon && <Icon name={o.icon} className="w-4 h-4" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
