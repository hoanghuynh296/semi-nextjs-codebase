"use client";

import { usePathname } from "next/navigation";
import { AppShell, ThemeSwitcher, type ShellNavSection } from "@semi/ui";

const SECTIONS: ShellNavSection[] = [
  {
    label: "Quản lý",
    items: [
      { id: "overview", label: "Tổng quan", icon: "grid", href: "/" },
      { id: "printers", label: "Máy in", icon: "printer", href: "/printers" },
      { id: "orders", label: "Đơn hàng", icon: "bag", href: "/orders" },
    ],
  },
  { label: "Hệ thống", items: [{ id: "settings", label: "Cài đặt", icon: "settings", href: "/settings" }] },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const active = SECTIONS.flatMap((s) => s.items).find((i) => i.href !== "/" && path.startsWith(i.href ?? ""))?.id ?? "overview";
  return (
    <AppShell productName="3D Noobs Manager" logoIcon="printer" sections={SECTIONS} activeId={active} footer={() => <ThemeSwitcher fullWidth />}>
      {children}
    </AppShell>
  );
}
