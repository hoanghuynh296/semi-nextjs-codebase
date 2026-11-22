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
