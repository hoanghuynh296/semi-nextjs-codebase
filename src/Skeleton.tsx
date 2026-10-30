// Shimmer placeholders shown while a page or a list loads (docs/DESIGN_SYSTEM.md §13b). The `.shimmer` class lives in base.css.
import React from "react";
import { CARD } from "../styles/surfaces";

/** One shimmering block; size and radius come from className (default rounded-lg). */
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`shimmer rounded-lg ${className}`} style={style} aria-hidden />;
}

/** Wrapper that tells assistive tech the region is loading. */
export function Loading({ children, className = "", label = "Đang tải" }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Card placeholder: icon tile + two text lines, then an optional body block. */
export function SkeletonCard({ body = "h-24", className = "" }: { body?: string | null; className?: string }) {
  return (
    <div className={`${CARD} p-4 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 !rounded-lg shrink-0" />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {body && <Skeleton className={`${body} w-full !rounded-lg`} />}
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
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
          <Skeleton className="w-8 h-8 !rounded-lg shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
        </div>
      ))}
    </Loading>
  );
}

/** Whole-page placeholder (Suspense fallbacks): title row + a grid of cards. */
export function PageSkeleton() {
  return (
    <div className="h-dvh bg-app p-4 sm:p-6 max-w-[1440px] w-full mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 !rounded-lg" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="ml-auto h-9 w-24 !rounded-lg" />
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}
