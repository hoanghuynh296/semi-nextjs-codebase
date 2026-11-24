"use client";

// Tab state in the URL (?tab=), built on urlState.ts (Next 16 App Router safe: null history state, deferred listeners,
// no useSearchParams). Arrow-key stepping in automatic tabs replaces the current entry so arrowing across tabs never
// stacks one history entry per key (#121, #147).
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { currentSearch, patchSearch, subscribeUrl } from "./urlState";

export interface TabChangeMeta {
  /** How the tab was chosen: `"keyboard"` for automatic arrow-key stepping, `"click"` for a click or Enter / Space commit. */
  via: "keyboard" | "click";
}

export interface UseTabParamOptions<T extends string> {
  /** Query parameter name in the URL. @default "tab" */
  param?: string;
  /** Known tab keys; an unknown value in the URL falls back to `defaultValue`. */
  values?: readonly T[];
  /**
   * History mode for pointer clicks and manual Enter / Space commits (`"replace"` keeps one entry for the page;
   * `"push"` adds an entry on click / commit while automatic arrow-key stepping still replaces).
   * @default "replace"
   */
  history?: "replace" | "push";
}

/**
 * Keep the active tab in `?tab=` (or `options.param`), SSR- and prerender-safe: the server render and hydration see
 * `defaultValue`, then the URL is read right after mount. Automatic arrow-key changes always replace the current
 * history entry, so pressing ←/→ across five tabs never pushes five entries.
 */
export function useTabParam<T extends string>(
  defaultValue: T,
  options: UseTabParamOptions<T> = {},
): readonly [T, (next: T, meta?: TabChangeMeta) => void] {
  const { param = "tab", values, history = "replace" } = options;
  const search = useSyncExternalStore(subscribeUrl, currentSearch, () => "");
  const valuesKey = values ? values.join("\0") : "";
  const value = useMemo(() => {
    const raw = new URLSearchParams(search).get(param);
    if (!raw) return defaultValue;
    if (values && !values.includes(raw as T)) return defaultValue;
    return raw as T;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, param, defaultValue, valuesKey]);

  const setTab = useCallback(
    (next: T, meta?: TabChangeMeta) => {
      const mode = history === "push" && meta?.via !== "keyboard" ? "push" : "replace";
      patchSearch({ [param]: next === defaultValue ? null : next }, mode);
    },
    [param, defaultValue, history],
  );

  return [value, setTab] as const;
}
