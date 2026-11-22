"use client";

import { useState } from "react";
import { SubpageToolbar, toast, type FilterDef } from "@semi/ui";

const SPECS: Omit<FilterDef, "selected">[] = [
  { key: "group", label: "Nhóm", options: [{ value: "retail", label: "Bán lẻ" }, { value: "wholesale", label: "Bán sỉ" }] },
  { key: "region", label: "Khu vực", options: [{ value: "hn", label: "Hà Nội" }, { value: "hcm", label: "TP.HCM" }, { value: "dn", label: "Đà Nẵng" }] },
  { key: "owner", label: "Phụ trách", options: [{ value: "ha", label: "Thu Hà" }, { value: "nam", label: "Hoàng Nam" }] },
  { key: "debt", label: "Còn nợ", kind: "switch" },
];

export default function SubpageToolbarPhone() {
  const [sel, setSel] = useState<Record<string, string[]>>({ region: ["hn"] });
  const [q, setQ] = useState("");
  return (
    <SubpageToolbar
      title="Khách hàng"
      filters={{
        filters: SPECS.map((s) => ({ ...s, selected: sel[s.key] ?? [] })),
        onChange: (key, selected) => setSel({ ...sel, [key]: selected }),
        onClear: () => setSel({}),
        resultCount: 42,
      }}
      secondaryActions={[
        { label: "Nhập tệp", icon: "upload", onSelect: () => toast({ title: "Nhập tệp" }) },
        { label: "Xuất Excel", icon: "download", onSelect: () => toast({ title: "Xuất Excel" }) },
      ]}
      searchValue={q}
      onSearchChange={setQ}
      searchPlaceholder="Tìm khách hàng…"
      onPrimaryAction={() => toast({ title: "Thêm khách hàng" })}
      primaryActionLabel="Thêm khách hàng"
    />
  );
}
