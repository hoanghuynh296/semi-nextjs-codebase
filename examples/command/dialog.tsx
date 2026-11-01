"use client";

import { useState } from "react";
import { Button, CommandDialog, Kbd, toast, useHotkey, type CommandItem } from "@semi/ui";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  useHotkey(() => setOpen((v) => !v));
  const go = (title: string) => () => toast({ title });
  const items: CommandItem[] = [
    { id: "orders", label: "Đơn hàng", group: "Trang", icon: "bag", onSelect: go("Mở Đơn hàng") },
    { id: "printers", label: "Máy in", group: "Trang", icon: "printer", keywords: ["printer"], onSelect: go("Mở Máy in") },
    { id: "inventory", label: "Kho vật liệu", group: "Trang", icon: "box", onSelect: go("Mở Kho") },
    { id: "new-order", label: "Tạo đơn hàng", group: "Thao tác", icon: "plus", shortcut: ["⌘", "N"], onSelect: go("Tạo đơn") },
    { id: "theme", label: "Đổi giao diện sáng / tối", group: "Thao tác", icon: "moon", onSelect: go("Đổi giao diện") },
  ];
  return (
    <>
      <Button icon="search" onClick={() => setOpen(true)}>
        Tìm nhanh <Kbd keys={["⌘", "K"]} />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}
