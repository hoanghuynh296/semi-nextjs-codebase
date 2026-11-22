"use client";

// Shimmer placeholders shown while a page or a list loads (docs/DESIGN_SYSTEM.md §13b). The `.shimmer` class lives in base.css.
import React from "react";
import { useSemiLocale } from "./locale";
import { Spinner } from "./Button";
import { CARD } from "../styles/surfaces";

/** One shimmering block; size and radius come from className (default rounded-control). */
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`shimmer rounded-control ${className}`} style={style} aria-hidden />;
}

/** Wrapper that tells assistive tech the region is loading. `relative` keeps the absolute sr-only label inside scroll containers. */
export function Loading({ children, className = "", label: labelProp }: { children: React.ReactNode; className?: string; label?: string }) {
  const t = useSemiLocale();
  const label = labelProp ?? t.loading;
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={`relative ${className}`}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Card placeholder: icon tile + two text lines, then an optional body block. */
export function SkeletonCard({ body = "h-24", className = "" }: { body?: string | null; className?: string }) {
  return (
    <div className={`${CARD} p-card flex flex-col gap-stack ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 !rounded-control shrink-0" />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {body && <Skeleton className={`${body} w-full !rounded-control`} />}
    </div>
  );
}

/** Grid of card placeholders (the grid classes should match the real grid). */
export function SkeletonGrid({
  count = 6,
  className = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3",
  body = "h-24",
  label,
}: {
  count?: number;
  className?: string;
  body?: string | null;
  label?: string;
}) {
  return (
    <Loading className={className} label={label}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} body={body} />
      ))}
    </Loading>
  );
}

/** List row placeholders (dialog lists, tables). */
export function SkeletonRows({ count = 5, className = "flex flex-col gap-2", label }: { count?: number; className?: string; label?: string }) {
  return (
    <Loading className={className} label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-control bg-field">
          <Skeleton className="w-8 h-8 !rounded-control shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
        </div>
      ))}
    </Loading>
  );
}

/**
 * Whole-page placeholder (Suspense fallbacks, route `loading.tsx`): title row + the shape of the content.
 * `cards` (default) = a grid of cards, `list` = a toolbar and table rows, `detail` = a header card and two panels.
 * Pick the shape the real page has, so nothing jumps when the data arrives (§13b).
 */
export function PageSkeleton({ shape = "cards" }: { shape?: "cards" | "list" | "detail" }) {
  return (
    <div className="h-dvh bg-app p-4 sm:p-6 max-w-[1440px] w-full mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 !rounded-control" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="ml-auto h-9 w-24 !rounded-control" />
      </div>
      {shape === "cards" && <SkeletonGrid count={6} />}
      {shape === "list" && (
        <>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 flex-1 sm:max-w-xs" />
            <Skeleton className="h-9 w-20" />
          </div>
          <SkeletonRows count={8} />
        </>
      )}
      {shape === "detail" && (
        <Loading className="flex flex-col gap-3">
          <SkeletonCard body="h-16" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SkeletonCard body="h-40" />
            <SkeletonCard body="h-40" />
          </div>
        </Loading>
      )}
    </div>
  );
}

/**
 * Boot / session gate before the app knows its layout (login or shell), the one place a centred spinner is allowed
 * (§13b). Render it once in the root or route-group layout, never inside AppShell content (`boot-loader-place`).
 * Prefer a server-side session check (proxy / async layout), which needs no gate at all.
 */
export function BootLoader({
  label,
  delay = 300,
  className = "",
}: {
  /** Screen-reader text (never shown). Defaults to the locale's "opening the app". */
  label?: string;
  /** Milliseconds before the spinner appears, so a fast check shows only the background. */
  delay?: number;
  className?: string;
}) {
  const t = useSemiLocale();
  const [shown, setShown] = React.useState(delay <= 0);
  React.useEffect(() => {
    if (delay <= 0) return;
    const id = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return (
    <Loading label={label ?? t.booting} className={`min-h-dvh w-full grid place-items-center bg-app ${className}`}>
      {shown && <Spinner className="w-6 h-6 text-muted motion-reduce:animate-none" />}
    </Loading>
  );
}
