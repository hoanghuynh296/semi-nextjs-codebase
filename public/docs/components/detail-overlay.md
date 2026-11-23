# Detail overlay

An item of a list opens over the list instead of on its own page: its own URL (?open=<id> with useDetailParam, Next App Router safe), ‹ › and ← → through the current results with “n / N”, close / Esc / Back return to the list at the same scroll position. The side panel holds the actions (SplitButton, an icon row, ⋯); existing detail routes stay as deep-link targets.

## When to use

- Open a record from a list, grid or table and step through the results without losing the list (suppliers, orders, leads).
- A shared link to a record that should land over its list.

## Use something else when

| Need | Use |
|---|---|
| Edit a few fields of a row | SidePanel or Modal |
| A long workflow with its own sub-pages | a detail route |
| A mail or chat reader beside the list | a list + reader layout |

## Import

```tsx
import { DetailOverlay, useDetailParam, openDetail, type DetailParamState, searchRows, sortRows } from "@semi/ui";
```

## Examples

### List with ?item= in the URL

Open a row, step with ← →, press Back: the list is where you left it.

```tsx
"use client";

import { Badge, Button, DetailOverlay, Item, ItemGroup, Menu, SplitButton, toast, useDetailParam } from "@semi/ui";

const ORDERS = Array.from({ length: 12 }, (_, i) => ({
  id: `DH-${1040 + i}`,
  customer: ["Cửa hàng Minh An", "Nhà sách Phú Lợi", "Quán Bếp Nhà"][i % 3],
  total: (i + 3) * 185000,
  paid: i % 4 !== 0,
}));
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

// Click a row: the order opens over the list with ?item= in the URL. ‹ › (or ← →) go through the list, Back or Esc
// closes it and the list is where it was. Reload with ?item=DH-1045 to open it from a link.
export default function DetailOverlayList() {
  const { openId, open, show, close } = useDetailParam("item");
  const index = ORDERS.findIndex((o) => o.id === openId);
  const order = index >= 0 ? ORDERS[index] : null;
  return (
    <>
      <ItemGroup label="Đơn hàng">
        {ORDERS.map((o) => (
          <Item key={o.id} title={o.customer} description={o.id} meta={vnd(o.total)} onClick={() => open(o.id)} />
        ))}
      </ItemGroup>
      <DetailOverlay
        open={order !== null}
        onClose={close}
        title={order ? `Đơn ${order.id}` : ""}
        subtitle={order?.customer}
        index={index}
        total={ORDERS.length}
        onPrev={index > 0 ? () => show(ORDERS[index - 1].id) : undefined}
        onNext={index >= 0 && index < ORDERS.length - 1 ? () => show(ORDERS[index + 1].id) : undefined}
        onCopyLink={() => (navigator.clipboard?.writeText(window.location.href), toast({ title: "Đã sao chép liên kết" }))}
        side={
          order && (
            <>
              <SplitButton
                label="Giao hàng"
                icon="truck"
                onClick={() => toast({ title: `Giao ${order.id}` })}
                menuLabel="Cách giao khác"
                collapseOnPhone={false}
                items={[
                  { label: "Hẹn ngày giao", icon: "calendar", onSelect: () => toast({ title: "Hẹn ngày" }) },
                  { label: "Khách tự lấy", icon: "store", onSelect: () => toast({ title: "Khách tự lấy" }) },
                ]}
              />
              <div className="flex items-center gap-2">
                <Button iconOnly icon="printer" aria-label="In đơn" />
                <Button iconOnly icon="copy" aria-label="Nhân bản" />
                <Menu
                  label={`Thao tác khác với ${order.id}`}
                  items={[
                    { label: "Sửa đơn", icon: "edit", onSelect: () => undefined },
                    { label: "Huỷ đơn", icon: "close", danger: true, onSelect: () => toast({ title: "Đã huỷ", tone: "danger" }) },
                  ]}
                />
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-caption text-muted">Tổng tiền</dt>
                  <dd className="text-ui text-contrast tabular-nums">{vnd(order.total)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-muted">Thanh toán</dt>
                  <dd>
                    <Badge tone={order.paid ? "emerald" : "amber"} dot size="sm">
                      {order.paid ? "Đã trả" : "Chưa trả"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </>
          )
        }
      >
        {order && (
          <section className="flex flex-col gap-2">
            <h3 className="text-label font-semibold text-contrast">Sản phẩm</h3>
            <p className="text-ui text-body">3 mặt hàng · giao trong 2 ngày.</p>
          </section>
        )}
      </DetailOverlay>
    </>
  );
}
```

### A sorted DataTable: ‹ › follow its order

Sort by a column or search, open a row: ‹ › and “n / N” walk the rows in the order the table shows them (sortRows / searchRows, all pages).

```tsx
"use client";

import { useState } from "react";
import { Button, DataTable, DetailOverlay, SearchInput, openDetail, searchRows, sortRows, useDetailParam, type DataTableColumn, type DataTableSort } from "@semi/ui";

type Order = { id: string; customer: string; total: number };
const ORDERS: Order[] = Array.from({ length: 12 }, (_, i) => ({
  id: `DH-${1040 + i}`,
  customer: ["Cửa hàng Minh An", "Nhà sách Phú Lợi", "Quán Bếp Nhà"][i % 3],
  total: 185_000 + ((i * 410_000) % 2_300_000),
}));
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
const COLUMNS: DataTableColumn<Order>[] = [
  {
    key: "id",
    header: "Mã đơn",
    sortable: true,
    // the row opens on click; the button is the keyboard way in (and where focus returns on close)
    cell: (o) => (
      <Button size="sm" variant="ghost" onClick={(e) => (e.stopPropagation(), openDetail(o.id, "order"))}>
        {o.id}
      </Button>
    ),
  },
  { key: "customer", header: "Khách hàng", sortable: true },
  { key: "total", header: "Tổng", sortable: true, numeric: true, cell: (o) => vnd(o.total) },
];

// The overlay steps through the rows in the order the table shows them: the same search and sort, through the
// table's own helpers (sortRows / searchRows), all pages. Sort by Tổng, open a row, press → .
export default function DetailOverlayTable() {
  const { openId, open, show, close } = useDetailParam("order");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<DataTableSort | null>({ key: "total", dir: "desc" });
  const results = sortRows(searchRows(ORDERS, COLUMNS, q), COLUMNS, sort);
  const index = results.findIndex((o) => o.id === openId);
  const order = index >= 0 ? results[index] : (ORDERS.find((o) => o.id === openId) ?? null);
  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder="Tìm mã đơn, khách hàng…" className="w-64" />
      <DataTable label="Đơn hàng" rows={ORDERS} columns={COLUMNS} getRowId={(o) => o.id} search={q} sort={sort} onSortChange={setSort} onRowClick={(o) => open(o.id)} pageSize={6} />
      <DetailOverlay
        open={order !== null}
        onClose={close}
        title={order ? `Đơn ${order.id}` : ""}
        subtitle={order?.customer}
        index={index >= 0 ? index : undefined}
        total={index >= 0 ? results.length : undefined}
        onPrev={index > 0 ? () => show(results[index - 1].id) : undefined}
        onNext={index >= 0 && index < results.length - 1 ? () => show(results[index + 1].id) : undefined}
      >
        {order && <p className="text-ui text-body tabular-nums">Tổng tiền {vnd(order.total)}</p>}
      </DetailOverlay>
    </div>
  );
}
```

## API

### DetailOverlay

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` * | `boolean` |  | Drive it from the URL: `open={openId !== null}` with useDetailParam. |
| `onClose` * | `() => void` |  | Close button, Escape and a click on the backdrop. With useDetailParam pass its `close`. |
| `title` * | `React.ReactNode` |  |  |
| `subtitle` | `React.ReactNode` |  | One line under the title (region, category). |
| `index` | `number` |  | Place of the item in the current result set (0-based) and its size: shows "n / N". |
| `total` | `number` |  |  |
| `onPrev` | `() => void` |  | Previous / next item of the result set; leave out at the ends (the button is disabled). ← → do the same. |
| `onNext` | `() => void` |  |  |
| `onCopyLink` | `() => void` |  | Shows a "copy link" button (the URL already opens this item). |
| `label` | `string` |  | Accessible name of the dialog when `title` is not plain text. |
| `children` * | `React.ReactNode` |  | The item itself. |
| `side` | `React.ReactNode` |  | The action panel: a SplitButton, a row of icon buttons, a ⋯ Menu, then facts. Right column from `lg`, below the content before. |
| `related` | `React.ReactNode` |  | Related items, under the main content. |

## Accessibility

- A modal dialog named by its title (an h2), focus trapped and returned to the row that opened it; Escape closes.
- ‹ › are labelled (Mục trước / Mục sau, with aria-keyshortcuts) and disabled at the ends, where focus moves to the other one; “n / N” is read as “Mục n trên N”; ← → do not fire inside inputs, menus or sliders.

## Notes

- Open a record from elsewhere on the same route (a CommandPalette item, a notification) with the hook's `open(id)` or `openDetail(id)`, not `router.push("?open=…")`: browsers without the Navigation API (Firefox, Safari < 26) do not tell the hook about Next's own same-route navigation, so the overlay would not open unless the list re-renders. To another route, navigate with the param in the URL; the hook reads it when the list mounts.
- Close goes back when the entry is one this page opened (also after Back then Forward where the Navigation API exists), else it removes the param, so the list never gets a second history entry. Without the Navigation API only the entry the mounted list opened last, at that exact address, counts as its own.
- Walk the results the list shows: for a DataTable build them with its own helpers, `sortRows(searchRows(rows, columns, search), columns, sort)` (all pages, the table's comparator), never a copy of the comparator. Keep filters and the query in the URL too (useFilterParams), so ‹ › and a shared link walk the same results.

<!-- GENERATED by scripts/build-docs.mjs from examples/detail-overlay/ and the types in src/ -->
