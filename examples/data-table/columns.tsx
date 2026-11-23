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
  { key: "name", header: "Khách hàng", sortable: true, cell: (c) => <span className="font-medium text-contrast">{c.name}</span> },
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
