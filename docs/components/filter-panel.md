# Filter panel

Filters on phones: one segmented pill (the page's views · Bộ lọc with the count · sort and view settings) that opens a full-screen panel: sort first, booleans as switches, one accordion per filter (a radio group for a single-choice one), “Xem N kết quả” at the bottom. From sm the panel is a side sheet, also the “Bộ lọc” panel of a page with more filters than its chip row shows.

## When to use

- Below md on every page that has a FilterChipRow on desktop (same filters, same state).
- A desktop page whose filters do not fit in chips (many facets, a date range): a Bộ lọc button opens the panel as a side sheet.

## Use something else when

| Need | Use |
|---|---|
| Filters on desktop and iPad | FilterChipRow |
| A form in a sheet (edit a record) | Drawer |

## Import

```tsx
import { PhoneFilterBar, FilterPanel } from "@semi/ui";
```

## Examples

### Phone bar and panel

```tsx
"use client";

import { useState } from "react";
import { FilterPanel, PhoneFilterBar, activeFilterCount, type FilterDef } from "@semi/ui";

const SPECS: Omit<FilterDef, "selected">[] = [
  { key: "status", label: "Trạng thái", icon: "activity", options: [{ value: "new", label: "Mới", count: 12 }, { value: "quoting", label: "Đang báo giá", count: 5 }, { value: "won", label: "Đã chốt", count: 31 }] },
  { key: "country", label: "Quốc gia", icon: "mapPin", options: [{ value: "DE", label: "Đức" }, { value: "AE", label: "UAE" }, { value: "IN", label: "Ấn Độ" }] },
  { key: "owner", label: "Phụ trách", icon: "user", options: [{ value: "ha", label: "Trần Thu Hà" }, { value: "nam", label: "Lê Hoàng Nam" }] },
  { key: "big", label: "Từ 100 tấn/năm", icon: "gauge", kind: "switch" },
];
const VIEWS = { all: "Tất cả", pending: "Chờ duyệt", mine: "Của tôi" } as const;

export default function FilterPanelPhone() {
  const [sel, setSel] = useState<Record<string, string[]>>({ status: ["new"] });
  const [view, setView] = useState<keyof typeof VIEWS>("all");
  const [sort, setSort] = useState("recent");
  const [open, setOpen] = useState(false);
  const filters: FilterDef[] = SPECS.map((s) => ({ ...s, selected: sel[s.key] ?? [] }));
  return (
    <div className="w-full max-w-sm">
      <PhoneFilterBar
        typeLabel={VIEWS[view]}
        typeItems={(Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map((k) => ({ label: VIEWS[k], icon: k === view ? "check" : undefined, onSelect: () => setView(k) }))}
        activeCount={activeFilterCount(filters)}
        onOpenFilters={() => setOpen(true)}
        filtersOpen={open}
        onOpenSettings={() => setOpen(true)}
      />
      <FilterPanel
        open={open}
        onClose={() => setOpen(false)}
        filters={filters}
        onChange={(key, selected) => setSel({ ...sel, [key]: selected })}
        onClear={() => setSel({})}
        sort={{ value: sort, onChange: setSort, options: [{ value: "recent", label: "Mới thêm" }, { value: "volume", label: "Sản lượng năm" }] }}
        resultCount={sel.status?.length ? 12 : 48}
      />
    </div>
  );
}
```

## API

### PhoneFilterBar

The filter controls of a phone list page in one row: an optional type menu (the page's views), "Bộ lọc" with the
active count (opens FilterPanel) and an optional settings button (sort and view). Show it below `md` in place of
FilterChipRow (`md:hidden` / `max-md:hidden` around each).

| Prop | Type | Default | Description |
|---|---|---|---|
| `typeLabel` | `string` |  | The current view's name ("Tất cả"); shown with `typeItems`. |
| `typeItems` | `MenuItem[]` |  | The views to switch between (a Menu). |
| `activeCount` * | `number` |  | How many filters are on (activeFilterCount); shown on the button. |
| `onOpenFilters` * | `() => void` |  |  |
| `filtersOpen` | `boolean` |  | Whether the panel is open (aria-expanded on the button). |
| `onOpenSettings` | `() => void` |  | Opens the sort and view settings; the button shows when given. |
| `className` | `string` |  |  |

### FilterPanel

The full filter set in a modal panel: full screen on phones, a right side sheet from `sm` (also the "Bộ lọc" panel
of a desktop page with more filters than its chip row shows). Changes apply at once (the list behind updates);
"Xem N kết quả" closes. Focus moves in, is trapped, and returns to the opener; Escape closes.

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` * | `boolean` |  |  |
| `onClose` * | `() => void` |  |  |
| `filters` * | `FilterDef[]` |  |  |
| `onChange` * | `(key: string, selected: string[]) => void` |  |  |
| `onClear` * | `() => void` |  |  |
| `sort` | `SortDef` |  | Sort choices, shown first as a row of chips. |
| `resultCount` | `number` |  | Rows matching now, on the bottom button ("Xem 12 kết quả"); without it the button says "Đóng". |
| `title` | `string` |  | Heading (default "Bộ lọc"). |
| `children` | `React.ReactNode` |  | More settings under the filters (a ViewSwitch, a date range). |

## Accessibility

- The panel is a modal dialog named “Bộ lọc”: focus moves in, Tab stays inside, Escape closes and focus returns to the button that opened it.
- The Bộ lọc button's name is its text and the count (“Bộ lọc 2”); it has aria-haspopup=dialog and aria-expanded (filtersOpen).
- Each accordion is a heading with a button (aria-expanded, aria-controls); the sort is a group of toggle buttons (aria-pressed). A single-choice filter's accordion holds a radio group; its heading shows the current value.

## Notes

- Changes apply at once (the list behind updates); “Xem N kết quả” only closes. Keep the open state in the URL (?filters=1) when Back should close it.
- The accordions of filters that are on start open (at most two).
- Phone chrome stays within 2 rows (P1): the search, then this bar; the result line may follow.
- The type menu (typeItems) lists the page's views: give its items radio: true and checked, so they are menuitemradio and the menu opens on the current one.

<!-- GENERATED by scripts/build-docs.mjs from examples/filter-panel/ and the types in src/ -->
