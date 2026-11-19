"use client";

// Pick a number in a range by dragging (volume, opacity, speed). One thumb, or two with `range` for a min–max pair.
import React, { useId, useRef } from "react";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const snap = (v: number, min: number, step: number) => {
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number((Math.round((v - min) / step) * step + min).toFixed(decimals));
};

interface SliderBase {
  min?: number;
  max?: number;
  step?: number;
  /** Visible label above the track (also the accessible name). */
  label: string;
  /** Show the formatted value next to the label. */
  showValue?: boolean;
  /** Text of a value (units, %): read by screen readers too (aria-valuetext). */
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export type SliderProps = SliderBase &
  (
    | { range?: false; value: number; onChange: (value: number) => void }
    | { /** Two thumbs: value is [low, high]. */ range: true; value: [number, number]; onChange: (value: [number, number]) => void }
  );

/**
 * One or two thumbs (role="slider"): ←/↓ and →/↑ step, PageUp / PageDown jump 10 steps, Home / End go to the ends;
 * drag or click the track. `value` is a number, or [low, high] with `range`.
 */
export function Slider(props: SliderProps) {
  const { min = 0, max = 100, step = 1, label, showValue = false, format = (v: number) => String(v), disabled = false, className } = props;
  const t = useSemiLocale();
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const range = props.range === true;
  const values: number[] = props.range ? [...props.value] : [props.value];
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const emit = (next: number[]) => (props.range ? props.onChange([next[0], next[1]]) : props.onChange(next[0]));
  const setAt = (i: number, v: number) => {
    const next = [...values];
    next[i] = clamp(snap(v, min, step), range && i === 1 ? values[0] : min, range && i === 0 ? values[1] : max);
    emit(next);
  };
  const fromPointer = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    return min + clamp((clientX - r.left) / r.width, 0, 1) * (max - min);
  };
  /** The thumb a press moves: the nearer one; when both sit on one value, the side the pointer is on (or, pressed
   * right on them, the way the drag goes), so two equal thumbs can always be pulled apart. */
  const nearest = (v: number): number | null => {
    if (!range) return 0;
    if (values[0] === values[1]) {
      const half = step / 2;
      return v > values[1] + half ? 1 : v < values[0] - half ? 0 : null;
    }
    return Math.abs(v - values[1]) < Math.abs(v - values[0]) ? 1 : 0;
  };
  const focusThumb = (i: number) => trackRef.current?.querySelectorAll<HTMLElement>("[role=slider]")[i]?.focus();
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const startX = e.clientX;
    const v = fromPointer(startX);
    let i = nearest(v);
    if (i !== null) {
      setAt(i, v);
      focusThumb(i);
    }
    const el = trackRef.current!;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      if (i === null) {
        if (ev.clientX === startX) return;
        i = ev.clientX > startX ? 1 : 0;
        focusThumb(i);
      }
      setAt(i, fromPointer(ev.clientX));
    };
    // up, a cancelled touch (scroll, system gesture) or a lost capture all end the drag
    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      el.removeEventListener("lostpointercapture", end);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const v = values[i];
    const to = {
      ArrowLeft: v - step,
      ArrowDown: v - step,
      ArrowRight: v + step,
      ArrowUp: v + step,
      PageDown: v - step * 10,
      PageUp: v + step * 10,
      Home: min,
      End: max,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setAt(i, to);
  };
  const lo = range ? pct(values[0]) : 0;
  const hi = pct(values[values.length - 1]);
  return (
    <div className={cn("space-y-2", disabled && "opacity-40", className)}>
      <div className="flex items-center justify-between gap-3">
        <span id={`${id}-label`} className="text-label font-medium text-muted">
          {label}
        </span>
        {showValue && <span className="text-label font-medium text-contrast tabular-nums">{values.map(format).join(" – ")}</span>}
      </div>
      <div ref={trackRef} onPointerDown={onPointerDown} className={cn("relative h-5 touch-none select-none", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-raised" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-accent" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
        {values.map((v, i) => (
          <div
            key={i}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-labelledby={range ? `${id}-label ${id}-thumb-${i}` : `${id}-label`}
            aria-valuemin={range && i === 1 ? values[0] : min}
            aria-valuemax={range && i === 0 ? values[1] : max}
            aria-valuenow={v}
            aria-valuetext={format(v)}
            aria-disabled={disabled || undefined}
            onKeyDown={(e) => !disabled && onKey(e, i)}
            style={{ left: `${pct(v)}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-panel border-2 border-accent shadow-float outline-none focus-visible:ring-4 focus-visible:ring-focus"
          >
            {range && (
              <span id={`${id}-thumb-${i}`} className="sr-only">
                {i === 0 ? t.rangeLow : t.rangeHigh}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
