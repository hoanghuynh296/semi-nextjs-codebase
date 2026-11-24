"use client";

import { useState } from "react";
import { Switch, TextTabs } from "@semi/ui";

/** URL-driven: each tab is a link; `onBeforeChange` blocks link navigation when there are unsaved edits. */
export default function TextTabsLinked() {
  const [dirty, setDirty] = useState(false);
  const [refused, setRefused] = useState(false);

  return (
    <div className="flex flex-col gap-group">
      <Switch
        checked={dirty}
        onChange={(v) => {
          setDirty(v);
          setRefused(false);
        }}
        label="Có thay đổi chưa lưu (chặn chuyển link)"
      />
      <TextTabs
        label="Mua hàng"
        heading={false}
        className="mb-0"
        value="suppliers"
        onBeforeChange={() => {
          if (dirty) {
            setRefused(true);
            return false;
          }
          setRefused(false);
          return true;
        }}
        items={[
          { key: "requests", label: "Yêu cầu", href: "?view=requests" },
          { key: "suppliers", label: "Nhà cung cấp", href: "?view=suppliers" },
          { key: "quotes", label: "Báo giá", href: "?view=quotes" },
        ]}
      >
        <p className="text-ui text-muted">
          {refused
            ? "Đã giữ nguyên trang Nhà cung cấp vì biểu mẫu còn thay đổi chưa lưu."
            : "Mỗi tab là một liên kết Next.js; phím ←/→ di chuyển tiêu điểm, Enter hoặc Space mở liên kết."}
        </p>
      </TextTabs>
    </div>
  );
}
