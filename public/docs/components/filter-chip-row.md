# Filter chip row

A list page's filters as one line of chips (icon, label, chevron; solid with the value or count when on). Each chip opens a small multi-select popover, a switch chip toggles; the row scrolls sideways with ‹ › when it overflows, shows “Xoá lọc” while a filter is on and ends with the view tools. State in the URL with useFilterParams or the filterParams helpers.

## When to use

- The filters of a list, grid or table page on desktop and iPad (md+), under its SearchPill in a StickyContextBar.
- Facets with a few to a few dozen values each (status, channel, owner, country), more than one value at a time.

## Use something else when

| Need | Use |
|---|---|
| Filters on phones (below md) | PhoneFilterBar + FilterPanel |
| One choice among 2–5 views of the same list | Pills or TextTabs |
| A facet with hundreds of values (a customer, a product) | a Combobox in FilterPanel's children |

## Import

```tsx
import { FilterChipRow, FilterChip, FilterOptions, useFilterParams, readFilters, writeFilters, clearFilters } from "@semi/ui";
```

## Examples

### State in the URL, with ViewSwitch

```tsx
"use client";

import { FilterChipRow, ResultLine, ViewSwitch, useFilterParams, type ViewMode } from "@semi/ui";

const ORDERS = [
  { id: "1024", status: "new", channel: "shopee", paid: true },
  { id: "1025", status: "packing", channel: "web", paid: true },
  { id: "1026", status: "new", channel: "web", paid: false },
  { id: "1027", status: "shipped", channel: "shopee", paid: true },
  { id: "1028", status: "packing", channel: "store", paid: false },
];

export default function FilterChipRowUrlState() {
  // state lives in the URL (?o.status=new&o.paid=1): reload, share a link, Back / Forward all keep it
  const f = useFilterParams(
    [
      { key: "status", label: "Trạng thái", icon: "activity", options: [
        { value: "new", label: "Mới", count: 2 },
        { value: "packing", label: "Đang đóng gói", count: 2 },
        { value: "shipped", label: "Đã giao", count: 1 },
      ] },
      { key: "channel", label: "Kênh bán", icon: "store", options: [
        { value: "shopee", label: "Shopee" },
        { value: "web", label: "Website" },
        { value: "store", label: "Cửa hàng" },
      ] },
      { key: "paid", label: "Đã thanh toán", icon: "check", kind: "switch" },
    ],
    { prefix: "o." },
  );
  const view: ViewMode = f.params.get("view") === "grid" ? "grid" : "list";
  const rows = ORDERS.filter(
    (o) =>
      (!f.values.status.length || f.values.status.includes(o.status)) &&
      (!f.values.channel.length || f.values.channel.includes(o.channel)) &&
      (!f.values.paid.length || o.paid),
  );
  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <FilterChipRow
        filters={f.filters}
        onChange={f.onChange}
        onClear={f.onClear}
        trailing={<ViewSwitch view={view} onViewChange={(v) => f.setParams({ view: v === "list" ? null : v }, "replace")} />}
      />
      <ResultLine count={rows.length} unit="đơn hàng" />
      <p className="text-label text-muted">{rows.map((o) => `#${o.id}`).join(" · ") || "—"}</p>
    </div>
  );
}
```

### More chips than fit

```tsx
"use client";

import { useState } from "react";
import { FilterChipRow, type FilterDef } from "@semi/ui";

const SPECS: Omit<FilterDef, "selected">[] = [
  { key: "status", label: "Trạng thái", icon: "activity", options: [{ value: "new", label: "Mới" }, { value: "quoting", label: "Đang báo giá" }, { value: "won", label: "Đã chốt" }] },
  { key: "country", label: "Quốc gia", icon: "mapPin", options: [{ value: "DE", label: "Đức" }, { value: "AE", label: "UAE" }, { value: "IN", label: "Ấn Độ" }] },
  { key: "owner", label: "Phụ trách", icon: "user", options: [{ value: "ha", label: "Trần Thu Hà" }, { value: "nam", label: "Lê Hoàng Nam" }] },
  { key: "source", label: "Nguồn", icon: "database", options: [{ value: "fair", label: "Gulfood 2026" }, { value: "web", label: "Website" }] },
  { key: "mail", label: "Thư", icon: "mail", options: [{ value: "sent", label: "Đã gửi" }, { value: "replied", label: "Đã trả lời" }] },
  { key: "product", label: "Mặt hàng", icon: "box", options: [{ value: "pepper", label: "Tiêu đen" }, { value: "cinnamon", label: "Quế" }] },
  { key: "big", label: "Từ 100 tấn/năm", icon: "gauge", kind: "switch" },
];

export default function FilterChipRowMany() {
  // local state; the row scrolls sideways with ‹ › when the chips do not fit
  const [sel, setSel] = useState<Record<string, string[]>>({ country: ["DE", "AE"] });
  const filters: FilterDef[] = SPECS.map((s) => ({ ...s, selected: sel[s.key] ?? [] }));
  return (
    <div className="w-full min-w-0 max-w-xl">
      <FilterChipRow filters={filters} onChange={(key, selected) => setSel({ ...sel, [key]: selected })} onClear={() => setSel({})} />
    </div>
  );
}
```

## API

### FilterChipRow

The filter chips of a list page on one line. When they overflow, the row scrolls sideways and ‹ › buttons appear
(hidden from screen readers and the tab order: every chip is reachable by Tab, which scrolls it into view).
"Xoá lọc" shows while a filter is on; `trailing` (ViewSwitch) sits at the end behind a divider.

| Prop | Type | Default | Description |
|---|---|---|---|
| `filters` * | `FilterDef[]` |  |  |
| `onChange` * | `(key: string, selected: string[]) => void` |  |  |
| `onClear` | `() => void` |  | Clears every filter; the "Xoá lọc" button shows while one is on. |
| `trailing` | `React.ReactNode` |  | Tools at the end of the row: ViewSwitch, a sort that is not in a ResultLine. |
| `label` | `string` |  | Accessible name of the chip group (default "Bộ lọc"). |
| `className` | `string` |  |  |

### FilterChip

One filter facet as a chip. A `multi` filter opens a popover of checkboxes (aria-expanded on the chip); a `switch`
filter toggles on click (aria-pressed). Active, it turns solid (`bg-inverted`) and shows the one value or the count.

| Prop | Type | Default | Description |
|---|---|---|---|
| `def` * | `FilterDef` |  |  |
| `onChange` * | `(selected: string[]) => void` |  |  |

### FilterOptions

The checkbox list of one multi filter (FilterChip's popover, FilterPanel's accordion).

| Prop | Type | Default | Description |
|---|---|---|---|
| `def` * | `FilterDef` |  |  |
| `onChange` * | `(selected: string[]) => void` |  |  |
| `className` | `string` |  |  |

## Accessibility

- Every chip is a button: a multi chip has aria-haspopup=dialog and aria-expanded (its popover traps nothing, Escape returns focus to the chip); a switch chip has aria-pressed.
- An active chip's name says the filter and its value (“Quốc gia: Đức”, or “Quốc gia · 2”); the options are named checkboxes in a group named after the filter.
- The ‹ › buttons are for the pointer only (aria-hidden, out of the tab order): Tab reaches every chip and scrolls it into view.

## Notes

- One line, never wrapping rows of chips (C-032 L3); more than one row → this row.
- URL format: one repeated param per filter (?f.status=new&f.status=won&f.big=1); unknown values from an old link are dropped. useFilterParams reads location after mount (prerender-safe) and pushes a history entry per change, so Back undoes a filter.
- With Next's router of your own: readFilters(useSearchParams(), specs) in, router.push(`?${writeFilters(params, { status: [...] }, specs)}`) out.

<!-- GENERATED by scripts/build-docs.mjs from examples/filter-chip-row/ and the types in src/ -->
