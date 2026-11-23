"use client";

// Page type "workspace" (#94 L12, docs/DESIGN_SYSTEM.md §4): a control panel on the left (segmented tabs, back + tool
// name, sections with a text-overline label and a counter, drop zones, steppers) with the main action pinned at its
// bottom, and the result on the right. Phones stack the panel above the result; the action stays at the bottom of the
// screen while the panel is in view.
//   <WorkspaceLayout header={<WorkspaceHeader backHref="/requests" title="YC-014" />} panel={…} action={…} result={…} />
import React, { useId } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn, FOCUS_RING } from "../styles/utils";

export function WorkspaceLayout({
  header,
  panel,
  action,
  result,
  panelLabel,
  resultLabel,
  className,
}: {
  /** Top of the panel: a `WorkspaceHeader` (back + tool name), segmented tabs above it when the tool has parts. */
  header?: React.ReactNode;
  /** The controls: `WorkspaceSection`s. Scrolls inside the panel on `lg+`. */
  panel: React.ReactNode;
  /** The main action (one primary Button, `fullWidth`, a secondary beside it at most). Pinned to the panel's bottom. */
  action: React.ReactNode;
  /** What the controls produce: a preview, a comparison, a list. Its headings start at h2 (the tool name is the h1). */
  result: React.ReactNode;
  /** Name of the panel region (default "Bảng điều khiển"). */
  panelLabel?: string;
  /** Name of the result region (default "Kết quả"). */
  resultLabel?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  return (
    <div data-page-type="workspace" className={cn("flex flex-col lg:flex-row lg:items-start gap-group", className)}>
      <section
        aria-label={panelLabel ?? t.workspacePanel}
        className="lg:w-[380px] shrink-0 flex flex-col bg-panel-3 rounded-panel lg:sticky lg:top-4 lg:max-h-[calc(100dvh-3rem)] min-h-0"
      >
        {header && <div className="px-4 pt-4 pb-2 shrink-0">{header}</div>}
        <div className={cn("lg:flex-1 min-h-0 lg:overflow-y-auto lg:overscroll-contain px-4 pb-4 flex flex-col gap-section", !header && "pt-4")}>{panel}</div>
        <div className="sticky bottom-[var(--semi-bottom-bar,0px)] z-sticky shrink-0 p-4 pb-[var(--semi-bottom-pad,max(1rem,env(safe-area-inset-bottom)))] lg:pb-4 border-t border-divider bg-panel-3 rounded-b-panel">
          {action}
        </div>
      </section>
      <section aria-label={resultLabel ?? t.workspaceResult} className="flex-1 min-w-0 flex flex-col gap-section">
        {result}
      </section>
    </div>
  );
}

/** Back + tool name (+ one meta line) at the top of the workspace panel; `tabs` (a `ToggleGroup`) sit above it. */
export function WorkspaceHeader({
  title,
  description,
  backHref,
  backLabel,
  onBack,
  tabs,
  headingLevel = 1,
}: {
  /** The tool or record name ("YC-014 Tiêu đen cho Seoul Spice"). The page's h1 by default. */
  title: React.ReactNode;
  /** One muted line under the title (due date, owner). */
  description?: React.ReactNode;
  /** Where the round back button goes (a `next/link`). */
  backHref?: string;
  /** Back without a URL (closes the tool); ignored when `backHref` is set. */
  onBack?: () => void;
  /** Accessible name of the back button: where it goes ("Về Mua hàng"). Default "Quay lại". */
  backLabel?: string;
  /** Segmented tabs of the tool's parts, full width above the title (`<ToggleGroup className="w-full" …/>`). */
  tabs?: React.ReactNode;
  /** 1 (default): the tool name is the page title. 2 when the page already has an h1. */
  headingLevel?: 1 | 2;
}) {
  const t = useSemiLocale();
  const H = `h${headingLevel}` as const;
  const label = backLabel ?? t.back;
  const round = cn("w-8 h-8 shrink-0 rounded-full bg-tint text-strong hover:bg-tint-hover flex items-center justify-center", FOCUS_RING);
  return (
    <div className="flex flex-col gap-3">
      {tabs}
      <div className="flex items-center gap-2 min-w-0">
        {backHref ? (
          <Link href={backHref} aria-label={label} title={label} className={round}>
            <Icon name="back" className="w-4 h-4" />
          </Link>
        ) : onBack ? (
          <button type="button" onClick={onBack} aria-label={label} title={label} className={round}>
            <Icon name="back" className="w-4 h-4" />
          </button>
        ) : null}
        <div className="min-w-0">
          <H className="text-lead font-semibold text-strong truncate">{title}</H>
          {description && <p className="text-ui text-muted truncate">{description}</p>}
        </div>
      </div>
    </div>
  );
}

/** A section of the workspace panel: a `text-overline` label, a counter ("3/8") and an optional action on its right. */
export function WorkspaceSection({
  label,
  count,
  max,
  action,
  children,
  className,
}: {
  /** Section name in sentence case ("Mặt hàng"); shown in `text-overline`. */
  label: string;
  /** How many items the section holds. */
  count?: number;
  /** The limit, shown as "count/max". */
  max?: number;
  /** A small text button on the right ("Thêm"). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={cn("flex flex-col gap-2 min-w-0", className)}>
      <div className="flex items-center gap-2 min-h-6">
        <span id={id} className="text-overline text-muted">
          {label}
        </span>
        {count !== undefined && (
          <span className="text-chrome text-muted tabular-nums">
            {count}
            {max !== undefined ? `/${max}` : ""}
          </span>
        )}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children}
    </div>
  );
}

/**
 * − value + for small counts (quantities, copies, seats). The value is a `spinbutton`: ↑ / → add `step`, ↓ / ← take
 * it away, Page Up / Page Down move ten steps, Home / End go to `min` / `max`. The − + buttons are for pointer and
 * touch (out of the Tab order: the keys do the same). Free typing of large numbers is `NumberInput`.
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  unit,
  disabled = false,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** What is counted, lower case ("số tấn tiêu đen"): names the value and the buttons ("Giảm số tấn tiêu đen"). */
  label: string;
  /** Shown after the value and read with it ("12 tấn"). */
  unit?: string;
  disabled?: boolean;
  className?: string;
}) {
  const t = useSemiLocale();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const set = (v: number) => {
    const next = clamp(v);
    if (!disabled && next !== value) onChange(next);
  };
  const text = `${t.number(value)}${unit ? ` ${unit}` : ""}`;
  const onKey = (e: React.KeyboardEvent) => {
    const to = {
      ArrowUp: value + step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowLeft: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    set(to);
  };
  const btn = "w-9 h-9 shrink-0 rounded-control flex items-center justify-center text-strong hover:bg-tint-hover disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed";
  return (
    <div className={cn("flex items-center gap-1 h-11 px-1 rounded-control bg-tint", disabled && "opacity-60", className)}>
      <button type="button" tabIndex={-1} className={btn} onClick={() => set(value - step)} disabled={disabled || value <= min} aria-label={t.decrease(label)} title={t.decrease(label)}>
        <Icon name="minus" className="w-4 h-4" />
      </button>
      <span
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text}
        aria-disabled={disabled || undefined}
        onKeyDown={onKey}
        className={cn("flex-1 min-w-0 h-9 rounded-control flex items-center justify-center text-ui font-semibold text-strong tabular-nums truncate", FOCUS_RING)}
      >
        {text}
      </span>
      <button type="button" tabIndex={-1} className={btn} onClick={() => set(value + step)} disabled={disabled || value >= max} aria-label={t.increase(label)} title={t.increase(label)}>
        <Icon name="plus" className="w-4 h-4" />
      </button>
    </div>
  );
}
