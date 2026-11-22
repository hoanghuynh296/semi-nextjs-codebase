"use client";

import { useMemo } from "react";
import { Button, CommandPalette, Kbd, openCommandPalette, toast, useRegisterCommands, type CommandItem } from "@semi/ui";

// Mount CommandPalette once in the root layout with the app's places. A page adds its own quick actions and records
// with useRegisterCommands while it is mounted. ⌘↵ opens an item with href in a new tab.
const PLACES: CommandItem[] = [
  { id: "inbox", label: "Hộp thư", group: "Trang", icon: "mail", href: "#inbox", onSelect: () => toast({ title: "Mở Hộp thư" }) },
  { id: "suppliers", label: "Nhà cung cấp", group: "Trang", icon: "store", href: "#suppliers", onSelect: () => toast({ title: "Mở Nhà cung cấp" }) },
  { id: "settings", label: "Cài đặt", group: "Trang", icon: "settings", onSelect: () => toast({ title: "Mở Cài đặt" }) },
];

export default function CommandPaletteApp() {
  const pageItems = useMemo<CommandItem[]>(
    () => [
      { id: "new-supplier", label: "Thêm nhà cung cấp", group: "Tạo nhanh", icon: "plus", tone: "blue", shortcut: ["⌘", "N"], onSelect: () => toast({ title: "Thêm nhà cung cấp" }) },
      { id: "new-request", label: "Tạo yêu cầu mua", group: "Tạo nhanh", icon: "clipboardList", tone: "green", onSelect: () => toast({ title: "Tạo yêu cầu mua" }) },
      { id: "s1", label: "Gia vị Tây Nguyên", hint: "Nhà cung cấp · Đắk Lắk", group: "Nhà cung cấp", icon: "store", keywords: ["tieu", "pepper"], href: "#suppliers?open=s1", onSelect: () => toast({ title: "Mở Gia vị Tây Nguyên" }) },
    ],
    [],
  );
  useRegisterCommands(pageItems);
  return (
    <>
      <Button icon="search" onClick={() => openCommandPalette()}>
        Tìm hoặc tạo <Kbd keys={["⌘", "K"]} />
      </Button>
      <CommandPalette items={PLACES} />
    </>
  );
}
