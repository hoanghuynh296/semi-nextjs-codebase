"use client";

import { useState } from "react";
import { Card, PillTabs, Switch, useTabParam } from "@semi/ui";

const TABS = [
  { key: "general", label: "Chung", icon: "settings" },
  { key: "notifications", label: "Thông báo", icon: "bell" },
  { key: "members", label: "Thành viên", icon: "users" },
  { key: "audit", label: "Nhật ký", icon: "clock" },
] as const;

const KEYS = TABS.map((t) => t.key);

export default function PillTabsGuarded() {
  const [tab, setTab] = useTabParam<(typeof TABS)[number]["key"]>("general", { param: "section", values: KEYS });
  const [dirty, setDirty] = useState(false);
  const [manual, setManual] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-wrap items-center gap-group">
        <Switch checked={dirty} onChange={(v) => (setDirty(v), setBlocked(null))} label="Có thay đổi chưa lưu" />
        <Switch checked={manual} onChange={setManual} label="Chuyển bằng Enter / Space (manual)" />
      </div>
      <PillTabs
        label="Cấu hình khu vực"
        value={tab}
        onChange={(next, meta) => {
          setBlocked(null);
          setTab(next, meta);
        }}
        onBeforeChange={(next) => {
          if (dirty) {
            setBlocked(TABS.find((t) => t.key === next)?.label ?? next);
            return false;
          }
          return true;
        }}
        activation={manual ? "manual" : "automatic"}
        items={[...TABS]}
      >
        <Card className="flex flex-col gap-2">
          <p className="text-ui text-strong">Mục đang mở: {TABS.find((t) => t.key === tab)?.label}</p>
          <p className="text-ui text-muted">
            {blocked
              ? `Đã chặn chuyển sang "${blocked}" vì còn thay đổi chưa lưu.`
              : "Phím mũi tên cập nhật ?section= bằng replaceState nên không sinh thêm lịch sử mỗi lần bấm."}
          </p>
        </Card>
      </PillTabs>
    </div>
  );
}
