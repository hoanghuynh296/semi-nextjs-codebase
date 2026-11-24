"use client";

import React from "react";
import { AppShell } from "../../../../src/AppShell";

export default function LayoutsShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      flush
      productName="Semi Layouts"
      sections={[
        {
          label: "Workspace",
          items: [
            { id: "work", label: "Orders", icon: "bag", href: "/layouts/work" },
            { id: "reading", label: "Explore", icon: "sparkles", href: "/layouts/reading" },
            { id: "two-column", label: "Directory", icon: "folder", href: "/layouts/two-column" },
            { id: "reader", label: "Inbox", icon: "inbox", href: "/layouts/reader" },
          ],
        },
      ]}
      activeId="work"
      header={{
        account: { name: "Hoang Huynh", detail: "Owner" },
      }}
    >
      {children}
    </AppShell>
  );
}
