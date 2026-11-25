# Data table

A table that sorts, filters, selects and pages rows on the client, built on Table: give it rows and columns, it keeps the state (or you control it).

## When to use

- Admin lists: orders, customers, inventory, logs — sort by a column, search, act on several rows.
- Many columns on a tablet or beside a rail: give the less important ones a `priority`, they fold into the first column instead of being cut.

## Use something else when

| Need | Use |
|---|---|
| A static table with no interaction | Table |
| Entities with images and states | a grid of Card |
| Server-side paging and sorting | control sort / page, pass the current page's rows |

## Import

```tsx
import { DataTable, type DataTableColumn, type DataTableSort } from "@semi/ui";
```

## Examples

### Orders: search, sort, select, page

```tsx
"use client";

import { useState } from "react";
import { Badge, Button, DataTable, SearchInput, toast, type DataTableColumn } from "@semi/ui";

type Order = { id: string; customer: string; status: "paid" | "pending" | "refunded"; total: number; date: string };
const STATUS = { paid: ["emerald", "Đã thanh toán"], pending: ["amber", "Chờ xử lý"], refunded: ["rose", "Hoàn tiền"] } as const;
const ORDERS: Order[] = Array.from({ length: 23 }, (_, i) => ({
  id: `SO-${1040 + i}`,
  customer: ["Nguyễn An", "Trần Bình", "Lê Chi", "Phạm Dũng", "Hoàng Hà"][i % 5],
  status: (["paid", "pending", "refunded"] as const)[i % 3],
  total: 180_000 + ((i * 97_000) % 2_400_000),
  date: `2026-10-${String(1 + (i % 28)).padStart(2, "0")}`,
}));

const COLUMNS: DataTableColumn<Order>[] = [
  { key: "id", header: "Mã đơn", sortable: true, cell: (o) => <span className="font-medium text-strong">{o.id}</span> },
  { key: "customer", header: "Khách hàng", sortable: true },
  { key: "status", header: "Trạng thái", value: (o) => STATUS[o.status][1], cell: (o) => <Badge tone={STATUS[o.status][0]} dot>{STATUS[o.status][1]}</Badge> },
  { key: "date", header: "Ngày", sortable: true },
  { key: "total", header: "Tổng", sortable: true, numeric: true, cell: (o) => `${o.total.toLocaleString("vi-VN")} ₫` },
];

export default function DataTableOrders() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder="Tìm mã đơn, khách hàng…" className="w-64" />
      <DataTable
        label="Đơn hàng"
        rows={ORDERS}
        columns={COLUMNS}
        getRowId={(o) => o.id}
        search={q}
        defaultSort={{ key: "date", dir: "desc" }}
        selectable
        bulkActions={(ids) => (
          <Button size="sm" variant="danger" icon="trash" onClick={() => toast({ title: `Đã huỷ ${ids.length} đơn`, tone: "danger" })}>
            Huỷ đơn
          </Button>
        )}
        pageSize={8}
      />
    </div>
  );
}
```

### Many columns: priority folds, sticky first column

Switch the width: at Máy tính bảng the priority 3 columns fold under the name; at Hẹp the priority 2 ones too, and the columns without a priority scroll sideways with the name kept in place and a strong line on the edge that has more columns.

```tsx
"use client";

import { useState } from "react";
import { Badge, DataTable, ToggleGroup, type DataTableColumn } from "@semi/ui";

type Customer = { id: string; name: string; phone: string; city: string; source: string; owner: string; lastContact: string; orders: number; spent: number };
const CUSTOMERS: Customer[] = Array.from({ length: 6 }, (_, i) => ({
  id: `KH-${2031 + i}`,
  name: ["Cửa hàng Minh An", "Nhà sách Phú Lợi", "Quán Bếp Nhà", "Tiệm bánh Hồng Phúc", "Văn phòng phẩm Sao Mai", "Siêu thị mini Thảo Điền"][i],
  phone: `090 ${String(1234567 + i * 1111).replace(/(\d{3})(\d{4})/, "$1 $2")}`,
  city: ["TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Huế", "TP.HCM"][i],
  source: ["Facebook", "Giới thiệu", "Zalo", "Website", "Facebook", "Hội chợ"][i],
  owner: ["Lan", "Minh", "Lan", "Tú", "Minh", "Tú"][i],
  lastContact: `2026-11-${String(20 - i * 3).padStart(2, "0")}`,
  orders: 3 + ((i * 7) % 19),
  spent: 2_400_000 + ((i * 3_150_000) % 18_000_000),
}));

// priority 3 folds first, then 2, then 1; the first column and columns without a priority always stay
const COLUMNS: DataTableColumn<Customer>[] = [
  { key: "name", header: "Khách hàng", sortable: true, cell: (c) => <span className="font-medium text-strong">{c.name}</span> },
  { key: "phone", header: "Điện thoại", priority: 2 },
  { key: "city", header: "Tỉnh / thành", sortable: true },
  { key: "source", header: "Nguồn", priority: 3, cell: (c) => <Badge size="sm">{c.source}</Badge> },
  { key: "owner", header: "Người phụ trách", priority: 3 },
  { key: "lastContact", header: "Liên lạc", sortable: true, priority: 2 },
  { key: "orders", header: "Đơn", sortable: true, numeric: true },
  { key: "spent", header: "Doanh số", sortable: true, numeric: true, cell: (c) => `${c.spent.toLocaleString("vi-VN")} ₫` },
];

const WIDTHS = { full: "", tablet: "max-w-[700px]", narrow: "max-w-[400px]" } as const;

export default function DataTableColumns() {
  const [width, setWidth] = useState<(keyof typeof WIDTHS)[]>(["tablet"]);
  return (
    <div className="space-y-3">
      <ToggleGroup
        label="Độ rộng bảng"
        value={width}
        onChange={setWidth}
        options={[
          { key: "full", label: "Đầy đủ" },
          { key: "tablet", label: "Máy tính bảng" },
          { key: "narrow", label: "Hẹp" },
        ]}
      />
      <div className={WIDTHS[width[0]]}>
        <DataTable label="Khách hàng" rows={CUSTOMERS} columns={COLUMNS} getRowId={(c) => c.id} defaultSort={{ key: "spent", dir: "desc" }} stickyFirstColumn />
      </div>
    </div>
  );
}
```

### Loading and empty

```tsx
"use client";

import { useState } from "react";
import { Button, DataTable } from "@semi/ui";

export default function DataTableStates() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setLoading((v) => !v)}>
        {loading ? "Xem trạng thái rỗng" : "Xem đang tải"}
      </Button>
      <DataTable
        label="Máy in"
        rows={[] as { id: string; name: string }[]}
        columns={[{ key: "name", header: "Tên máy" }]}
        getRowId={(r) => r.id}
        loading={loading}
        pageSize={4}
      />
    </div>
  );
}
```

## API

### DataTable

Sort by a column header (click again to reverse; aria-sort on the header), filter with `search` (every searchable
column, case and Vietnamese marks ignored), select rows with a checkbox column (select-all on the page, bulk
actions bar), page with Pagination. Shows skeleton rows while `loading` and an EmptyState when nothing is left.
When the columns do not fit its own box, columns with a `priority` fold into the first column's second line; what
still does not fit scrolls sideways, with a strong line (outline-line) on each edge that has columns past it and the table
focusable to scroll by keyboard. The sorted column never folds. Folding is measured after hydration, so a table
with priorities may shift once on first load at a narrow width.
The order it shows is `sortRows(searchRows(rows, columns, search), columns, sort)` (for DetailOverlay ‹ ›).

| Prop | Type | Default | Description |
|---|---|---|---|
| `rows` * | `T[]` |  |  |
| `columns` * | `DataTableColumn<T>[]` |  |  |
| `getRowId` * | `(row: T) => string` |  |  |
| `label` * | `string` |  | Accessible name of the table (a visually hidden caption). |
| `search` | `string` | `""` | Filter text, usually from the toolbar's SearchInput. |
| `sort` | `null \| DataTableSort` |  |  |
| `defaultSort` | `DataTableSort` |  |  |
| `onSortChange` | `(sort: DataTableSort \| null) => void` |  |  |
| `onResultsChange` | `(rows: T[]) => void` |  | Called with the searched + sorted rows (all pages) whenever the result order changes, so a DetailOverlay's ‹ › walks the table's exact order. |
| `selectable` | `boolean` | `false` | Add a checkbox column. |
| `selected` | `string[]` |  |  |
| `onSelectedChange` | `(ids: string[]) => void` |  |  |
| `activeRowId` | `null \| string` |  | ID of the currently open record (`useDetailParam().openId`): paints that row `bg-item-selected` (`aria-current="true"`), distinct from checked rows (`bg-item-checked`). |
| `bulkActions` | `(ids: string[]) => ReactNode` |  | Shown above the table while rows are selected: buttons that act on the selection. On 1.0 list pages (#149), prefer `FilterChipRow` / `PhoneFilterBar` `selection` instead so checking a row never pushes the list down. |
| `pageSize` | `number` | `0` | Rows per page; 0 shows all rows. |
| `loading` | `boolean` | `false` |  |
| `empty` | `React.ReactNode` |  | Shown when there are no rows (or none match the search). |
| `onRowClick` | `(row: T) => void` |  | Make rows clickable (open the record). Keep a link or button in the row for keyboard users. |
| `stickyFirstColumn` | `boolean` | `false` | Keep the first column (and the checkbox column) in place while the table scrolls sideways, so every row stays named. The table then sits on `bg-card`. |
| `className` | `string` |  |  |

## Accessibility

- Sortable headers are buttons with aria-sort on the header cell; the caption names the table; row checkboxes and select-all are labelled; aria-busy while loading.
- A folded value keeps its header for screen readers (“Nguồn: Facebook”) on the first cell's second line; when the table still scrolls sideways its scroll box is a named, focusable region, so the arrow keys scroll it.

## Notes

- Folding is measured on the table's own box (not the viewport), from each column's one-line width: a table in a split view or next to the rail folds as soon as it is too narrow. Folding happens after hydration: the server HTML shows every column, so a table with priorities may shift once on first load at tablet width.
- The order the table shows is `sortRows(searchRows(rows, columns, search), columns, sort)` (or read it from `onResultsChange`): use it to step through the results in a DetailOverlay (‹ ›, “n / N”), see the detail-overlay docs.
- Pass `activeRowId` to highlight the open record's row (`bg-item-selected`, `aria-current="true"`); checked rows use `bg-item-checked`.
- A table wider than its box draws a 2px strong line (outline-line) on each edge that has columns past it (in every table; with `stickyFirstColumn` the left line is the pinned column's edge) and keeps the first column (and the checkbox column) in place with `stickyFirstColumn`; the table then sits on `bg-card`. The sorted column never folds: its header is the only sort control.

<!-- GENERATED by scripts/build-docs.mjs from examples/data-table/ and the types in src/ -->
