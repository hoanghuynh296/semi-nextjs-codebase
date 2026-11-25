// Filter state in the URL (#99): search params in, typed filter state out, and back. Pure functions, no React and
// no window, so they run on the server, in a test, or with any router (`useSearchParams` of Next, `useFilterParams`
// of @semi/ui, a server page's `searchParams`).
//
// Format: one repeated param per filter with the `f.` prefix, in the order of the options:
// `?f.status=new&f.status=quoting&f.big=1`; a single filter has one value (`?f.mailbox=sales`), none for its default.
// Unknown values (an old link, a typo) are dropped when read.
import type { IconName } from "./Icon";
import type { DataTableSort } from "./DataTable";

/** One choice of a multi-select or single-choice filter. */
export interface FilterOption {
  value: string;
  label: string;
  icon?: IconName;
  /** How many rows have it (shown on the right of the option). */
  count?: number;
}

/** What a filter is, without its state: the page declares these once. */
export interface FilterSpec {
  /** Name in the URL (`f.<key>`) and in the state object. */
  key: string;
  label: string;
  icon?: IconName;
  /**
   * `multi` (default): a chip with a popover of `options`. `switch`: an on / off chip (a switch in the phone panel).
   * `single`: one of `options` (a mailbox, a folder, a warehouse): a chip "Hộp thư: Tất cả" with a radio menu, a radio
   * group in FilterPanel, one value in the URL.
   */
  kind?: "multi" | "switch" | "single";
  options?: FilterOption[];
  /**
   * `single` only: the option shown while nothing is chosen ("all", or the page's default view). It is never written
   * to the URL and never counts as an active filter: `selected` is `[]` while it is in effect, so read the value as
   * `selected[0] ?? clearValue`. Picking it clears the filter.
   */
  clearValue?: string;
}

/**
 * A filter with its state: what FilterChipRow, FilterChip and FilterPanel render. A switch is on when `selected` is
 * `["1"]`; a single filter has at most one value (none while its `clearValue` is in effect).
 */
export interface FilterDef extends FilterSpec {
  selected: string[];
}

/** Selected values by filter key. */
export type FilterValues<K extends string = string> = Record<K, string[]>;

/** A search params object (URLSearchParams, Next's ReadonlyURLSearchParams) or a query string ("?a=1" or "a=1"). */
export type ParamsInput = string | { getAll(name: string): string[]; toString(): string };

export const FILTER_PARAM_PREFIX = "f.";

const SWITCH_ON = "1";

function toParams(params: ParamsInput): URLSearchParams {
  return new URLSearchParams(typeof params === "string" ? params : params.toString());
}

function clean(spec: FilterSpec, raw: string[]): string[] {
  if (spec.kind === "switch") return raw.includes(SWITCH_ON) ? [SWITCH_ON] : [];
  const values = raw.filter(Boolean);
  if (spec.kind === "single") {
    // the first known value; the default option means "no filter"
    const known = values.find((v) => v !== spec.clearValue && (!spec.options || spec.options.some((o) => o.value === v)));
    return known === undefined ? [] : [known];
  }
  // without options (they load later) every value is kept; with options, only known ones, in the options' order
  if (!spec.options) return [...new Set(values)];
  return spec.options.map((o) => o.value).filter((v) => values.includes(v));
}

/** The selected values of every filter, read from the URL. */
export function readFilterValues<K extends string>(params: ParamsInput, specs: readonly (FilterSpec & { key: K })[], prefix = FILTER_PARAM_PREFIX): FilterValues<K> {
  const p = toParams(params);
  return Object.fromEntries(specs.map((s) => [s.key, clean(s, p.getAll(prefix + s.key))])) as FilterValues<K>;
}

/** The filters with their state, ready for FilterChipRow / FilterPanel. */
export function readFilters(params: ParamsInput, specs: readonly FilterSpec[], prefix = FILTER_PARAM_PREFIX): FilterDef[] {
  const values = readFilterValues(params, specs, prefix);
  return specs.map((s) => ({ ...s, selected: values[s.key] }));
}

/**
 * New search params with `patch` applied: each key given is replaced (an empty list removes it); other params (the
 * search query, sort, a page) stay. Pass `specs` to keep the options' order and drop unknown values.
 */
export function writeFilters(
  params: ParamsInput,
  patch: Partial<FilterValues>,
  specs?: readonly FilterSpec[],
  prefix = FILTER_PARAM_PREFIX,
): URLSearchParams {
  const next = toParams(params);
  for (const [key, selected] of Object.entries(patch)) {
    next.delete(prefix + key);
    const spec = specs?.find((s) => s.key === key);
    for (const v of spec ? clean(spec, selected ?? []) : (selected ?? [])) next.append(prefix + key, v);
  }
  return next;
}

/** New search params without any of these filters (the "Xoá lọc" action). */
export function clearFilters(params: ParamsInput, specs: readonly FilterSpec[], prefix = FILTER_PARAM_PREFIX): URLSearchParams {
  return writeFilters(params, Object.fromEntries(specs.map((s) => [s.key, []])), specs, prefix);
}

/** How many filters have a value (the count on "Bộ lọc · 2"). */
export function activeFilterCount(filters: readonly { selected: readonly string[] }[]): number {
  return filters.reduce((n, f) => n + (f.selected.length > 0 ? 1 : 0), 0);
}

/** A query string for a URL: "" when there are no params, else "?a=1&b=2". */
export function toQueryString(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Default URL param name for sort state (`?sort=key.dir`). */
export const SORT_PARAM = "sort";

/** Parse `"key.asc"` / `"key.desc"` into a `DataTableSort` (returns `null` for empty or invalid strings). */
export function parseSort(raw: string | null | undefined, allowedKeys?: readonly string[]): DataTableSort | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const key = raw.slice(0, dot);
  const dir = raw.slice(dot + 1);
  if (dir !== "asc" && dir !== "desc") return null;
  if (allowedKeys && !allowedKeys.includes(key)) return null;
  return { key, dir };
}

/** Format a `DataTableSort` as `"key.dir"` (or `""` when `null`). */
export function formatSort(sort: DataTableSort | null | undefined): string {
  return sort ? `${sort.key}.${sort.dir}` : "";
}

/** Read `?sort=key.dir` from search params, falling back to `defaultSort` (default `null`) when absent or invalid. */
export function readSort(
  params: ParamsInput,
  options: { param?: string; defaultSort?: DataTableSort | null; allowedKeys?: readonly string[] } = {},
): DataTableSort | null {
  const { param = SORT_PARAM, defaultSort = null, allowedKeys } = options;
  const p = toParams(params);
  return parseSort(p.get(param), allowedKeys) ?? defaultSort;
}

/**
 * New search params with `sort` written as `?sort=key.dir`. Passing `null` or the `defaultSort` removes the param
 * so default URLs stay clean.
 */
export function writeSort(
  params: ParamsInput,
  sort: DataTableSort | null,
  options: { param?: string; defaultSort?: DataTableSort | null } = {},
): URLSearchParams {
  const { param = SORT_PARAM, defaultSort = null } = options;
  const next = toParams(params);
  const isDefault = Boolean(sort && defaultSort && sort.key === defaultSort.key && sort.dir === defaultSort.dir);
  if (!sort || isDefault) next.delete(param);
  else next.set(param, formatSort(sort));
  return next;
}
