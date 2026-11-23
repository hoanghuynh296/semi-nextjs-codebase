"use client";

import { useState } from "react";
import { AppShell } from "../../../../src/AppShell";
import { useThemeUtility } from "../../../../src/ThemeProvider";
import { TextTabs } from "../../../../src/TextTabs";

// The app-wide shell as products mount it (#96): AppShell with Create, a mega item (MegaMenu), sub-items, pinned,
// utilities (with the theme Menu, #114) and account, and TextTabs in the content. None of them may call a router hook
// that suspends, or the dynamic route below fails `next build` with CLIENT_HOOK_DYNAMIC (the ToastHost lesson, #82).
export function Shell({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<"open" | "done">("open");
  const theme = useThemeUtility({ label: "Theme", labels: { light: "Light", dark: "Dark", system: "System" } });
  return (
    <AppShell
      productName="Prerender"
      sections={[
        {
          items: [
            { id: "home", label: "Home", icon: "grid", href: "/" },
            { id: "orders", label: "Orders", icon: "bag", href: "/shell/orders", children: [{ id: "open", label: "Open", href: "/shell/open" }] },
            {
              id: "catalog",
              label: "Catalog",
              icon: "box",
              mega: { columns: [{ title: "Products", items: [{ id: "p", label: "Printers", href: "/shell/p", isNew: true }] }], seeAll: { href: "/shell/all" } },
            },
          ],
        },
      ]}
      activeId="orders"
      create={{ label: "Create", items: [{ label: "Order", onSelect: () => {} }] }}
      pinned={{ label: "Pinned", items: [{ id: "late", label: "Late", icon: "clock", href: "/shell/late" }] }}
      utilities={[{ id: "help", label: "Help", icon: "info", onClick: () => {} }, theme]}
      account={({ rail }) => (rail ? null : <span>Account</span>)}
    >
      <TextTabs label="Orders" value={tab} onChange={setTab} items={[{ key: "open", label: "Open" }, { key: "done", label: "Done" }]}>
        {children}
      </TextTabs>
    </AppShell>
  );
}
