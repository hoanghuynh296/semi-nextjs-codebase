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
