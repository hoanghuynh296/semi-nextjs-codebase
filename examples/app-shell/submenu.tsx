"use client";

import { useState } from "react";
import { AppShell, CustomSelect, PageTitle, useAppShell, type ShellNavSection } from "@semi/ui";

const FOLDERS = [
  { id: "mail:inbox", label: "Hộp thư đến", icon: "inbox" as const },
  { id: "mail:starred", label: "Gắn sao", icon: "star" as const },
  { id: "mail:sent", label: "Đã gửi", icon: "send" as const },
  { id: "mail:failed", label: "Thất bại", icon: "alert" as const },
];

const SECTIONS: ShellNavSection[] = [
  {
    label: "Làm việc",
    hideLabel: true,
    items: [
      // Choosing "Hộp thư" opens its sub-items; choosing another item closes them.
      { id: "mail", label: "Hộp thư", icon: "mail", children: FOLDERS },
      { id: "customers", label: "Khách hàng", icon: "users" },
    ],
  },
  { label: "Hệ thống", hideLabel: true, items: [{ id: "settings", label: "Cấu hình", icon: "settings" }] },
];

function MailPage({ folder, onFolder }: { folder: string; onFolder: (id: string) => void }) {
  // In the rail and on phones the sidebar hides sub-items: the page offers the same choice itself.
  const { submenuVisible } = useAppShell();
  return (
    <div className="space-y-4">
      <PageTitle title="Hộp thư" />
      {!submenuVisible && (
        <CustomSelect
          aria-label="Thư mục"
          value={folder}
          onChange={onFolder}
          options={FOLDERS.map((f) => ({ value: f.id, label: f.label }))}
        />
      )}
      <p className="text-ui text-body">{FOLDERS.find((f) => f.id === folder)?.label}</p>
    </div>
  );
}

export default function AppShellSubmenu() {
  const [active, setActive] = useState("customers");
  // The parent alone opens its first sub-item.
  const select = (id: string) => setActive(id === "mail" ? "mail:inbox" : id);
  return (
    <AppShell productName="Sales Hub" logoIcon="chart" sections={SECTIONS} activeId={active} onSelect={select}>
      {active.startsWith("mail") ? <MailPage folder={active} onFolder={setActive} /> : <PageTitle title="Khách hàng" />}
    </AppShell>
  );
}
