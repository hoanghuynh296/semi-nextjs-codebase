"use client";

import { useState } from "react";
import { TextTabs } from "@semi/ui";

export default function TextTabsHeading() {
  const [view, setView] = useState<"open" | "done" | "all">("open");
  return (
    <TextTabs
      label="Đơn hàng"
      value={view}
      onChange={setView}
      items={[
        { key: "open", label: "Đang xử lý" },
        { key: "done", label: "Đã giao" },
        { key: "all", label: "Tất cả" },
      ]}
    >
      <p className="text-ui text-body">{view === "open" ? "12 đơn đang xử lý." : view === "done" ? "48 đơn đã giao tuần này." : "60 đơn."}</p>
    </TextTabs>
  );
}
