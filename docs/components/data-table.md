# Data table

A table that sorts, filters, selects and pages rows on the client, built on Table: give it rows and columns, it keeps the state (or you control it).

## When to use

- Admin lists: orders, customers, inventory, logs — sort by a column, search, act on several rows.

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
  { key: "id", header: "Mã đơn", sortable: true, cell: (o) => <span className="font-medium text-contrast">{o.id}</span> },
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
| `selectable` | `boolean` | `false` | Add a checkbox column. |
| `selected` | `string[]` |  |  |
| `onSelectedChange` | `(ids: string[]) => void` |  |  |
| `bulkActions` | `(ids: string[]) => ReactNode` |  | Shown above the table while rows are selected: buttons that act on the selection. |
| `pageSize` | `number` | `0` | Rows per page; 0 shows all rows. |
| `loading` | `boolean` | `false` |  |
| `empty` | `React.ReactNode` |  | Shown when there are no rows (or none match the search). |
| `onRowClick` | `(row: T) => void` |  | Make rows clickable (open the record). Keep a link or button in the row for keyboard users. |
| `className` | `string` |  |  |

## Accessibility

- Sortable headers are buttons with aria-sort on the header cell; the caption names the table; row checkboxes and select-all are labelled; aria-busy while loading.

<!-- GENERATED by scripts/build-docs.mjs from examples/data-table/ and the types in src/ -->
