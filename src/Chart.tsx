"use client";

// Charts drawn in SVG on Semi tokens, no chart library: BarChart (grouped / stacked columns), LineChart (lines, optional
// area wash), DonutChart (parts of a whole) and Sparkline (a trend in a tile). Series take the fixed chart-1…8 order
// (never cycled), text stays in text tokens, every chart has a legend (2+ series), a hover / keyboard tooltip and a
// table view, so no value depends on colour or hovering alone.
import React, { useEffect, useId, useMemo, useState } from "react";
import { Button } from "./Button";
import { Table, TBody, TD, TH, THead, TR } from "./Table";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export interface ChartSeries {
  /** Field of each data row that holds this series' value. */
  key: string;
  label: string;
  /** Chart colour slot 1–8 (default: the series' position). Keep it fixed per entity so filters never repaint. */
  color?: number;
}

type Row = Record<string, unknown>;
const slot = (s: ChartSeries, i: number) => `var(--color-chart-${((s.color ?? i + 1) - 1) % 8 + 1})`;
const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Width of an element, kept up to date (charts redraw for their container, not the window). */
function useWidth<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  // a callback ref: the chart unmounts while the table view shows, so observe whichever element is mounted now
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, [el]);
  return [setEl, width] as const;
}

/** 0 … a round top value with 4–5 clean ticks (1 / 2 / 5 × 10ⁿ). */
function niceTicks(max: number, min = 0, count = 4) {
  const span = Math.max(max - min, 1e-9);
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { ticks, lo, hi };
}

interface ChartCommon {
  data: Row[];
  /** Field holding the category / date of each row (the x axis). */
  index: string;
  series: ChartSeries[];
  /** Accessible name; also the table view's caption. Put the visible title in your card heading. */
  label: string;
  /** Plot height in px (default 240). */
  height?: number;
  /** How values read (tooltip, table, labels); axis ticks are compacted (1,2K). */
  format?: (value: number) => string;
  /** How an index value reads ("2026-10" → "T10"). */
  formatIndex?: (value: string) => string;
  className?: string;
}

/** Legend, tooltip, table view and keyboard handling shared by BarChart and LineChart. */
function CartesianFrame({
  data,
  index,
  series,
  label,
  height = 240,
  format = (v) => v.toLocaleString("vi-VN"),
  formatIndex = (v) => v,
  className,
  kind,
  stacked = false,
  area = false,
}: ChartCommon & { kind: "bar" | "line"; stacked?: boolean; area?: boolean }) {
  const t = useSemiLocale();
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const id = useId();
  const values = data.map((r) => series.map((s) => num(r[s.key])));
  const max = Math.max(0, ...values.map((v) => (stacked ? v.reduce((a, b) => a + Math.max(0, b), 0) : Math.max(...v))));
  const min = Math.min(0, ...values.flat());
  const { ticks, lo, hi } = niceTicks(max || 1, min);
  const left = Math.max(28, ...ticks.map((v) => compact.format(v).length * 6.5 + 10));
  const bottom = 22;
  const top = 8;
  const plotW = Math.max(0, width - left - 4);
  const plotH = height - top - bottom;
  const y = (v: number) => top + plotH - ((v - lo) / (hi - lo || 1)) * plotH;
  const band = data.length ? plotW / data.length : 0;
  const cx = (i: number) => left + band * i + band / 2;
  const labelEvery = Math.max(1, Math.ceil((data.length * 48) / Math.max(plotW, 1)));

  const onKey = (e: React.KeyboardEvent) => {
    const last = data.length - 1;
    const to = { ArrowRight: Math.min(last, (active ?? -1) + 1), ArrowLeft: Math.max(0, (active ?? 1) - 1), Home: 0, End: last }[e.key];
    if (to === undefined) return e.key === "Escape" && setActive(null);
    e.preventDefault();
    setActive(to);
  };
  const fromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - r.left - left) / (band || 1));
    setActive(i >= 0 && i < data.length ? i : null);
  };

  const bars = () =>
    data.map((row, i) => {
      const vs = values[i];
      if (stacked) {
        let base = 0;
        const w = Math.min(24, band * 0.6);
        return vs.map((v, k) => {
          const from = base;
          base += Math.max(0, v);
          const isTop = vs.slice(k + 1).every((x) => x <= 0);
          const y0 = y(from);
          const y1 = y(base);
          const h = Math.max(0, y0 - y1 - (k > 0 ? 2 : 0)); // 2px surface gap between segments
          return <BarRect key={k} x={cx(i) - w / 2} y={y1} w={w} h={h} r={isTop ? 4 : 0} fill={slot(series[k], k)} dim={active !== null && active !== i} />;
        });
      }
      const gap = 2;
      const w = Math.min(24, (band * 0.7 - gap * (vs.length - 1)) / vs.length);
      const groupW = w * vs.length + gap * (vs.length - 1);
      return vs.map((v, k) => {
        const yv = y(Math.max(0, v));
        const y0 = y(Math.min(0, v));
        return <BarRect key={k} x={cx(i) - groupW / 2 + k * (w + gap)} y={yv} w={w} h={Math.max(0, y0 - yv)} r={4} fill={slot(series[k], k)} dim={active !== null && active !== i} />;
      });
    });

  const lines = () =>
    series.map((s, k) => {
      const pts = data.map((r, i) => [cx(i), y(num(r[s.key]))] as const);
      if (!pts.length) return null;
      const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join(" ");
      const last = pts[pts.length - 1];
      return (
        <g key={s.key}>
          {area && <path d={`${d} L${last[0]},${y(Math.max(lo, 0))} L${pts[0][0]},${y(Math.max(lo, 0))} Z`} fill={slot(s, k)} opacity={0.1} />}
          <path d={d} fill="none" stroke={slot(s, k)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={last[0]} cy={last[1]} r={4} fill={slot(s, k)} stroke="var(--color-panel)" strokeWidth={2} />
          {active !== null && <circle cx={pts[active][0]} cy={pts[active][1]} r={4} fill={slot(s, k)} stroke="var(--color-panel)" strokeWidth={2} />}
        </g>
      );
    });

  const tipLeft = active === null ? 0 : Math.min(Math.max(cx(active) + 12, 0), Math.max(0, width - 180));
  return (
    <div className={cn("space-y-2", className)}>
      {table ? (
        <ChartTable label={label} data={data} index={index} series={series} format={format} formatIndex={formatIndex} />
      ) : (
        <div ref={wrapRef} className="relative" style={{ height }}>
          {width > 0 && (
            <svg
              role="img"
              aria-label={label}
              aria-describedby={active !== null ? `${id}-tip` : undefined}
              tabIndex={0}
              width={width}
              height={height}
              onPointerMove={fromPointer}
              onPointerLeave={() => setActive(null)}
              onKeyDown={onKey}
              onFocus={() => setActive((a) => a ?? data.length - 1)}
              onBlur={() => setActive(null)}
              className="block outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-control"
            >
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={left} x2={width - 4} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--color-line-hover)" : "var(--color-divider)"} strokeWidth={1} />
                  <text x={left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-[var(--color-text-muted)] text-caption tabular-nums">
                    {compact.format(v)}
                  </text>
                </g>
              ))}
              {data.map((r, i) =>
                i % labelEvery === 0 ? (
                  <text key={i} x={cx(i)} y={height - 6} textAnchor="middle" className="fill-[var(--color-text-muted)] text-caption">
                    {formatIndex(String(r[index]))}
                  </text>
                ) : null,
              )}
              {kind === "line" && active !== null && <line x1={cx(active)} x2={cx(active)} y1={top} y2={top + plotH} stroke="var(--color-line-hover)" strokeWidth={1} />}
              {kind === "bar" ? bars() : lines()}
            </svg>
          )}
          {active !== null && data[active] && (
            <div id={`${id}-tip`} role="status" className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-control border border-line bg-panel px-3 py-2 shadow-overlay" style={{ left: tipLeft }}>
              <div className="text-caption text-muted">{formatIndex(String(data[active][index]))}</div>
              {series.map((s, k) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: slot(s, k) }} />
                  <span className="text-label font-semibold text-contrast tabular-nums">{format(num(data[active][s.key]))}</span>
                  <span className="text-caption text-muted">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {series.length > 1 &&
          series.map((s, k) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-label text-body">
              <span aria-hidden className={kind === "line" ? "h-0.5 w-3 rounded-full" : "h-2.5 w-2.5 rounded-chip"} style={{ background: slot(s, k) }} />
              {s.label}
            </span>
          ))}
        <Button size="sm" variant="ghost" icon={table ? "chart" : "grid"} onClick={() => setTable((v) => !v)} className="ml-auto">
          {table ? t.chartView : t.tableView}
        </Button>
      </div>
    </div>
  );
}

/** A column with a 4px rounded data end, square at the baseline. */
function BarRect({ x, y, w, h, r, fill, dim }: { x: number; y: number; w: number; h: number; r: number; fill: string; dim: boolean }) {
  if (h <= 0 || w <= 0) return null;
  const rr = Math.min(r, w / 2, h);
  const d = `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
  return <path d={d} fill={fill} opacity={dim ? 0.45 : 1} />;
}

/** The same numbers as a table (the accessible, copyable view of every chart). */
function ChartTable({ label, data, index, series, format, formatIndex }: { label: string; data: Row[]; index: string; series: ChartSeries[]; format: (v: number) => string; formatIndex: (v: string) => string }) {
  return (
    <div className="rounded-card border border-line overflow-hidden">
      <Table>
        <caption className="sr-only">{label}</caption>
        <THead>
          <TR>
            <TH>{index}</TH>
            {series.map((s) => (
              <TH key={s.key} align="right">
                {s.label}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {data.map((r, i) => (
            <TR key={i}>
              <TD>{formatIndex(String(r[index]))}</TD>
              {series.map((s) => (
                <TD key={s.key} numeric>
                  {format(num(r[s.key]))}
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

/**
 * Columns per category: grouped (default) or `stacked`. ≤24px columns with 4px rounded tops, a 2px gap between stacked
 * segments. Hover or ←/→ on the focused chart shows every series of a category; the table view lists all values.
 */
export function BarChart(props: ChartCommon & { stacked?: boolean }) {
  return <CartesianFrame {...props} kind="bar" />;
}

/**
 * Lines over an index (usually time), 2px with an end dot; `area` adds a 10% wash under each line. A crosshair snaps
 * to the nearest index on hover or ←/→ and lists every series.
 */
export function LineChart(props: ChartCommon & { area?: boolean }) {
  return <CartesianFrame {...props} kind="line" />;
}

export interface DonutSlice {
  label: string;
  value: number;
  /** Chart colour slot 1–8 (default: position). */
  color?: number;
}

/**
 * Parts of a whole (≤ 5 slices; fold the rest into "Khác"). Slices are separated by a 2px surface gap; the centre shows
 * the total (or `centerLabel`); the legend lists every slice with its value and share.
 */
export function DonutChart({
  data,
  label,
  format = (v) => v.toLocaleString("vi-VN"),
  centerLabel,
  size = 180,
  className,
}: {
  data: DonutSlice[];
  label: string;
  format?: (value: number) => string;
  /** Text under the centre figure ("Tổng đơn"). */
  centerLabel?: string;
  size?: number;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + Math.max(0, d.value), 0);
  const r = size / 2;
  const inner = r * 0.62;
  const arcs = useMemo(() => {
    let a0 = -Math.PI / 2;
    return data.map((d) => {
      const a1 = a0 + (total ? (Math.max(0, d.value) / total) * Math.PI * 2 : 0);
      const arc = { a0, a1 };
      a0 = a1;
      return arc;
    });
  }, [data, total]);
  const point = (a: number, rad: number) => [r + rad * Math.cos(a), r + rad * Math.sin(a)];
  const path = (a0: number, a1: number) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = point(a0, r - 1);
    const [x1, y1] = point(a1, r - 1);
    const [x2, y2] = point(a1, inner);
    const [x3, y3] = point(a0, inner);
    return `M${x0},${y0} A${r - 1},${r - 1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${inner},${inner} 0 ${large} 0 ${x3},${y3} Z`;
  };
  const pct = (v: number) => (total ? `${Math.round((v / total) * 100)}%` : "0%");
  const shown = active !== null ? data[active] : null;
  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          role="img"
          aria-label={`${label}: ${data.map((d) => `${d.label} ${format(d.value)} (${pct(d.value)})`).join(", ")}`}
          tabIndex={0}
          width={size}
          height={size}
          onKeyDown={(e) => {
            const to = { ArrowRight: ((active ?? -1) + 1) % data.length, ArrowLeft: ((active ?? 0) - 1 + data.length) % data.length }[e.key];
            if (to !== undefined) {
              e.preventDefault();
              setActive(to);
            }
          }}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-full"
        >
          {arcs.map(({ a0, a1 }, i) =>
            a1 > a0 ? (
              <path
                key={i}
                d={path(a0, a1)}
                fill={`var(--color-chart-${((data[i].color ?? i + 1) - 1) % 8 + 1})`}
                stroke="var(--color-panel)"
                strokeWidth={2}
                opacity={active !== null && active !== i ? 0.45 : 1}
                onPointerEnter={() => setActive(i)}
              />
            ) : null,
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden>
          <span className="text-title-lg font-semibold text-contrast">{format(shown ? shown.value : total)}</span>
          <span className="text-caption text-muted max-w-[60%] truncate">{shown ? shown.label : centerLabel}</span>
        </div>
      </div>
      <ul className="space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <li key={d.label} className={cn("flex items-center gap-2 text-label", active !== null && active !== i && "opacity-60")}>
            <span aria-hidden className="h-2.5 w-2.5 rounded-chip shrink-0" style={{ background: `var(--color-chart-${((d.color ?? i + 1) - 1) % 8 + 1})` }} />
            <span className="text-body truncate">{d.label}</span>
            <span className="ml-auto pl-4 font-medium text-contrast tabular-nums">{format(d.value)}</span>
            <span className="w-10 text-right text-muted tabular-nums">{pct(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A small trend line for a KPI tile or a table cell: muted line, the last point in the accent. Decorative detail:
 * the label states the trend for screen readers (first, last, min, max).
 */
export function Sparkline({ values, label, width = 96, height = 28, className }: { values: number[]; label: string; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => 2 + (i / (values.length - 1)) * (width - 6);
  const y = (v: number) => 3 + (1 - (v - min) / (max - min || 1)) * (height - 6);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <svg role="img" aria-label={`${label}: ${values[0]} → ${last} (min ${min}, max ${max})`} width={width} height={height} className={cn("block shrink-0", className)}>
      <path d={d} fill="none" stroke="var(--color-text-muted)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={3} fill="var(--color-accent)" stroke="var(--color-panel)" strokeWidth={1.5} />
    </svg>
  );
}
