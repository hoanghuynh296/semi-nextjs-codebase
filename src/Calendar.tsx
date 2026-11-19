"use client";

// A month grid to pick one day or a range of days. Values are local days "YYYY-MM-DD"; weeks start on Monday.
// DatePicker shows it in a popover; place it inline for schedules and report filters.
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { FOCUS_RING, cn } from "../styles/utils";

const pad = (n: number) => String(n).padStart(2, "0");
/** A Date as a local "YYYY-MM-DD". */
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** "YYYY-MM-DD" → local Date (null when malformed). */
export const parseDay = (v?: string | null): Date | null => {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};

const noSubscribe = () => () => {};
/** Today as "YYYY-MM-DD" on the client; null on the server and during hydration, so the markup never depends on the
 * server's clock or time zone (a server in UTC and a browser in UTC+7 disagree on the day and, near the 1st, the month). */
function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, () => isoDay(new Date()), () => null);
}

export interface DayRange {
  start?: string;
  end?: string;
}

interface CalendarBase {
  /** Earliest / latest selectable day ("YYYY-MM-DD"). */
  min?: string;
  max?: string;
  /** Move focus into the grid when it mounts (DatePicker does). */
  autoFocus?: boolean;
  className?: string;
}

export type CalendarProps = CalendarBase &
  (
    | { mode?: "single"; value: string; onChange: (value: string) => void }
    | { /** Pick a start then an end day; a click before the start starts again. */ mode: "range"; value: DayRange; onChange: (value: DayRange) => void }
  );

/**
 * A grid of days (role="grid"): arrows move by day / week, Home / End to the start / end of the week, PageUp /
 * PageDown by month (Shift: by year), Enter / Space pick. Only the focused day is in the tab order.
 */
export function Calendar(props: CalendarProps) {
  const { min, max, autoFocus = false, className } = props;
  const t = useSemiLocale();
  const range = props.mode === "range";
  const selected = range ? parseDay(props.value.start) : parseDay(props.value);
  const selectedKey = selected ? isoDay(selected) : null;
  const today = useToday();
  // null until a value or today is known (server render without a value): the grid renders no days then
  const [focusState, setFocus] = useState<Date | null>(selected);
  // follow a value changed from outside (a preset, a reset): show its month
  const [prevSelected, setPrevSelected] = useState(selectedKey);
  if (selectedKey !== prevSelected) {
    setPrevSelected(selectedKey);
    if (selected) setFocus(selected);
  }
  const disabled = (key: string) => Boolean((min && key < min) || (max && key > max));
  /** Keep a day inside min / max, so the focused day is never a disabled button (focus would be lost). */
  const clamp = (d: Date) => {
    const key = isoDay(d);
    if (min && key < min) return parseDay(min) ?? d;
    if (max && key > max) return parseDay(max) ?? d;
    return d;
  };
  const fallback = parseDay(today) ?? null;
  const focus = focusState ?? (fallback ? clamp(fallback) : null);
  const [hover, setHover] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const moved = useRef(autoFocus);
  const view = focus ? { y: focus.getFullYear(), m: focus.getMonth() } : null;
  // a month is reachable when one of its days is inside min / max
  const monthOpen = (d: Date) => {
    const firstKey = isoDay(new Date(d.getFullYear(), d.getMonth(), 1));
    const lastKey = isoDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    return !(max && firstKey > max) && !(min && lastKey < min);
  };

  useEffect(() => {
    if (!moved.current) return;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [focus?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (key: string) => {
    if (disabled(key)) return;
    if (props.mode !== "range") return props.onChange(key);
    const { start, end } = props.value;
    if (!start || end || key < start) props.onChange({ start: key, end: undefined });
    else props.onChange({ start, end: key });
  };
  const go = (d: Date) => {
    moved.current = true;
    setFocus(clamp(d));
  };
  const page = (n: number) => focus && setFocus(clamp(addMonths(focus, n)));
  const onKey = (e: React.KeyboardEvent) => {
    if (!focus) return;
    const dow = (focus.getDay() + 6) % 7;
    const to = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      Home: addDays(focus, -dow),
      End: addDays(focus, 6 - dow),
      PageUp: addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: addMonths(focus, e.shiftKey ? 12 : 1),
    }[e.key];
    if (to) {
      e.preventDefault();
      go(to);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(isoDay(focus));
    }
  };

  // 6 weeks from the Monday on or before the 1st
  const first = view ? new Date(view.y, view.m, 1) : null;
  const start = first ? addDays(first, -((first.getDay() + 6) % 7)) : null;
  const weeks = start ? Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))) : [];
  const focusKey = focus ? isoDay(focus) : null;
  const monthLabel = view ? t.monthYear(view.m + 1, view.y) : "";
  const r = range ? props.value : null;
  const rangeEnd = r?.end ?? (r?.start && hover && hover > r.start ? hover : undefined);
  const navBtn = cn("w-8 h-8 rounded-control flex items-center justify-center text-muted hover:text-contrast hover:bg-raised transition", FOCUS_RING);

  return (
    <div className={cn("w-[264px] flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <button type="button" aria-label={t.prevMonth} disabled={!focus || !monthOpen(addMonths(focus, -1))} onClick={() => page(-1)} className={cn(navBtn, "disabled:opacity-30 disabled:pointer-events-none")}>
          <Icon name="back" className="w-4 h-4" />
        </button>
        <span className="text-ui font-medium text-contrast tabular-nums" aria-live="polite">
          {monthLabel}
        </span>
        <button type="button" aria-label={t.nextMonth} disabled={!focus || !monthOpen(addMonths(focus, 1))} onClick={() => page(1)} className={cn(navBtn, "disabled:opacity-30 disabled:pointer-events-none")}>
          <Icon name="chevron" className="w-4 h-4" />
        </button>
      </div>
      <div ref={gridRef} role="grid" aria-label={monthLabel || undefined} onKeyDown={onKey} onPointerLeave={() => setHover(null)}>
        <div role="row" className="grid grid-cols-7 text-center text-caption text-muted">
          {t.weekdaysShort.map((w) => (
            <span key={w} role="columnheader" className="h-7 flex items-center justify-center">
              {w}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-y-0.5">
            {week.map((d) => {
              const key = isoDay(d);
              const outside = d.getMonth() !== view?.m;
              const off = disabled(key);
              const isStart = range ? key === r?.start : key === (props.value as string);
              const isEnd = range && key === rangeEnd;
              const inRange = range && r?.start && rangeEnd ? key > r.start && key < rangeEnd : false;
              const isSel = isStart || isEnd;
              return (
                <div key={key} role="gridcell" aria-selected={isSel || inRange} className={cn(inRange && "bg-accent-subtle", isStart && rangeEnd && "rounded-l-control bg-accent-subtle", isEnd && "rounded-r-control bg-accent-subtle")}>
                  <button
                    type="button"
                    tabIndex={key === focusKey ? 0 : -1}
                    disabled={off}
                    aria-label={`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`}
                    aria-current={key === today ? "date" : undefined}
                    onClick={() => {
                      go(d);
                      pick(key);
                    }}
                    onPointerEnter={() => setHover(key)}
                    className={cn(
                      "w-full h-8 rounded-control text-label tabular-nums flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none",
                      FOCUS_RING,
                      isSel
                        ? "bg-accent text-on-accent font-medium"
                        : key === today
                          ? "text-accent-fg border border-accent-line hover:bg-raised"
                          : outside
                            ? "text-muted hover:bg-raised"
                            : "text-body hover:bg-raised",
                    )}
                  >
                    {d.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!range && (
        <div className="flex justify-between pt-1">
          <button
            type="button"
            disabled={!today || disabled(today)}
            onClick={() => {
              if (!today) return;
              go(new Date());
              pick(today);
            }}
            className={cn("text-label font-medium text-accent-fg hover:text-contrast disabled:opacity-30 disabled:pointer-events-none transition rounded-chip", FOCUS_RING)}
          >
            {t.today}
          </button>
        </div>
      )}
    </div>
  );
}
