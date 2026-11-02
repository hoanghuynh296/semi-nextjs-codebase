"use client";

import { useState } from "react";
import { Badge, Card, Switch } from "@semi/ui";

const RULES = [
  { id: "maint", name: "Nhắc bảo trì", detail: "Mỗi 200 giờ in" },
  { id: "night", name: "Tắt máy ban đêm", detail: "23:00, khi không có job" },
];

export default function SwitchCardHeader() {
  const [on, setOn] = useState<Record<string, boolean>>({ maint: true, night: false });
  return (
    <div className="grid gap-3 @lg:grid-cols-2">
      {RULES.map((r) => (
        <Card key={r.id} className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span id={`rule-${r.id}`} className="text-ui font-semibold text-contrast">
              {r.name}
            </span>
            <Switch checked={on[r.id]} onChange={(v) => setOn({ ...on, [r.id]: v })} aria-labelledby={`rule-${r.id}`} />
          </div>
          <p className="text-label text-muted">{r.detail}</p>
          <Badge tone={on[r.id] ? "emerald" : "gray"}>{on[r.id] ? "Đang bật" : "Đang tắt"}</Badge>
        </Card>
      ))}
    </div>
  );
}
