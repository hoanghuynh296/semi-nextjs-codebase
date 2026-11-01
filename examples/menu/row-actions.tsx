"use client";

import { Menu, toast } from "@semi/ui";

export default function MenuRowActions() {
  return (
    <Menu
      label="Thao tác máy in"
      items={[
        { label: "Đổi tên", icon: "edit", onSelect: () => toast({ title: "Đổi tên" }) },
        { label: "Nhân bản", icon: "copy", onSelect: () => toast({ title: "Đã nhân bản", tone: "success" }) },
        { label: "Tạm dừng", icon: "pause", onSelect: () => undefined, disabled: true },
        { label: "Xoá", icon: "trash", danger: true, separator: true, onSelect: () => toast({ title: "Không xoá được", description: "Máy đang in.", tone: "danger" }) },
      ]}
    />
  );
}
