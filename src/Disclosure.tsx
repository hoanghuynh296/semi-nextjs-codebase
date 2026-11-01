"use client";

// Show / hide content: Collapsible for one section, Accordion for a list of sections (FAQ, settings groups).
import React, { useId, useRef, useState } from "react";
import { Icon } from "./Icon";
import { FOCUS_RING, cn } from "../styles/utils";

/** Controlled when `open` is given, otherwise it keeps its own state from `defaultOpen`. */
function useOpenState(open: boolean | undefined, defaultOpen: boolean, onOpenChange?: (open: boolean) => void) {
  const [own, setOwn] = useState(defaultOpen);
  const value = open ?? own;
  return [value, (next: boolean) => (open === undefined ? setOwn(next) : undefined, onOpenChange?.(next))] as const;
}

/** One section that opens and closes under its trigger row. */
export function Collapsible({
  title,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
}: {
  /** The trigger row (text, optionally with an icon or a count). */
  title: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setOpen(!isOpen)}
        className={cn("w-full flex items-center gap-2 py-2 text-left text-ui font-medium text-contrast rounded-control", FOCUS_RING)}
      >
        <Icon name="chevronDown" className={cn("w-4 h-4 text-muted shrink-0 transition-transform", !isOpen && "-rotate-90")} />
        <span className="flex-1 min-w-0">{title}</span>
      </button>
      <div id={id} hidden={!isOpen} className="pl-6 pb-2 text-ui text-body">
        {children}
      </div>
    </div>
  );
}

export interface AccordionItem {
  key: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

/**
 * A list of sections, one (type="single", default) or several (type="multiple") open at a time. ↑/↓ move between
 * headers, Home / End jump; each header is a button inside a heading (level), its panel a labelled region.
 */
export function Accordion({
  items,
  type = "single",
  value,
  defaultValue = [],
  onChange,
  headingLevel = 3,
  className,
}: {
  items: AccordionItem[];
  type?: "single" | "multiple";
  /** Open item keys (controlled). */
  value?: string[];
  defaultValue?: string[];
  onChange?: (open: string[]) => void;
  /** Heading level of the headers in the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const [own, setOwn] = useState(defaultValue);
  const openKeys = value ?? own;
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const set = (next: string[]) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const toggle = (key: string) => {
    const isOpen = openKeys.includes(key);
    if (type === "single") set(isOpen ? [] : [key]);
    else set(isOpen ? openKeys.filter((k) => k !== key) : [...openKeys, key]);
  };
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const k = enabled.indexOf(i);
    const to = { ArrowDown: enabled[(k + 1) % enabled.length], ArrowUp: enabled[(k - 1 + enabled.length) % enabled.length], Home: enabled[0], End: enabled[enabled.length - 1] }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    refs.current[to]?.focus();
  };
  const H = `h${headingLevel}` as "h3";
  return (
    <div className={cn("divide-y divide-divider", className)}>
      {items.map((it, i) => {
        const isOpen = openKeys.includes(it.key);
        const hid = `${base}-h-${i}`;
        const pid = `${base}-p-${i}`;
        return (
          <div key={it.key}>
            <H className="m-0">
              <button
                ref={(el) => {
                  refs.current[i] = el;
                }}
                id={hid}
                type="button"
                aria-expanded={isOpen}
                aria-controls={pid}
                disabled={it.disabled}
                onClick={() => toggle(it.key)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  "w-full flex items-center gap-3 py-3 text-left text-ui font-medium text-contrast rounded-control disabled:opacity-40 disabled:cursor-not-allowed",
                  FOCUS_RING,
                )}
              >
                <span className="flex-1 min-w-0">{it.title}</span>
                <Icon name="chevronDown" className={cn("w-4 h-4 text-muted shrink-0 transition-transform", isOpen && "rotate-180")} />
              </button>
            </H>
            <div id={pid} role="region" aria-labelledby={hid} hidden={!isOpen} className="pb-3 text-ui text-body">
              {it.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
