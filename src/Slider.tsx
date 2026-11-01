"use client";

// Pick a number in a range by dragging (volume, opacity, speed). One thumb, or two with `range` for a min–max pair.
import React, { useId, useRef } from "react";
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
  const nearest = (v: number) => (range && Math.abs(v - values[1]) < Math.abs(v - values[0]) ? 1 : 0);
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const v = fromPointer(e.clientX);
    const i = nearest(v);
    setAt(i, v);
    const el = trackRef.current!;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => setAt(i, fromPointer(ev.clientX));
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    (el.querySelectorAll<HTMLElement>("[role=slider]")[i] as HTMLElement | undefined)?.focus();
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
            aria-labelledby={`${id}-label`}
            aria-valuemin={range && i === 1 ? values[0] : min}
            aria-valuemax={range && i === 0 ? values[1] : max}
            aria-valuenow={v}
            aria-valuetext={format(v)}
            aria-disabled={disabled || undefined}
            onKeyDown={(e) => !disabled && onKey(e, i)}
            style={{ left: `${pct(v)}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-panel border-2 border-accent shadow-float outline-none focus-visible:ring-4 focus-visible:ring-focus"
          />
        ))}
      </div>
    </div>
  );
}
