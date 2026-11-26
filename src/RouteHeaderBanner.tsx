"use client";

// The announcement of the route header's centre slot (#192, docs/DESIGN_SYSTEM.md §4): a "Mới" tag, one line of text,
// an optional date / sub text, a pill CTA and a close button. Dismissed once per user per `id`: "dismissed" lives in a
// store (localStorage by default, pass your own to keep it per account), the same pattern as FeatureIntro. Storage is
// read after mount only, so the server HTML never holds it (below `md` the page content moves down once when the row
// appears, until it is closed). AppShell renders it twice from `header.banner`: in the
// header's centre from `md` (a `bg-field` pill on the column), and as one row at the top of the page content below `md`
// (`bg-card-field`: the field fill inside the content card); closing either hides both.
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "./Badge";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { buttonClass } from "../styles/buttons";
import type { SemanticTone } from "../styles/surfaces";
import { cn, HIT_AREA } from "../styles/utils";

/** Where RouteHeaderBanner keeps "dismissed". `get` may be async (an account setting on the server). */
export interface RouteHeaderBannerStore {
  get(id: string): boolean | Promise<boolean>;
  set(id: string): void | Promise<void>;
}

/**
 * The default store: `localStorage["semi_banner_<id>"]`. With storage blocked the banner still shows, and closing it
 * hides it until the next page load.
 */
export const localBannerStore: RouteHeaderBannerStore = {
  get(id) {
    try {
      return window.localStorage.getItem(`semi_banner_${id}`) !== null;
    } catch {
      return false;
    }
  },
  set(id) {
    try {
      window.localStorage.setItem(`semi_banner_${id}`, "1");
    } catch {
      /* storage blocked: remembered for this page load only */
    }
  },
};

// Closed in this page load (before an async store answers, or with storage blocked), and every mounted copy per id:
// the header copy and the inline copy hide together.
const closedNow = new Set<string>();
const copies = new Map<string, Set<() => void>>();

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The first visible tabbable element after `el` in document order (where focus goes when the banner closes). */
function nextTabbable(el: HTMLElement): HTMLElement | null {
  for (const c of document.querySelectorAll<HTMLElement>(TABBABLE)) {
    if (el.contains(c) || !(el.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
    if (c.getClientRects().length > 0 && !c.closest("[inert], [aria-hidden='true']")) return c;
  }
  return null;
}

export interface RouteHeaderBannerProps {
  /** One id per announcement ("ai-assistant-2026"): closed once per id. */
  id: string;
  /** One short sentence. One line in the header (cut with …), up to two lines in the row below `md`. */
  text: React.ReactNode;
  /** Optional date or sub text after the text, muted ("Từ 01/12"). */
  sub?: React.ReactNode;
  /** The tag before the text (a Badge); default "Mới" (locale `newBadge`); `null` drops it. */
  tag?: React.ReactNode;
  /** The tag's tone (default `blue`). */
  tagTone?: SemanticTone;
  /** The call to action, a `Button size="pill"`: a link (`href`) or an action (`onClick`). */
  cta?: { label: string; href?: string; onClick?: () => void };
  /**
   * Where "dismissed" is read and written (default `localBannerStore`). A new store is read again (e.g. a per-account
   * store after sign-in): keep it stable (a module constant or `useMemo`), or it is read on every render.
   */
  store?: RouteHeaderBannerStore;
  /**
   * Shown in the banner's place while it is not (before the store answers, and after it is closed). AppShell passes
   * `header.middle` here, so the app's centre content comes back once the banner is closed.
   */
  fallback?: React.ReactNode;
  /** After it is closed (either copy) and stored as dismissed. */
  onDismiss?: () => void;
  /**
   * `header` (default): the pill for the route header's centre slot. `inline`: the row at the top of the page content,
   * shown below `md` only. AppShell's `header.banner` renders both; a frame of your own renders both itself.
   */
  placement?: "header" | "inline";
  /** The close button's name; default "Đóng thông báo" (locale `bannerClose`). */
  closeLabel?: string;
  className?: string;
}

/**
 * An announcement for the route header's centre slot (one at a time): tag, text (truncates first, before the
 * breadcrumb or the right group shrink), optional sub text, a pill CTA and a close button. `role="status"` marks it as a
 * status region; it is in place when it appears (after mount), so screen readers are not guaranteed to announce it.
 */
export function RouteHeaderBanner({
  id,
  text,
  sub,
  tag,
  tagTone = "blue",
  cta,
  store = localBannerStore,
  fallback = null,
  onDismiss,
  placement = "header",
  closeLabel,
  className,
}: RouteHeaderBannerProps) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // after mount only: read the store; follow the other copy of the same id
  useEffect(() => {
    let live = true;
    const hide = () => setOpen(false);
    let set = copies.get(id);
    if (!set) copies.set(id, (set = new Set()));
    set.add(hide);
    if (!closedNow.has(id))
      Promise.resolve(store.get(id))
        .then((dismissed) => {
          if (live) setOpen(!dismissed && !closedNow.has(id));
        })
        .catch(() => undefined);
    return () => {
      live = false;
      set.delete(hide);
      if (set.size === 0) copies.delete(id);
    };
  }, [id, store]);

  const dismiss = () => {
    const root = ref.current;
    // focus stays on the page: it moves to what follows the banner (the header's right group, the page)
    const next = root && root.contains(document.activeElement) ? nextTabbable(root) : null;
    closedNow.add(id);
    for (const hide of [...(copies.get(id) ?? [])]) hide();
    next?.focus();
    Promise.resolve(store.set(id)).catch(() => undefined);
    onDismiss?.();
  };

  if (!open) return <>{fallback}</>;
  const inline = placement === "inline";
  const tagEl =
    tag === null ? null : (
      <Badge size="sm" tone={tagTone} className="shrink-0">
        {tag ?? t.newBadge}
      </Badge>
    );
  // the pill CTA and the close button keep their drawn size on a touch phone (no BTN_HIT), so the row stays short;
  // HIT_AREA gives each an invisible 44px area instead. The close button's area reaches 8px past its sides, the CTA's
  // only above and below it (it is wider than 44px): gap-2 (8px) + ml-0.5 leave 2px between the two areas.
  const ctaCls = buttonClass("inverse", "pill", { hit: false, className: cn("shrink-0", HIT_AREA) });
  const ctaEl = cta ? (
    cta.href ? (
      <Link href={cta.href} onClick={cta.onClick} className={ctaCls}>
        {cta.label}
      </Link>
    ) : (
      <button type="button" onClick={cta.onClick} className={ctaCls}>
        {cta.label}
      </button>
    )
  ) : null;
  const closeName = closeLabel ?? t.bannerClose;
  const close = (
    <button
      type="button"
      aria-label={closeName}
      title={closeName}
      onClick={dismiss}
      className={buttonClass("ghost", "sm", { iconOnly: true, round: true, hit: false, className: cn("shrink-0 ml-0.5", HIT_AREA) })}
    >
      <Icon name="close" className="w-3.5 h-3.5" />
    </button>
  );

  if (inline) {
    return (
      <div data-semi="RouteHeaderBanner"
        ref={ref}
        role="status"
        data-route-banner="inline"
        className={cn("md:hidden flex items-center gap-2 w-full mb-4 pl-3 pr-1 py-1 min-h-10 rounded-card bg-card-field", className)}
      >
        {tagEl}
        <p className="flex-1 min-w-0 line-clamp-2 text-chrome text-strong">
          {text}
          {sub && <span className="text-muted"> · {sub}</span>}
        </p>
        {ctaEl}
        {close}
      </div>
    );
  }
  return (
    <div data-semi="RouteHeaderBanner"
      ref={ref}
      role="status"
      data-route-banner="header"
      className={cn("flex items-center gap-2 min-w-0 max-w-full h-9 pl-1.5 pr-0.5 rounded-full bg-field", className)}
    >
      {tagEl}
      <span className="min-w-0 truncate text-chrome text-strong">
        {text}
        {sub && <span className="text-muted"> · {sub}</span>}
      </span>
      {ctaEl}
      {close}
    </div>
  );
}
