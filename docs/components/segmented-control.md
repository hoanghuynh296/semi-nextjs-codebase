# Segmented control

Small single-choice filter sets shown in full (2–5 values, often with tabular-nums counts): a `raised` track (h32, radius 8, padding 4, gap 4) with h24 items (12px/600) and one solid `raised-2` pill (white in light theme) sliding in 300ms ease-out.

## When to use

- 2–5 filter values shown in full, often with counts (Tất cả · Đang mở · Đang báo giá · Đã chốt).
- Leading view switch of a FilterChipRow (`leading`) when a list splits into a few status slices.

## Use something else when

| Need | Use |
|---|---|
| 5+ sections of a page, or sections with icons (settings-like pages) | PillTabs |
| 2–4 top-level views of a discovery or reading page | TextTabs |
| Facet filters (supplier, owner, date, multiple active at once) | FilterChipRow |
| List ↔ grid and density icon toggles | ViewSwitch |

## Import

```tsx
import { SegmentedControl } from "@semi/ui";
```

## Examples

### Status filter with counts

```tsx
"use client";

import { useState } from "react";
import { Badge, Item, ItemGroup, SegmentedControl } from "@semi/ui";

const REQUESTS = [
  { id: "YC-204", title: "Hạt nhựa PLA Basic trắng 1kg × 40", status: "open" as const, statusLabel: "Đang mở", tone: "sky" as const },
  { id: "YC-203", title: "Đầu phun thép tôi 0.4mm × 12", status: "quoting" as const, statusLabel: "Đang báo giá", tone: "amber" as const },
  { id: "YC-201", title: "Bàn nhiệt PEI nhám 256×256 × 8", status: "done" as const, statusLabel: "Đã chốt", tone: "emerald" as const },
  { id: "YC-199", title: "Cuộn PETG HF xám 1kg × 24", status: "open" as const, statusLabel: "Đang mở", tone: "sky" as const },
];

export default function SegmentedControlCounts() {
  const [status, setStatus] = useState<"all" | "open" | "quoting" | "done">("all");
  const visible = status === "all" ? REQUESTS : REQUESTS.filter((r) => r.status === status);

  return (
    <div className="flex flex-col gap-group">
      <div>
        <SegmentedControl
          label="Trạng thái mua hàng"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { key: "all", label: "Tất cả", count: REQUESTS.length },
            { key: "open", label: "Đang mở", count: REQUESTS.filter((r) => r.status === "open").length },
            { key: "quoting", label: "Đang báo giá", count: REQUESTS.filter((r) => r.status === "quoting").length },
            { key: "done", label: "Đã chốt", count: REQUESTS.filter((r) => r.status === "done").length },
          ]}
        />
      </div>
      <ItemGroup label="Danh sách yêu cầu">
        {visible.map((r) => (
          <Item key={r.id} title={r.title} description={r.id} meta={<Badge tone={r.tone}>{r.statusLabel}</Badge>} />
        ))}
      </ItemGroup>
    </div>
  );
}
```

### Manual activation, guard and narrow scroll

```tsx
"use client";

import { useState } from "react";
import { SegmentedControl, Switch } from "@semi/ui";

const OPTIONS = [
  { key: "all", label: "Tất cả kho", count: 312 },
  { key: "hcm", label: "TP. Hồ Chí Minh", count: 148 },
  { key: "bd", label: "Bình Dương", count: 86 },
  { key: "dn", label: "Đà Nẵng", count: 34 },
  { key: "hn", label: "Hà Nội", count: 44 },
] as const;

export default function SegmentedControlOverflow() {
  const [warehouse, setWarehouse] = useState<(typeof OPTIONS)[number]["key"]>("all");
  const [manual, setManual] = useState(false);
  const [locked, setLocked] = useState(false);

  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-wrap items-center gap-group">
        <Switch checked={manual} onChange={setManual} label="Chuyển bằng Enter / Space (manual)" />
        <Switch checked={locked} onChange={setLocked} label="Khoá bộ lọc đang chọn" />
      </div>
      <div>
        <SegmentedControl
          label="Kho hàng"
          value={warehouse}
          onChange={(v) => setWarehouse(v)}
          onBeforeChange={() => !locked}
          activation={manual ? "manual" : "automatic"}
          options={[...OPTIONS]}
        />
      </div>
      <p className="text-ui text-muted">
        Đang xem: {OPTIONS.find((o) => o.key === warehouse)?.label}
        {locked ? " · Đang khoá chuyển đổi." : "."}
      </p>
    </div>
  );
}
```

## API

### SegmentedControl

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` * | `SegmentOption<T>[]` |  |  |
| `value` * | `T` |  |  |
| `onChange` * | `(value: T, meta: TabChangeMeta) => void` |  | Called when the chosen option changes; receives `{ via }` so URL state hooks can replace on arrow keys. |
| `onBeforeChange` | `TabBeforeChange<T>` |  | Guard run before switching; return or resolve `false` to keep the current option. |
| `activation` | `'automatic' \| 'manual'` | `"automatic"` | `"automatic"` (default) switches as arrows move; `"manual"` moves focus with arrows and commits on Enter / Space. |
| `label` * | `string` |  | Accessible name of the radio group ("Trạng thái"). |
| `className` | `string` |  |  |

## Accessibility

- WAI-ARIA radiogroup / radio with aria-checked and roving tabindex; ←/→, ↑/↓, Home and End.
- activation="manual" moves focus with arrows and selects on Enter or Space; onBeforeChange can refuse a switch.
- Scrolls sideways on phones with a 2px edge cue and keeps the active segment in view; sliding and fades turn off under prefers-reduced-motion.

## Notes

- Replaces the removed 0.x `Pills` component in 1.0.
- When to use which: PillTabs for 5+ sections or sections with icons · SegmentedControl for 2–5 filter values shown in full with counts · TextTabs for 2–4 top-level views of a discovery or reading page · FilterChipRow for filters.

<!-- GENERATED by scripts/build-docs.mjs from examples/segmented-control/ and the types in src/ -->
