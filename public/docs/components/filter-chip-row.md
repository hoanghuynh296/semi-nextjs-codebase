# Filter chip row

A list page's filters as one line of chips (icon, label, chevron; solid with the value or count when on). Each chip opens a small multi-select popover, a single-choice chip a radio menu (“Hộp thư: Tất cả”), a switch chip toggles; the page's views (Pills) can lead the row; the row scrolls sideways with ‹ › when it overflows, shows “Xoá lọc” while a filter is on and ends with the view tools. State in the URL with useFilterParams or the filterParams helpers.

## When to use

- The filters of a list, grid or table page on desktop and iPad (md+), under its SearchPill in a StickyContextBar.
- Facets with a few to a few dozen values each (status, channel, owner, country), more than one value at a time.
- A single-choice facet (mailbox, folder, warehouse, workspace) with a default option: FilterSpec kind "single" with clearValue.

## Use something else when

| Need | Use |
|---|---|
| Filters on phones (below md) | PhoneFilterBar + FilterPanel |
| One choice among 2–5 views of the same list | Pills in FilterChipRow leading (PhoneFilterBar typeItems on phones), or TextTabs as the heading |
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

### Views and single-choice filters

```tsx
"use client";

import { useState } from "react";
import { FilterChipRow, Pills, ResultLine, type FilterDef } from "@semi/ui";

const MAIL = [
  { id: "Báo giá tiêu đen", box: "sales", folder: "inbox", open: true },
  { id: "Đơn đặt hàng quế", box: "sales", folder: "inbox", open: false },
  { id: "Hoá đơn tháng 10", box: "billing", folder: "archive", open: false },
  { id: "Hỏi giá hồi", box: "support", folder: "inbox", open: true },
];
const VIEWS = [
  { key: "open", label: "Chưa xử lý" },
  { key: "all", label: "Tất cả" },
];

export default function FilterChipRowViews() {
  // the default view is "Chưa xử lý", not "all"
  const [view, setView] = useState("open");
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const filters: FilterDef[] = [
    {
      key: "box",
      label: "Hộp thư",
      icon: "inbox",
      kind: "single",
      clearValue: "all",
      options: [
        { value: "all", label: "Tất cả" },
        { value: "sales", label: "Bán hàng", count: 2 },
        { value: "billing", label: "Kế toán", count: 1 },
        { value: "support", label: "Hỗ trợ", count: 1 },
      ],
      selected: sel.box ?? [],
    },
    {
      key: "folder",
      label: "Thư mục",
      icon: "folder",
      kind: "single",
      options: [
        { value: "inbox", label: "Hộp thư đến" },
        { value: "archive", label: "Lưu trữ" },
      ],
      selected: sel.folder ?? [],
    },
  ];
  const box = sel.box?.[0] ?? "all";
  const rows = MAIL.filter((m) => (view === "all" || m.open) && (box === "all" || m.box === box) && (!sel.folder?.length || sel.folder.includes(m.folder)));
  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <FilterChipRow
        leading={<Pills value={view} onChange={setView} options={VIEWS} />}
        filters={filters}
        onChange={(key, selected) => setSel({ ...sel, [key]: selected })}
        onClear={() => setSel({})}
      />
      <ResultLine count={rows.length} unit="thư" />
      <p className="text-label text-muted">{rows.map((m) => m.id).join(" · ") || "—"}</p>
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
"Xoá lọc" shows while a filter is on; `leading` (the page's views as Pills) sits before the chips and `trailing`
(ViewSwitch) at the end, each behind a divider; neither scrolls with the chips.

| Prop | Type | Default | Description |
|---|---|---|---|
| `filters` * | `FilterDef[]` |  |  |
| `onChange` * | `(key: string, selected: string[]) => void` |  |  |
| `onClear` | `() => void` |  | Clears every filter; the "Xoá lọc" button shows while one is on. |
| `leading` | `React.ReactNode` |  | Before the chips: the page's views (`<Pills>`: Đang mở · Đã đóng · Tất cả), the md+ twin of PhoneFilterBar's `typeItems`. A view is not a filter: "Xoá lọc" leaves it alone. Keep it short (2–5 views); it does not scroll. |
| `trailing` | `React.ReactNode` |  | Tools at the end of the row: ViewSwitch, a sort that is not in a ResultLine. |
| `label` | `string` |  | Accessible name of the chip group (default "Bộ lọc"). |
| `className` | `string` |  |  |

### FilterChip

One filter facet as a chip. A `multi` filter opens a popover of checkboxes (aria-expanded on the chip); a `switch`
filter toggles on click (aria-pressed); a `single` filter opens a menu of radio items (`menuitemradio`) and always
reads "Hộp thư: Tất cả". Active (a value other than `clearValue`), it turns solid (`bg-inverted`) and shows the one
value or the count.

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
- A single chip has aria-haspopup=menu; its options are menuitemradio with aria-checked, the menu opens on the checked one (↑/↓, Enter / Space pick, Escape returns to the chip). Its visible name is the filter and its value (“Hộp thư: Tất cả”).
- An active chip's name says the filter and its value (“Quốc gia: Đức”, or “Quốc gia · 2”); the options are named checkboxes in a group named after the filter.
- The ‹ › buttons are for the pointer only (aria-hidden, out of the tab order): Tab reaches every chip and scrolls it into view.

## Notes

- One line, never wrapping rows of chips (C-032 L3); more than one row → this row.
- A single filter has one value in the URL (?f.box=sales) and none while its clearValue is in effect: selected is [] then (not an active filter, “Xoá lọc” resets it), so read it as selected[0] ?? clearValue. Without clearValue nothing is checked until a value is picked.
- `leading` holds the page's views (Pills), the md+ twin of PhoneFilterBar typeItems. A view is not a filter: “Xoá lọc” leaves it, and it does not scroll with the chips.
- URL format: one repeated param per filter (?f.status=new&f.status=won&f.big=1); unknown values from an old link are dropped. useFilterParams reads the URL after hydration (prerender-safe, no useSearchParams), writes with history.pushState(null, …) so Next's useSearchParams and router.refresh() keep the filters, pushes one history entry per change (Back undoes a filter) and follows Back / Forward, other hooks on the page and (with the Navigation API, or on the next render) a Link or router.push to the same route.
- With Next's router of your own: readFilters(useSearchParams(), specs) in, router.push(`?${writeFilters(params, { status: [...] }, specs)}`) out.
- Without the Navigation API (Firefox, Safari before 26) the hook re-reads the URL on Back / Forward, on its own writes and whenever its component renders. A hook in a component that stays mounted and does not re-render (a layout) can then miss a Link or router.push to the same route: there, read the filters with useSearchParams + readFilters (inside Suspense) and write them with writeFilters + router.push instead.

<!-- GENERATED by scripts/build-docs.mjs from examples/filter-chip-row/ and the types in src/ -->
