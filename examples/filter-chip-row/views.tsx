"use client";

import { useState } from "react";
import { FilterChipRow, Pills, ResultLine, type FilterDef } from "@semi/ui";

const MAIL = [
  { id: "Báo giá tiêu đen", box: "sales", folder: "inbox", open: true },
  { id: "Đơn đặt hàng quế", box: "sales", folder: "inbox", open: false },
  { id: "Hoá đơn tháng 10", box: "billing", folder: "archive", open: false },
  { id: "Hỏi giá hồi", box: "support", folder: "inbox", open: true },
];
const VIEWS = [
  { key: "open", label: "Chưa xử lý" },
  { key: "all", label: "Tất cả" },
];

export default function FilterChipRowViews() {
  // the default view is "Chưa xử lý", not "all"
  const [view, setView] = useState("open");
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const filters: FilterDef[] = [
    {
      key: "box",
      label: "Hộp thư",
      icon: "inbox",
      kind: "single",
      clearValue: "all",
      options: [
        { value: "all", label: "Tất cả" },
        { value: "sales", label: "Bán hàng", count: 2 },
        { value: "billing", label: "Kế toán", count: 1 },
        { value: "support", label: "Hỗ trợ", count: 1 },
      ],
      selected: sel.box ?? [],
    },
    {
      key: "folder",
      label: "Thư mục",
      icon: "folder",
      kind: "single",
      options: [
        { value: "inbox", label: "Hộp thư đến" },
        { value: "archive", label: "Lưu trữ" },
      ],
      selected: sel.folder ?? [],
    },
  ];
  const box = sel.box?.[0] ?? "all";
  const rows = MAIL.filter((m) => (view === "all" || m.open) && (box === "all" || m.box === box) && (!sel.folder?.length || sel.folder.includes(m.folder)));
  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <FilterChipRow
        leading={<Pills value={view} onChange={setView} options={VIEWS} />}
        filters={filters}
        onChange={(key, selected) => setSel({ ...sel, [key]: selected })}
        onClear={() => setSel({})}
      />
      <ResultLine count={rows.length} unit="thư" />
      <p className="text-ui text-muted">{rows.map((m) => m.id).join(" · ") || "—"}</p>
    </div>
  );
}
