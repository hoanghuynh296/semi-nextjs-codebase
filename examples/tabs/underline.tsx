"use client";

import { useState } from "react";
import { Tabs } from "@semi/ui";

export default function TabsUnderline() {
  const [tab, setTab] = useState<"overview" | "activity" | "settings">("overview");
  return (
    <Tabs
      label="Chi tiết máy in"
      value={tab}
      onChange={setTab}
      items={[
        { key: "overview", label: "Tổng quan", icon: "gauge", content: <p className="text-ui text-body">Nhiệt độ, tiến độ và camera.</p> },
        { key: "activity", label: "Hoạt động", count: 12, content: <p className="text-ui text-body">12 sự kiện trong 24 giờ qua.</p> },
        { key: "settings", label: "Cài đặt", icon: "settings", content: <p className="text-ui text-body">Tên, nhóm và quyền truy cập.</p> },
      ]}
    />
  );
}
