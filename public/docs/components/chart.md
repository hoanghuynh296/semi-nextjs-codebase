# Chart

Charts in SVG on Semi tokens, no library: BarChart (grouped or stacked columns), LineChart (optional area wash), DonutChart (parts of a whole) and Sparkline (a trend in a tile). Series use the fixed chart-1…8 colours (validated for colour-blind readers in both themes); every chart has a legend for 2+ series, a hover / keyboard tooltip and a table view.

## When to use

- Compare categories (BarChart), show change over time (LineChart), parts of a whole with ≤ 5 parts (DonutChart), a trend next to a KPI (Sparkline).

## Use something else when

| Need | Use |
|---|---|
| One headline number | KpiCard (optionally with a Sparkline) |
| Exact values to compare and sort | DataTable |
| Two measures with different units | two charts, never a second y axis |
| More than 8 series | fold into “Khác”, or small multiples |

## Import

```tsx
import { BarChart, LineChart, DonutChart, Sparkline, type ChartSeries, type DonutSlice } from "@semi/ui";
```

## Examples

### Grouped columns

```tsx
import { BarChart } from "@semi/ui";

const DATA = [
  { month: "T6", pla: 120, petg: 80 },
  { month: "T7", pla: 150, petg: 96 },
  { month: "T8", pla: 132, petg: 118 },
  { month: "T9", pla: 178, petg: 104 },
  { month: "T10", pla: 196, petg: 140 },
];

export default function ChartBar() {
  return (
    <BarChart
      label="Bản in theo vật liệu, 5 tháng"
      data={DATA}
      index="month"
      series={[
        { key: "pla", label: "PLA" },
        { key: "petg", label: "PETG" },
      ]}
      format={(v) => `${v} bản`}
    />
  );
}
```

### Stacked columns

```tsx
import { BarChart } from "@semi/ui";

const DATA = [
  { day: "T2", web: 32, shop: 18, partner: 9 },
  { day: "T3", web: 41, shop: 22, partner: 12 },
  { day: "T4", web: 28, shop: 25, partner: 8 },
  { day: "T5", web: 47, shop: 19, partner: 14 },
  { day: "T6", web: 53, shop: 31, partner: 16 },
  { day: "T7", web: 61, shop: 44, partner: 20 },
  { day: "CN", web: 38, shop: 40, partner: 11 },
];

export default function ChartStacked() {
  return (
    <BarChart
      stacked
      label="Đơn hàng theo kênh, 7 ngày"
      data={DATA}
      index="day"
      series={[
        { key: "web", label: "Website" },
        { key: "shop", label: "Cửa hàng" },
        { key: "partner", label: "Đối tác" },
      ]}
    />
  );
}
```

### Lines with an area wash

```tsx
import { LineChart } from "@semi/ui";

const DATA = Array.from({ length: 12 }, (_, i) => ({
  week: `Tuần ${i + 1}`,
  revenue: Math.round(40 + i * 4 + 10 * Math.sin(i / 1.6)),
  cost: Math.round(28 + i * 2 + 6 * Math.cos(i / 2)),
}));

export default function ChartLine() {
  return (
    <LineChart
      area
      label="Doanh thu và chi phí, 12 tuần (triệu ₫)"
      data={DATA}
      index="week"
      formatIndex={(w) => w.replace("Tuần ", "T")}
      series={[
        { key: "revenue", label: "Doanh thu" },
        { key: "cost", label: "Chi phí" },
      ]}
      format={(v) => `${v} tr ₫`}
    />
  );
}
```

### Donut

```tsx
import { DonutChart } from "@semi/ui";

export default function ChartDonut() {
  return (
    <DonutChart
      label="Đơn theo trạng thái"
      centerLabel="Tổng đơn"
      data={[
        { label: "Đã giao", value: 812 },
        { label: "Đang in", value: 164 },
        { label: "Chờ thanh toán", value: 96 },
        { label: "Huỷ", value: 31 },
      ]}
    />
  );
}
```

### Sparkline in a KPI row

```tsx
import { KpiCard, Sparkline } from "@semi/ui";

export default function ChartSparkline() {
  return (
    <div className="grid gap-3 @2xl:grid-cols-2">
      <div className="relative">
        <KpiCard label="Doanh thu tuần" value="61,8 tr ₫" sub="+12% so với tuần trước" tone="good" />
        <Sparkline label="Doanh thu 8 tuần" values={[42, 45, 44, 50, 48, 55, 58, 62]} className="absolute right-4 bottom-4" />
      </div>
      <div className="relative">
        <KpiCard label="Tỉ lệ lỗi" value="1,8%" sub="-0,4 điểm" tone="good" />
        <Sparkline label="Tỉ lệ lỗi 8 tuần" values={[3.1, 2.9, 3.4, 2.6, 2.4, 2.2, 2.0, 1.8]} className="absolute right-4 bottom-4" />
      </div>
    </div>
  );
}
```

## API

### BarChart

Columns per category: grouped (default) or `stacked`. ≤24px columns with 4px rounded tops, a 2px gap between stacked
segments. Hover or ←/→ on the focused chart shows every series of a category; the table view lists all values.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` * | `Row[]` |  |  |
| `index` * | `string` |  | Field holding the category / date of each row (the x axis). |
| `series` * | `ChartSeries[]` |  |  |
| `label` * | `string` |  | Accessible name; also the table view's caption. Put the visible title in your card heading. |
| `height` | `number` |  | Plot height in px (default 240). |
| `format` | `(value: number) => string` |  | How values read (tooltip, table, labels); axis ticks are compacted (1,2K). |
| `formatIndex` | `(value: string) => string` |  | How an index value reads ("2026-10" → "T10"). |
| `className` | `string` |  |  |
| `stacked` | `boolean` |  |  |

### LineChart

Lines over an index (usually time), 2px with an end dot; `area` adds a 10% wash under each line. A crosshair snaps
to the nearest index on hover or ←/→ and lists every series.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` * | `Row[]` |  |  |
| `index` * | `string` |  | Field holding the category / date of each row (the x axis). |
| `series` * | `ChartSeries[]` |  |  |
| `label` * | `string` |  | Accessible name; also the table view's caption. Put the visible title in your card heading. |
| `height` | `number` |  | Plot height in px (default 240). |
| `format` | `(value: number) => string` |  | How values read (tooltip, table, labels); axis ticks are compacted (1,2K). |
| `formatIndex` | `(value: string) => string` |  | How an index value reads ("2026-10" → "T10"). |
| `className` | `string` |  |  |
| `area` | `boolean` |  |  |

### DonutChart

Parts of a whole (≤ 5 slices; fold the rest into "Khác"). Slices are separated by a 2px surface gap; the centre shows
the total (or `centerLabel`); the legend lists every slice with its value and share.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` * | `DonutSlice[]` |  |  |
| `label` * | `string` |  |  |
| `format` | `(value: number) => string` | `(v) => v.toLocaleString("vi-VN")` |  |
| `centerLabel` | `string` |  | Text under the centre figure ("Tổng đơn"). |
| `size` | `number` | `180` |  |
| `className` | `string` |  |  |

### Sparkline

A small trend line for a KPI tile or a table cell: muted line, the last point in the accent. Decorative detail:
the label states the trend for screen readers (first, last, min, max).

| Prop | Type | Default | Description |
|---|---|---|---|
| `values` * | `number[]` |  |  |
| `label` * | `string` |  |  |
| `width` | `number` | `96` |  |
| `height` | `number` | `28` |  |
| `className` | `string` |  |  |

## Accessibility

- Each chart is role="img" with a label; focus it and use ←/→ (Home / End) to read every index in the tooltip; “Xem bảng” switches to a table with all values.
- Colour is never the only channel: legend (2+ series), tooltip labels and the table view carry identity; text stays in text tokens.

## Notes

- Keep a series' colour fixed per entity (color: slot) so a filter never repaints the others.
- Put the visible title in the card around the chart; label is the accessible name.

<!-- GENERATED by scripts/build-docs.mjs from examples/chart/ and the types in src/ -->
