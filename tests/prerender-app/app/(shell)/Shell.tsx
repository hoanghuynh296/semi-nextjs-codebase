"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppShell } from "../../../../src/AppShell";
import { TextTabs } from "../../../../src/TextTabs";

// The app-wide shell as products mount it (#96, #144): AppShell with a main action, a mega item (MegaMenu), sub-items,
// pinned, the bottom row, and the route header with slots (an action holding state, a middle that reads search params,
// the account avatar menu). None of them may call a router hook that suspends outside a boundary, or the dynamic route
// below fails `next build` with CLIENT_HOOK_DYNAMIC (the ToastHost lesson, #82): the header puts its middle and
// actions in their own Suspense.

/** Mounts of the slot below: a slot must keep one instance across a collapse toggle, a resize and a route change. */
let mounts = 0;

/** A header slot written as a plain function that calls hooks (rendered as a component by the shell). */
function CounterSlot() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    mounts += 1;
    (window as unknown as { __slotMounts: number }).__slotMounts = mounts;
  }, []);
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      Count {count}
    </button>
  );
}

/** The middle reads search params: it suspends during prerender, inside the header's own Suspense. */
function QueryMiddle() {
  const q = useSearchParams().get("q");
  return <span data-testid="query-middle">{q ? `Search: ${q}` : "No search"}</span>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<"open" | "done">("open");
  const path = usePathname();
  const active = path.startsWith("/shell-guard") ? "guard" : path === "/shell/open" ? "open" : path.startsWith("/shell/") ? "orders" : "home";
  return (
    <AppShell
      productName="Prerender"
      sections={[
        {
          items: [
            { id: "home", label: "Home", icon: "grid", href: "/shell/a" },
            { id: "orders", label: "Orders", icon: "bag", href: "/shell/orders", children: [{ id: "open", label: "Open", href: "/shell/open" }] },
            {
              id: "catalog",
              label: "Catalog",
              icon: "box",
              mega: { columns: [{ title: "Products", items: [{ id: "p", label: "Printers", href: "/shell/p", isNew: true }] }], seeAll: { href: "/shell/all" } },
            },
          ],
        },
        { label: "Forms", items: [{ id: "guard", label: "Guarded form", icon: "edit", href: "/shell-guard" }] },
      ]}
      activeId={active}
      mainAction={{ label: "Create", items: [{ label: "Order", onSelect: () => {} }] }}
      pinned={{ label: "Pinned", items: [{ id: "late", label: "Late", icon: "clock", href: "/shell/late" }] }}
      tools={[
        { id: "inbox", label: "Inbox", icon: "inbox", count: 120, onClick: () => {} },
        { id: "help", label: "Help", icon: "info", onClick: () => {} },
      ]}
      toolsMenu={[{ label: "Settings", onSelect: () => {} }]}
      header={{
        middle: <QueryMiddle />,
        actions: CounterSlot,
        account: { name: "Ada Lovelace", detail: "Admin", items: [{ label: "Account", href: "/shell/account" }], onSignOut: () => {} },
      }}
    >
      <TextTabs label="Orders" value={tab} onChange={setTab} items={[{ key: "open", label: "Open" }, { key: "done", label: "Done" }]}>
        {children}
      </TextTabs>
    </AppShell>
  );
}
