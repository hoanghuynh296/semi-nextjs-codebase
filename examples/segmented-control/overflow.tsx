"use client";

import { useState } from "react";
import { SegmentedControl, Switch } from "@semi/ui";

const OPTIONS = [
  { key: "all", label: "Tất cả kho", count: 312 },
  { key: "hcm", label: "TP. Hồ Chí Minh", count: 148 },
  { key: "bd", label: "Bình Dương", count: 86 },
  { key: "dn", label: "Đà Nẵng", count: 34 },
  { key: "hn", label: "Hà Nội", count: 44 },
] as const;

export default function SegmentedControlOverflow() {
  const [warehouse, setWarehouse] = useState<(typeof OPTIONS)[number]["key"]>("all");
  const [manual, setManual] = useState(false);
  const [locked, setLocked] = useState(false);

  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-wrap items-center gap-group">
        <Switch checked={manual} onChange={setManual} label="Chuyển bằng Enter / Space (manual)" />
        <Switch checked={locked} onChange={setLocked} label="Khoá bộ lọc đang chọn" />
      </div>
      <div>
        <SegmentedControl
          label="Kho hàng"
          value={warehouse}
          onChange={(v) => setWarehouse(v)}
          onBeforeChange={() => !locked}
          activation={manual ? "manual" : "automatic"}
          options={[...OPTIONS]}
        />
      </div>
      <p className="text-ui text-muted">
        Đang xem: {OPTIONS.find((o) => o.key === warehouse)?.label}
        {locked ? " · Đang khoá chuyển đổi." : "."}
      </p>
    </div>
  );
}
