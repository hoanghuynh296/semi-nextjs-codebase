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
