"use client";

import { useState } from "react";
import { Button, Menu, toast } from "@semi/ui";

export default function MenuGrouped() {
  const [compact, setCompact] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportFile = () => {
    setExporting(true);
    setTimeout(() => (setExporting(false), toast({ title: "Đã xuất 128 dòng", tone: "success" })), 1200);
  };
  return (
    <Menu
      label="Thao tác với danh sách khách hàng"
      trigger={<Button icon="more">Thao tác</Button>}
      items={[
        // danger is listed first here on purpose: Menu always shows it last, after a divider (G5)
        { label: "Xoá danh sách", icon: "trash", danger: true, onSelect: () => toast({ title: "Đã xoá", tone: "danger" }) },
        { label: "Xuất Excel", icon: "download", group: "Xuất", description: "128 dòng đang lọc", loading: exporting, onSelect: exportFile },
        { label: "In danh sách", icon: "printer", group: "Xuất", shortcut: "⌘P", onSelect: () => window.print() },
        { label: "Gửi qua Zalo", icon: "send", group: "Xuất", disabled: "Chưa kết nối Zalo OA", onSelect: () => undefined },
        { label: "Chỉ quản trị viên", icon: "lock", group: "Xuất", hidden: true, onSelect: () => undefined },
        { label: "Hiển thị gọn", group: "Xem", checked: compact, onSelect: () => setCompact((v) => !v) },
        { label: "Mở trang cài đặt", icon: "settings", group: "Xem", href: "#settings" },
      ]}
    />
  );
}
