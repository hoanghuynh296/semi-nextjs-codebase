"use client";

import { useState } from "react";
import { Tabs } from "@semi/ui";

export default function TabsSegmented() {
  const [range, setRange] = useState<"day" | "week" | "month">("week");
  return (
    <Tabs
      variant="segmented"
      label="Khoảng thời gian"
      value={range}
      onChange={setRange}
      items={[
        { key: "day", label: "Ngày" },
        { key: "week", label: "Tuần" },
        { key: "month", label: "Tháng" },
      ]}
    />
  );
}
