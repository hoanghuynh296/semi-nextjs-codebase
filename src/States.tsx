"use client";

// Page-level states: error, not found, no access (docs/DESIGN_SYSTEM.md §13c). Empty lists use EmptyState (§13).
import React from "react";
import Link from "next/link";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { useSemiLocale } from "./locale";
import { BTN_PRIMARY } from "../styles/buttons";
import { EMPTY_PHONE_CAP } from "../styles/surfaces";
import { cn } from "../styles/utils";

type StateTone = "danger" | "neutral";

function StateBlock({
  kind,
  icon,
  tone,
  title,
  message,
  detail,
  role,
  children,
  className,
}: {
  kind: string;
  icon: IconName;
  tone: StateTone;
  title: React.ReactNode;
  message?: React.ReactNode;
  detail?: React.ReactNode;
  role?: "alert";
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={role}
      data-state={kind}
      className={cn("w-full flex flex-col items-center justify-center gap-3 text-center px-4 py-12 sm:py-16 min-h-[40dvh] max-sm:min-h-0", EMPTY_PHONE_CAP, className)}
    >
      <span
        className={cn(
          "w-10 h-10 rounded-card border flex items-center justify-center shrink-0",
          tone === "danger" ? "bg-danger-bg border-danger-border text-danger-fg" : "bg-field border-line text-muted",
        )}
      >
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <h2 className="text-heading font-title text-contrast">{title}</h2>
      {message && <p className="text-ui text-muted max-w-md">{message}</p>}
      {detail && <p className="text-caption text-muted tabular-nums break-all max-w-md">{detail}</p>}
      {children && <div className="pt-1 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}

/**
 * Something failed to load or run (route `error.tsx`, a failed fetch). Says what failed and offers a retry; keep any
 * data already loaded on screen and show this in place of the failed part only (§13c).
 */
export function ErrorState({
  title,
  message,
  detail,
  onRetry,
  retryLabel,
  action,
  icon = "alert",
  className,
}: {
  /** Defaults to "Có lỗi xảy ra". */
  title?: React.ReactNode;
  /** What failed and what to do next, in the product's voice. Defaults to a generic Vietnamese sentence. */
  message?: React.ReactNode;
  /** Small technical line (an error digest or code) for support, never the raw stack. */
  detail?: React.ReactNode;
  /** Shows a primary "Thử lại" button. In `error.tsx` pass the `reset` Next.js gives you. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Extra action beside the retry (a link home, "Báo lỗi"). */
  action?: React.ReactNode;
  icon?: IconName;
  className?: string;
}) {
  const t = useSemiLocale();
  return (
    <StateBlock kind="error" role="alert" icon={icon} tone="danger" title={title ?? t.errorTitle} message={message ?? t.errorMessage} detail={detail} className={className}>
      {onRetry && (
        <Button variant="primary" icon="refresh" onClick={onRetry}>
          {retryLabel ?? t.retry}
        </Button>
      )}
      {action}
    </StateBlock>
  );
}

function HomeLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={BTN_PRIMARY}>
      <Icon name="back" className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}

/** A wrong or removed URL (route `not-found.tsx`, `notFound()`): one sentence and a link home. */
export function NotFound({
  title,
  message,
  homeHref = "/",
  homeLabel,
  className,
}: {
  title?: React.ReactNode;
  message?: React.ReactNode;
  /** Where "Về trang chủ" goes. */
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  return (
    <StateBlock kind="not-found" icon="search" tone="neutral" title={title ?? t.notFoundTitle} message={message ?? t.notFoundMessage} className={className}>
      <HomeLink href={homeHref} label={homeLabel ?? t.home} />
    </StateBlock>
  );
}

/** Signed in but not allowed (a 403, or a page the role cannot open): say so and link home; do not offer a retry. */
export function Forbidden({
  title,
  message,
  homeHref = "/",
  homeLabel,
  action,
  className,
}: {
  title?: React.ReactNode;
  message?: React.ReactNode;
  homeHref?: string;
  homeLabel?: string;
  /** Extra action beside the link home (a mailto to the admin, "Đổi tài khoản"). */
  action?: React.ReactNode;
  className?: string;
}) {
  const t = useSemiLocale();
  return (
    <StateBlock kind="forbidden" icon="lock" tone="neutral" title={title ?? t.forbiddenTitle} message={message ?? t.forbiddenMessage} className={className}>
      <HomeLink href={homeHref} label={homeLabel ?? t.home} />
      {action}
    </StateBlock>
  );
}
