"use client";

// Inline feedback & identity: Alert (callout / banner), Progress, Avatar, EmptyState.
import React from "react";
import { Icon, type IconName } from "./Icon";
import { STATUS_ICON, type StatusTone } from "./Toast";
import { useSemiLocale } from "./locale";
import { Button } from "./Button";
import { EMPTY_PHONE_CAP, EMPTY_STATIC, TONAL_SURFACE } from "../styles/surfaces";
import { cn, FOCUS_RING } from "../styles/utils";

/** Callout inside a page or form (docs/DESIGN_SYSTEM.md §3b): tinted surface, tone icon, optional action / dismiss. */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
  action,
  onDismiss,
  className,
}: {
  tone?: StatusTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Override the tone's icon. */
  icon?: IconName;
  /** A button or link shown under the text. */
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const t = useSemiLocale();
  const s = STATUS_ICON[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-card border p-3 flex items-start gap-2.5", s.surface, className)}>
      <Icon name={icon ?? s.icon} className={cn("w-4 h-4 mt-px shrink-0", s.fg)} />
      <div className="flex-1 min-w-0 space-y-1">
        {title && <div className={cn("text-ui font-medium", s.fg)}>{title}</div>}
        {children && <div className="text-label text-body leading-relaxed">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label={t.dismiss}
          onClick={onDismiss}
          className={cn("w-6 h-6 rounded-control text-muted hover:text-contrast flex items-center justify-center transition shrink-0 cursor-pointer", FOCUS_RING)}
        >
          <Icon name="close" className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

const PROGRESS_FILL: Record<StatusTone | "accent", string> = {
  accent: "bg-accent",
  info: "bg-info-solid",
  success: "bg-success-solid",
  warning: "bg-warning-solid",
  danger: "bg-danger-solid",
};

/** Determinate or indeterminate progress bar (uploads, quotas, print progress). */
export function Progress({
  value,
  max = 100,
  tone = "accent",
  label,
  showValue = false,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  /** Omit for an indeterminate bar. */
  value?: number;
  max?: number;
  tone?: StatusTone | "accent";
  /** Visible label above the bar (also its accessible name). */
  label?: React.ReactNode;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
  /** Accessible name when there is no string `label` (the bar's text is elsewhere). */
  "aria-label"?: string;
}) {
  const pct = value === undefined ? undefined : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("min-w-0", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 mb-1.5 text-label">
          {label && <span className="text-muted font-medium truncate">{label}</span>}
          {showValue && pct !== undefined && <span className="text-contrast tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={typeof label === "string" ? label : ariaLabel}
        className={cn("relative w-full overflow-hidden rounded-full bg-raised", size === "sm" ? "h-1" : "h-1.5")}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", PROGRESS_FILL[tone], pct === undefined && "w-1/3 absolute progress-indeterminate")}
          style={pct === undefined ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const AVATAR_TONES = ["purple", "sky", "teal", "amber", "rose", "indigo", "emerald", "orange"] as const;
const AVATAR_SIZE = { sm: "w-6 h-6 text-caption", md: "w-8 h-8 text-label", lg: "w-10 h-10 text-ui" } as const;

/** Person or team mark: photo, else initials on a tone picked from the name (stable per name). */
export function Avatar({ name, src, size = "md", className }: { name: string; src?: string; size?: keyof typeof AVATAR_SIZE; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const tone = AVATAR_TONES[h % AVATAR_TONES.length];
  const cls = cn("inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden font-medium select-none border", AVATAR_SIZE[size], className);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn(cls, "object-cover border-line")} />;
  }
  return (
    <span role="img" aria-label={name} className={cn(cls, TONAL_SURFACE[tone])}>
      {initials}
    </span>
  );
}

/**
 * Empty list / first-run state (docs/DESIGN_SYSTEM.md §13).
 * - `first-use`: nothing exists yet. One icon, one sentence (the title), one primary action (`action`).
 * - `no-results`: a search or filter matched nothing. Own title, and `onClearFilters` adds a "Xoá lọc" button.
 * Below `sm` it takes at most 40% of the viewport (compact padding, scrolls inside if a long text still overflows).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant,
  onClearFilters,
  className,
}: {
  /** Defaults: `search` for no-results, `box` otherwise. */
  icon?: IconName;
  /** Defaults: "Không có kết quả" for no-results, "Chưa có dữ liệu" otherwise. */
  title?: React.ReactNode;
  /** One short hint. A `first-use` state needs none: the title is its one sentence. */
  description?: React.ReactNode;
  /** The one primary action (a filled Button) that fills the list. Not used by `no-results` when `onClearFilters` is set. */
  action?: React.ReactNode;
  /** `first-use` (nothing yet, one primary action) or `no-results` (a search / filter matched nothing). Omit for the plain state. */
  variant?: "first-use" | "no-results";
  /** no-results: clears the search and filters; renders a secondary "Xoá lọc" button. */
  onClearFilters?: () => void;
  className?: string;
}) {
  const t = useSemiLocale();
  const noResults = variant === "no-results";
  const shownAction = noResults && onClearFilters ? <Button variant="secondary" icon="close" onClick={onClearFilters}>{t.clearFilters}</Button> : action;
  return (
    <div data-empty={variant ?? "default"} className={cn(EMPTY_STATIC, EMPTY_PHONE_CAP, className)}>
      <span className="w-9 h-9 rounded-card bg-field border border-line flex items-center justify-center text-muted shrink-0">
        <Icon name={icon ?? (noResults ? "search" : "box")} className="w-4 h-4" />
      </span>
      <div className="text-ui font-medium text-contrast">{title ?? (noResults ? t.noResults : t.noData)}</div>
      {(description ?? (noResults ? t.noResultsHint : undefined)) && <div className="text-label text-muted max-w-sm">{description ?? t.noResultsHint}</div>}
      {shownAction && <div className="pt-1">{shownAction}</div>}
    </div>
  );
}
