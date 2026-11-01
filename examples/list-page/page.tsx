"use client";

import { useState } from "react";
import { Badge, Button, DataTable, PageTitle, Pills, SubpageToolbar, toast, type DataTableColumn } from "@semi/ui";

type Order = { id: string; customer: string; status: "paid" | "pending" | "refunded"; total: number; date: string };
const STATUS = { paid: ["emerald", "Đã thanh toán"], pending: ["amber", "Chờ xử lý"], refunded: ["rose", "Hoàn tiền"] } as const;
const ORDERS: Order[] = Array.from({ length: 36 }, (_, i) => ({
  id: `SO-${1040 + i}`,
  customer: ["Nguyễn An", "Trần Bình", "Lê Chi", "Phạm Dũng", "Hoàng Hà", "Võ Lan"][i % 6],
  status: (["paid", "pending", "paid", "refunded"] as const)[i % 4],
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

export default function ListPage() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const rows = status === "all" ? ORDERS : ORDERS.filter((o) => o.status === status);
  return (
    <div className="space-y-4">
      <PageTitle title="Đơn hàng" />
      <SubpageToolbar
        left={
          <Pills
            value={status}
            onChange={setStatus}
            options={[
              { key: "all", label: "Tất cả" },
              { key: "pending", label: "Chờ xử lý" },
              { key: "paid", label: "Đã thanh toán" },
              { key: "refunded", label: "Hoàn tiền" },
            ]}
          />
        }
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Tìm mã đơn, khách hàng…"
        onRefresh={() => new Promise((r) => setTimeout(r, 600))}
        onPrimaryAction={() => toast({ title: "Tạo đơn mới" })}
        primaryActionLabel="Tạo đơn"
      />
      <DataTable
        label="Đơn hàng"
        rows={rows}
        columns={COLUMNS}
        getRowId={(o) => o.id}
        search={q}
        defaultSort={{ key: "date", dir: "desc" }}
        selectable
        bulkActions={(ids) => (
          <Button size="sm" variant="secondary" icon="download" onClick={() => toast({ title: `Đã xuất ${ids.length} đơn` })}>
            Xuất CSV
          </Button>
        )}
        pageSize={10}
      />
    </div>
  );
}
