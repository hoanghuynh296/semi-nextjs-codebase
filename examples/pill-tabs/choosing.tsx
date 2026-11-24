"use client";

import { useState } from "react";
import { PillTabs, SegmentedControl, Separator, TextTabs } from "@semi/ui";

export default function TabsWhenToUseWhich() {
  const [section, setSection] = useState<"mail" | "groups" | "sources" | "items" | "templates" | "users">("mail");
  const [status, setStatus] = useState<"all" | "open" | "quoting" | "done">("open");
  const [view, setView] = useState<"discover" | "templates" | "collections">("discover");

  return (
    <div className="flex flex-col gap-section">
      <div data-density-view="" className="flex flex-col gap-3">
        <div className="text-overline text-muted">PillTabs · 5+ mục hoặc có biểu tượng</div>
        <PillTabs
          label="Cấu hình hệ thống"
          value={section}
          onChange={(v) => setSection(v)}
          panelClassName="pt-3"
          items={[
            { key: "mail", label: "Hộp thư", icon: "mail" },
            { key: "groups", label: "Nhóm thư", icon: "layers" },
            { key: "sources", label: "Nguồn khách", icon: "filter" },
            { key: "items", label: "Mặt hàng", icon: "tag" },
            { key: "templates", label: "Mẫu thư", icon: "fileText" },
            { key: "users", label: "Người dùng", icon: "user" },
          ]}
        >
          <p className="text-ui text-muted">Cấu hình máy chủ thư và chu kỳ đồng bộ tự động mỗi 5 phút.</p>
        </PillTabs>
      </div>

      <Separator />

      <div data-density-view="" className="flex flex-col gap-3">
        <div className="text-overline text-muted">SegmentedControl · 2–5 giá trị lọc</div>
        <div>
          <SegmentedControl
            label="Trạng thái yêu cầu"
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              { key: "all", label: "Tất cả", count: 128 },
              { key: "open", label: "Đang mở", count: 24 },
              { key: "quoting", label: "Đang báo giá", count: 9 },
              { key: "done", label: "Đã chốt", count: 95 },
            ]}
          />
        </div>
        <p className="text-ui text-muted">Hiển thị các yêu cầu ở trạng thái đã chọn ngay trong danh sách hiện tại.</p>
      </div>

      <Separator />

      <div data-density-view="" className="flex flex-col gap-3">
        <div className="text-overline text-muted">TextTabs · 2–4 góc nhìn lớn</div>
        <TextTabs
          label="Thư viện mẫu"
          heading={false}
          className="mb-0"
          value={view}
          onChange={(v) => setView(v)}
          items={[
            { key: "discover", label: "Khám phá" },
            { key: "templates", label: "Mẫu sẵn" },
            { key: "collections", label: "Bộ sưu tập" },
          ]}
        >
          <p className="text-lead text-muted">Tổng hợp các mẫu thiết kế được cộng đồng in nhiều nhất tuần này.</p>
        </TextTabs>
      </div>
    </div>
  );
}
