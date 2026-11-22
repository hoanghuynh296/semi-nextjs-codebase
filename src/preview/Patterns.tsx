"use client";

// PREVIEW (#94 L10, L12, L13, L15, L16): hover card actions, the "workspace" page type, the guided empty state,
// inline input hints, content-shaped skeletons.
import React, { useMemo, useRef, useState } from "react";
import { Icon, IconTile, type IconName, type TileTone } from "../Icon";
import { Menu, type MenuItem } from "../Overlay";
import { Skeleton } from "../Skeleton";
import { cn } from "../../styles/utils";

/* ── L10 ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Actions on a card of a card / media grid: they appear on hover or keyboard focus (the grid stays clean); on touch
 * screens (no hover) only an always-visible ⋯ shows, holding the same actions. Lists and tables keep the row ⋯ (C-025).
 */
export function CardActions({
  actions,
  menu,
  label,
  className,
}: {
  actions: { icon: IconName; label: string; onClick: () => void }[];
  menu?: MenuItem[];
  /** Accessible name of the ⋯ menu ("Thao tác với Gia vị Tây Nguyên"). */
  label: string;
  className?: string;
}) {
  const btn =
    "w-8 h-8 rounded-full bg-panel-4/90 backdrop-blur text-contrast hover:bg-panel-4 shadow-card flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-focus";
  const all: MenuItem[] = [...actions.map((a) => ({ label: a.label, icon: a.icon, onSelect: a.onClick })), ...(menu ?? [])];
  return (
    <div className={cn("absolute top-2 right-2 flex gap-1.5 z-10", className)}>
      <div className="hidden [@media(hover:hover)]:flex gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={(e) => (e.stopPropagation(), a.onClick())} aria-label={a.label} title={a.label} className={btn}>
            <Icon name={a.icon} className="w-4 h-4" />
          </button>
        ))}
        {menu && menu.length > 0 && <Menu label={label} items={menu} trigger={<button type="button" aria-label={label} className={btn}><Icon name="more" className="w-4 h-4" /></button>} />}
      </div>
      <div className="[@media(hover:hover)]:hidden">
        <Menu label={label} items={all} trigger={<button type="button" aria-label={label} className={btn}><Icon name="more" className="w-4 h-4" /></button>} />
      </div>
    </div>
  );
}

/* ── L12 ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Page type "workspace": a left control panel (segmented tabs, back + tool name, section labels with counters, drop
 * zones, steppers) with a sticky main action at its bottom; the result area on the right. Phones stack them, with the
 * main action pinned to the bottom of the screen.
 */
export function WorkspaceLayout({
  header,
  panel,
  action,
  result,
}: {
  header?: React.ReactNode;
  panel: React.ReactNode;
  action: React.ReactNode;
  result: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:h-[calc(100dvh-16px)] p-0 lg:p-2">
      <section className="lg:w-[380px] shrink-0 flex flex-col bg-panel-3 lg:rounded-panel min-h-0" aria-label="Bảng điều khiển">
        {header && <div className="px-4 pt-4 pb-2 shrink-0">{header}</div>}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-5">{panel}</div>
        <div className="sticky bottom-0 shrink-0 p-4 border-t border-divider bg-panel-3 lg:rounded-b-panel pb-[max(16px,env(safe-area-inset-bottom))]">{action}</div>
      </section>
      <section className="flex-1 min-w-0 min-h-0 lg:overflow-y-auto p-4 sm:p-6" aria-label="Kết quả">
        {result}
      </section>
    </div>
  );
}

/** A section of the workspace panel: small uppercase label with a counter ("Mặt hàng 3/8"). */
export function WorkspaceSection({
  label,
  count,
  max,
  action,
  children,
}: {
  label: string;
  count?: number;
  max?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 min-h-6">
        <span className="text-caption font-semibold uppercase tracking-wide text-muted">{label}</span>
        {count !== undefined && (
          <span className="text-caption text-muted tabular-nums">
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

/** Stepper (− value +) for small counts in a workspace panel. */
export function Stepper({ value, onChange, min = 0, max = 99, label, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; unit?: string }) {
  const b = "w-9 h-9 rounded-control flex items-center justify-center text-contrast hover:bg-tint-hover disabled:opacity-40";
  return (
    <div className="flex items-center gap-1 h-11 px-1 rounded-control bg-tint" role="group" aria-label={label}>
      <button type="button" className={b} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Giảm ${label}`}>
        <Icon name="minus" className="w-4 h-4" />
      </button>
      <span className="flex-1 text-center text-ui font-semibold text-contrast tabular-nums" aria-live="polite">
        {value}
        {unit ? ` ${unit}` : ""}
      </span>
      <button type="button" className={b} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Tăng ${label}`}>
        <Icon name="plus" className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Drop zone tile of a workspace panel. */
export function DropZone({ icon = "upload", title, hint, onClick }: { icon?: IconName; title: string; hint?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-card border border-dashed border-line text-center hover:border-line-hover hover:bg-tint transition outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Icon name={icon} className="w-5 h-5 text-muted" />
      <span className="text-label font-medium text-contrast">{title}</span>
      {hint && <span className="text-caption text-muted">{hint}</span>}
    </button>
  );
}

/* ── L13 ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

export interface GuideStep {
  title: string;
  body: string;
  icon: IconName;
}

export interface TemplateGroup {
  category: string;
  seeAllLabel?: string;
  onSeeAll?: () => void;
  items: { title: string; hint: string; icon: IconName; tone?: TileTone; onClick?: () => void }[];
}

/** L13: first use: a step carousel ("1 / 4", full tutorial) and ready templates by category, each row with See all. */
export function GuidedEmptyState({
  title,
  steps,
  tutorial,
  templates,
  action,
}: {
  title: string;
  steps: GuideStep[];
  tutorial?: { label: string; href: string };
  templates?: TemplateGroup[];
  action?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const s = steps[i];
  const nav = "w-8 h-8 rounded-full bg-tint text-contrast hover:bg-tint-hover flex items-center justify-center disabled:opacity-40";
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-panel bg-card p-5 sm:p-6 flex flex-col gap-5" aria-label={title}>
        <div className="flex items-center gap-3">
          <h2 className="flex-1 text-title font-title font-semibold text-contrast">{title}</h2>
          {tutorial && (
            <a href={tutorial.href} className="hidden sm:inline-flex items-center gap-1 text-label font-medium text-accent-fg hover:underline">
              {tutorial.label}
              <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5 items-center">
          <div className="aspect-[16/10] rounded-card bg-panel-2 flex items-center justify-center">
            <IconTile name={s.icon} size="lg" tone="gray" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-caption font-semibold uppercase tracking-wide text-muted tabular-nums">
              Bước {i + 1} / {steps.length}
            </span>
            <h3 className="text-ui-lg font-semibold text-contrast">{s.title}</h3>
            <p className="text-ui text-body">{s.body}</p>
            <div className="flex items-center gap-2 pt-1">
              <button type="button" className={nav} onClick={() => setI(i - 1)} disabled={i === 0} aria-label="Bước trước">
                <Icon name="back" className="w-4 h-4" />
              </button>
              <button type="button" className={nav} onClick={() => setI(i + 1)} disabled={i === steps.length - 1} aria-label="Bước sau">
                <Icon name="chevron" className="w-4 h-4" />
              </button>
              <div className="flex-1" />
              {action}
            </div>
          </div>
        </div>
      </section>
      {templates?.map((g) => (
        <section key={g.category} className="flex flex-col gap-3" aria-label={g.category}>
          <div className="flex items-center px-1">
            <h3 className="flex-1 text-ui font-semibold text-contrast">{g.category}</h3>
            {g.onSeeAll && (
              <button type="button" onClick={g.onSeeAll} className="text-label font-medium text-muted hover:text-contrast inline-flex items-center gap-1">
                {g.seeAllLabel ?? "Xem tất cả"}
                <Icon name="chevron" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {g.items.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={t.onClick}
                className="flex items-start gap-3 p-4 rounded-card bg-card text-left hover:bg-tint-hover transition outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <IconTile name={t.icon} tone={t.tone ?? "gray"} size="sm" />
                <span className="min-w-0">
                  <span className="block text-label font-semibold text-contrast">{t.title}</span>
                  <span className="block text-caption text-muted">{t.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ── L15 ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

export interface HintToken {
  value: string;
  label: string;
  hint?: string;
  icon?: IconName;
}

/**
 * L15: a text area with an inline hint ("Gõ @ để nhắc tới …, / để chèn mẫu") and a suggestion list when the word being
 * typed starts with a trigger. ↑/↓ move, Enter / Tab insert, Escape closes the list.
 */
export function HintTextarea({
  value,
  onChange,
  label,
  placeholder,
  triggers,
  rows = 4,
  forceTrigger,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  triggers: { char: "@" | "/"; hint: string; items: HintToken[] }[];
  rows?: number;
  /** Preview only: show this trigger's list as if just typed. */
  forceTrigger?: "@" | "/";
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const word = useMemo(() => {
    const m = /(^|\s)([@/])([^\s]*)$/.exec(value);
    return m ? { char: m[2] as "@" | "/", q: m[3].toLowerCase() } : forceTrigger ? { char: forceTrigger, q: "" } : null;
  }, [value, forceTrigger]);
  const trig = word && triggers.find((t) => t.char === word.char);
  const matches = trig && !dismissed ? trig.items.filter((i) => i.label.toLowerCase().includes(word!.q) || i.value.toLowerCase().includes(word!.q)) : [];
  const insert = (t: HintToken) => {
    const next = value.replace(/([@/])([^\s]*)$/, t.value + " ");
    onChange(forceTrigger && !/([@/])([^\s]*)$/.test(value) ? `${value}${t.value} ` : next);
    setActive(0);
    ref.current?.focus();
  };
  return (
    <div className="relative">
      <div className="rounded-card bg-tint focus-within:ring-2 focus-within:ring-focus">
        <textarea
          ref={ref}
          value={value}
          rows={rows}
          aria-label={label}
          placeholder={placeholder}
          onChange={(e) => {
            setDismissed(false);
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (!matches.length) return;
            if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, matches.length - 1)));
            else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
            else if (e.key === "Enter" || e.key === "Tab") (e.preventDefault(), insert(matches[active]));
            else if (e.key === "Escape") setDismissed(true);
          }}
          className="block w-full resize-none bg-transparent outline-none px-4 pt-3 text-ui text-contrast placeholder:text-muted"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2.5 pt-1 text-caption text-muted">
          <Icon name="sparkles" className="w-3.5 h-3.5" />
          {triggers.map((t) => (
            <span key={t.char}>
              Gõ <kbd className="px-1 rounded-chip bg-tint-hover text-contrast font-sans">{t.char}</kbd> {t.hint}
            </span>
          ))}
        </div>
      </div>
      {matches.length > 0 && (
        <div role="listbox" aria-label={trig!.hint} className="absolute left-2 right-2 sm:right-auto sm:w-80 top-full mt-1 z-popover bg-panel-4 border border-line rounded-card shadow-overlay p-1.5">
          {matches.slice(0, 6).map((m, i) => (
            <div
              key={m.value}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => (e.preventDefault(), insert(m))}
              onMouseMove={() => setActive(i)}
              className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-control cursor-pointer", i === active && "bg-tint-hover")}
            >
              {m.icon && <Icon name={m.icon} className="w-4 h-4 text-muted" />}
              <span className="flex-1 min-w-0">
                <span className="block text-label font-medium text-contrast truncate">{m.label}</span>
                {m.hint && <span className="block text-caption text-muted truncate">{m.hint}</span>}
              </span>
              <span className="text-caption text-muted">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── L16 ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

/** L16: skeleton of a list / table, shaped like its rows (avatar, two text lines, columns). No spinners in lists. */
export function SkeletonList({ rows = 8, columns = 3, label = "Đang tải danh sách" }: { rows?: number; columns?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-3 py-3 border-b border-divider">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <Skeleton className="h-3.5 rounded-chip" style={{ width: `${40 + ((r * 17) % 35)}%` }} />
            <Skeleton className="h-3 rounded-chip w-1/4" />
          </div>
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn("h-3.5 rounded-chip w-20", c > 0 && "hidden md:block")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** L16: skeleton of a card grid, shaped like the cards (media block, title, meta line). */
export function SkeletonCardGrid({ count = 8, label = "Đang tải" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-control" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 rounded-chip w-3/4" />
              <Skeleton className="h-3 rounded-chip w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 rounded-chip w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** L16: skeleton of the sticky search + chip row while a list first loads. */
export function SkeletonContextBar() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <Skeleton className="h-11 rounded-full" />
      <div className="flex gap-2">
        {[80, 96, 72, 88, 64].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full shrink-0" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}
