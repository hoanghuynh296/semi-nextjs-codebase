"use client";

import { useState } from "react";
import { Card, PillTabs, type PillTabItem } from "@semi/ui";

const SECTIONS = [
  { key: "mail", label: "Hộp thư", icon: "mail", summary: "Kết nối IMAP / SMTP và chu kỳ đồng bộ thư đến." },
  { key: "groups", label: "Nhóm thư", icon: "layers", summary: "Quy tắc tự động gán thư theo nhà cung cấp và từ khoá." },
  { key: "sources", label: "Nguồn khách", icon: "filter", summary: "Kênh tiếp nhận yêu cầu báo giá từ hội chợ, web và đại lý." },
  { key: "items", label: "Mặt hàng", icon: "tag", summary: "Danh mục nguyên liệu, quy cách đóng gói và đơn vị tính." },
  { key: "templates", label: "Mẫu thư", icon: "fileText", summary: "Mẫu hỏi giá và phản hồi nhanh có biến trộn." },
  { key: "datahub", label: "Data Hub", icon: "database", summary: "Khoá kết nối đồng bộ danh mục với hệ thống trung tâm." },
  { key: "company", label: "Doanh nghiệp", icon: "settings", summary: "Tên pháp nhân, mã số thuế và chữ ký mặc định." },
  { key: "users", label: "Người dùng", icon: "user", summary: "Thành viên phòng mua hàng và quyền phê duyệt." },
] as const satisfies readonly (PillTabItem & { summary: string })[];

export default function PillTabsSections() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["key"]>("mail");
  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];

  return (
    <PillTabs
      label="Cấu hình"
      value={section}
      onChange={(next) => setSection(next)}
      items={[...SECTIONS]}
    >
      <Card className="flex flex-col gap-stack">
        <h2 className="text-section text-strong">{current.label}</h2>
        <p className="text-ui text-muted">{current.summary}</p>
      </Card>
    </PillTabs>
  );
}
