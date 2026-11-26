"use client";

import React from "react";
import { AppShell } from "../../../../src/AppShell";

// An app moving to Semi in stages (#184): the migrated route group loads the app's own Tailwind build (legacy.css)
// and Semi's scoped entry (semi.css). No route header, so the phone top bar (`md:hidden … flex`) is rendered: the
// legacy build also has `.flex`, which must not beat Semi's `md:hidden` whichever sheet comes first.
export function StagedShell({ base, children }: { base: string; children: React.ReactNode }) {
  return (
    <AppShell
      productName="Semi Staged"
      sections={[
        {
          label: "Workspace",
          items: [
            { id: "orders", label: "Orders", icon: "bag", href: `/${base}/orders` },
            { id: "other", label: "Customers", icon: "users", href: `/${base}/other` },
          ],
        },
      ]}
      activeId="orders"
    >
      {children}
    </AppShell>
  );
}
