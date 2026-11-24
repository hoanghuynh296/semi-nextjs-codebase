"use client";

import { useState } from "react";
import { Badge, Item, ItemGroup, SegmentedControl } from "@semi/ui";

const REQUESTS = [
  { id: "YC-204", title: "Hạt nhựa PLA Basic trắng 1kg × 40", status: "open" as const, statusLabel: "Đang mở", tone: "sky" as const },
  { id: "YC-203", title: "Đầu phun thép tôi 0.4mm × 12", status: "quoting" as const, statusLabel: "Đang báo giá", tone: "amber" as const },
  { id: "YC-201", title: "Bàn nhiệt PEI nhám 256×256 × 8", status: "done" as const, statusLabel: "Đã chốt", tone: "emerald" as const },
  { id: "YC-199", title: "Cuộn PETG HF xám 1kg × 24", status: "open" as const, statusLabel: "Đang mở", tone: "sky" as const },
];

export default function SegmentedControlCounts() {
  const [status, setStatus] = useState<"all" | "open" | "quoting" | "done">("all");
  const visible = status === "all" ? REQUESTS : REQUESTS.filter((r) => r.status === status);

  return (
    <div className="flex flex-col gap-group">
      <div>
        <SegmentedControl
          label="Trạng thái mua hàng"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { key: "all", label: "Tất cả", count: REQUESTS.length },
            { key: "open", label: "Đang mở", count: REQUESTS.filter((r) => r.status === "open").length },
            { key: "quoting", label: "Đang báo giá", count: REQUESTS.filter((r) => r.status === "quoting").length },
            { key: "done", label: "Đã chốt", count: REQUESTS.filter((r) => r.status === "done").length },
          ]}
        />
      </div>
      <ItemGroup label="Danh sách yêu cầu">
        {visible.map((r) => (
          <Item key={r.id} title={r.title} description={r.id} meta={<Badge tone={r.tone}>{r.statusLabel}</Badge>} />
        ))}
      </ItemGroup>
    </div>
  );
}
