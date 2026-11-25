"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "../../../../src/AppShell";

export default function StickyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeId = pathname?.split("/").pop() || "list";
  return (
    <AppShell
      flush
      page="scroll"
      productName="Semi Sticky"
      sections={[
        {
          label: "Workspace",
          items: [
            { id: "list", label: "Orders", icon: "bag", href: "/sticky/list" },
            { id: "reader", label: "Inbox", icon: "inbox", href: "/sticky/reader" },
            { id: "plain", label: "Plain", icon: "fileText", href: "/sticky/plain" },
          ],
        },
      ]}
      activeId={activeId}
      header={{
        account: { name: "Hoang Huynh", detail: "Owner" },
      }}
    >
      {children}
    </AppShell>
  );
}
