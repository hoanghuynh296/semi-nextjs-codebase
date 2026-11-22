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
