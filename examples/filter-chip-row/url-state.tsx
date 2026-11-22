"use client";

import { FilterChipRow, ResultLine, ViewSwitch, useFilterParams, type ViewMode } from "@semi/ui";

const ORDERS = [
  { id: "1024", status: "new", channel: "shopee", paid: true },
  { id: "1025", status: "packing", channel: "web", paid: true },
  { id: "1026", status: "new", channel: "web", paid: false },
  { id: "1027", status: "shipped", channel: "shopee", paid: true },
  { id: "1028", status: "packing", channel: "store", paid: false },
];

export default function FilterChipRowUrlState() {
  // state lives in the URL (?o.status=new&o.paid=1): reload, share a link, Back / Forward all keep it
  const f = useFilterParams(
    [
      { key: "status", label: "Trạng thái", icon: "activity", options: [
        { value: "new", label: "Mới", count: 2 },
        { value: "packing", label: "Đang đóng gói", count: 2 },
        { value: "shipped", label: "Đã giao", count: 1 },
      ] },
      { key: "channel", label: "Kênh bán", icon: "store", options: [
        { value: "shopee", label: "Shopee" },
        { value: "web", label: "Website" },
        { value: "store", label: "Cửa hàng" },
      ] },
      { key: "paid", label: "Đã thanh toán", icon: "check", kind: "switch" },
    ],
    { prefix: "o." },
  );
  const view: ViewMode = f.params.get("view") === "grid" ? "grid" : "list";
  const rows = ORDERS.filter(
    (o) =>
      (!f.values.status.length || f.values.status.includes(o.status)) &&
      (!f.values.channel.length || f.values.channel.includes(o.channel)) &&
      (!f.values.paid.length || o.paid),
  );
  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <FilterChipRow
        filters={f.filters}
        onChange={f.onChange}
        onClear={f.onClear}
        trailing={<ViewSwitch view={view} onViewChange={(v) => f.setParams({ view: v === "list" ? null : v }, "replace")} />}
      />
      <ResultLine count={rows.length} unit="đơn hàng" />
      <p className="text-label text-muted">{rows.map((o) => `#${o.id}`).join(" · ") || "—"}</p>
    </div>
  );
}
