"use client";

// The URL as shared state for useFilterParams and useDetailParam (internal, not exported from @semi/ui): read
// `location.search` after hydration, write with `history.pushState(null, …)` (Next's App Router turns that into its
// own navigation and keeps useSearchParams in step), and tell every reader on the page.
import { toQueryString } from "./filterParams";

export function currentSearch() {
  return typeof window === "undefined" ? "" : window.location.search;
}

/** Fired after a write here, so every hook on the page (and a second one) re-reads the URL. */
export const URL_EVENT = "semi:urlchange";

type NavigationLike = {
  addEventListener(type: string, cb: () => void): void;
  removeEventListener(type: string, cb: () => void): void;
  currentEntry?: { key: string } | null;
};

/** The Navigation API where the browser has it (Chromium, Safari 26+); Firefox and older Safari have none. */
export const navigationApi = () => (typeof window === "undefined" ? undefined : (window as unknown as { navigation?: NavigationLike }).navigation);

export function subscribeUrl(onChange: () => void) {
  // Next writes history inside an insertion effect (HistoryUpdater) and `currententrychange` fires synchronously in
  // that write: an update scheduled there is an error in React. Read the URL a microtask later instead.
  const deferred = () => queueMicrotask(onChange);
  window.addEventListener("popstate", deferred);
  window.addEventListener(URL_EVENT, deferred);
  // Navigation API: also hears Next's own history writes (a Link or router.push to this route)
  const nav = navigationApi();
  nav?.addEventListener("currententrychange", deferred);
  return () => {
    window.removeEventListener("popstate", deferred);
    window.removeEventListener(URL_EVENT, deferred);
    nav?.removeEventListener("currententrychange", deferred);
  };
}

// Debounced writes still waiting (a SearchPill's query). A push flushes them first, so the text reaches the entry it
// was typed on instead of landing, late, on the entry the push created (#128).
const pending = new Set<() => void>();

/** Hold a pending write until it is sent or cancelled; a push runs it first. Returns the release. */
export function holdPending(flush: () => void) {
  pending.add(flush);
  return () => void pending.delete(flush);
}

/** Send every pending write now (each released before it runs, so a flush that pushes does not loop). */
export function flushPending() {
  for (const flush of [...pending]) {
    pending.delete(flush);
    flush();
  }
}

/**
 * Write the search part of the current URL (path and hash kept) and tell the readers. A push first flushes the
 * pending writes onto the current entry; pass a function of the current search to build on what they wrote.
 */
export function writeSearch(next: URLSearchParams | ((current: string) => URLSearchParams), mode: "push" | "replace") {
  if (mode === "push") flushPending();
  const params = typeof next === "function" ? next(currentSearch()) : next;
  const url = `${window.location.pathname}${toQueryString(params)}${window.location.hash}`;
  // state null, as Next documents: it keeps its own history state and syncs useSearchParams
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(URL_EVENT));
}

/** Set or remove (`null` / "") params of the current URL. */
export function patchSearch(patch: Record<string, string | null>, mode: "push" | "replace") {
  writeSearch((current) => {
    const next = new URLSearchParams(current);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    return next;
  }, mode);
}
