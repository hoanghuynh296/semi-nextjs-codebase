"use client";

// Route-level page enter animation (#151, docs/TOKENS.md): runs `motion-enter` + `motion-stagger` on the page's top
// blocks and the first ~10 rows / cards once per route. Never replays on filter, search, sort or `?tab=` changes, and
// never animates rows that arrive later (slow data). Uses `display: contents` so it adds no layout box and never breaks
// fixed-height chains or inner scrollers.
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Default window (ms) the enter class stays active after route mount (max stagger 11 × 35ms + 400ms enter = 785ms). */
const DEFAULT_ENTER_WINDOW_MS = 1000;

interface NavigationLike {
  addEventListener(type: "navigate", listener: (e: { destination?: { url?: string } }) => void): void;
  removeEventListener(type: "navigate", listener: (e: { destination?: { url?: string } }) => void): void;
}

function PageEnterInner({
  disabled,
  windowMs,
  children,
}: {
  disabled: boolean;
  windowMs: number;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(!disabled);

  useEffect(() => {
    if (disabled) {
      setActive(false);
      return;
    }
    const id = setTimeout(() => setActive(false), windowMs);
    // If a same-pathname query change (?tab=, ?q=, ?f.*) lands during the initial enter window, stop the window
    // immediately so newly rendered filtered rows or tab panels never replay the route entrance.
    const nav = (typeof window !== "undefined" ? (window as unknown as { navigation?: NavigationLike }).navigation : undefined);
    const onNavigate = (e: { destination?: { url?: string } }) => {
      const url = e.destination?.url;
      if (!url) return;
      try {
        const next = new URL(url);
        if (next.pathname === window.location.pathname && next.search !== window.location.search) {
          setActive(false);
        }
      } catch {
        // ignore malformed URLs
      }
    };
    nav?.addEventListener("navigate", onNavigate);
    return () => {
      clearTimeout(id);
      nav?.removeEventListener("navigate", onNavigate);
    };
  }, [disabled, windowMs]);

  return (
    <div style={{ display: "contents" }} data-motion-enter={active ? "active" : "done"}>
      {children}
    </div>
  );
}

/**
 * Runs `motion-enter` + `motion-stagger` (first ~10 rows / cards) once per route without adding a layout box
 * (`display: contents`). Wrap `{children}` inside `AppShell` (or pass `enter` on `<Page>`) so the shell stays still
 * and only page content rises in on route changes. Filter, search, sort and `?tab=` changes never replay it, and rows
 * arriving after `windowMs` do not animate. Under `prefers-reduced-motion: reduce`, entrance is opacity only.
 */
export function PageEnter({
  routeKey,
  disabled = false,
  windowMs = DEFAULT_ENTER_WINDOW_MS,
  children,
}: {
  /** Key that triggers a new entrance when it changes. Defaults to `usePathname()` (ignores query string changes). */
  routeKey?: string;
  /** Disable the enter animation completely. */
  disabled?: boolean;
  /** Milliseconds after route mount before the enter window closes so late-arriving rows do not animate. @default 1000 */
  windowMs?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const key = routeKey ?? pathname ?? "";
  return (
    <PageEnterInner key={key} disabled={disabled} windowMs={windowMs}>
      {children}
    </PageEnterInner>
  );
}
