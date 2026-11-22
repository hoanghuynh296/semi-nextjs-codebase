# App shell

The frame of a multi-page app: a floating sidebar on bg-canvas with the accent Create action on top, the main nav, a pinned group and the utilities and account at the bottom; it collapses to an icon rail (the default on iPad) and becomes a full-screen drawer on phones. Items can carry sub-items or a mega menu. This docs site is an AppShell; the full example runs at /demo/app-shell/.

## When to use

- Every app with several pages (dashboards, admin, store back office).
- An area with its own sub-views that people switch between often (mailbox folders, saved views): sub-items under one nav item.
- An area with many destinations in a few groups (a catalogue): a nav item with mega (MegaMenu).

## Use something else when

| Need | Use |
|---|---|
| A single-screen tool or editor (3D, canvas) | AppHeader |
| 2–4 sibling views of one page that do not need a place in the menu | PageTabsTitle |
| Filters of a list (status, owner) | Pills or CustomSelect in SubpageToolbar |

## Import

```tsx
import { AppShell, MobileTabBar } from "@semi/ui";
```

## Examples

### Create, pinned, utilities, mega menu

The whole shell in one screen, opened full screen at /demo/app-shell/ of this site: Create menu, sub-items, a mega menu, a pinned group, utilities and the account; MinimalHeader and TextTabs in the page.

```tsx
"use client";

import { useState } from "react";
import {
  AppShell,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  MinimalHeader,
  TextTabs,
  useTheme,
  type ShellNavItem,
  type ShellNavSection,
} from "@semi/ui";

// The whole shell of the #94 study in one screen. A real app renders AppShell in layout.tsx and gives page items an
// `href` (shell-nav-href); this demo keeps everything on one page with onSelect so it can run anywhere.
const SECTIONS: ShellNavSection[] = [
  {
    items: [
      { id: "inbox", label: "Hộp thư", icon: "inbox" },
      {
        id: "orders",
        label: "Đơn hàng",
        icon: "bag",
        children: [
          { id: "orders-open", label: "Đang xử lý" },
          { id: "orders-done", label: "Đã giao" },
        ],
      },
      {
        id: "catalog",
        label: "Sản phẩm",
        icon: "box",
        mega: {
          columns: [
            {
              title: "Danh mục",
              items: [
                { id: "printers", label: "Máy in", icon: "printer", href: "#", hint: "Máy in 3D và phụ kiện" },
                { id: "filament", label: "Nhựa in", icon: "layers", href: "#", hint: "PLA, PETG, TPU" },
              ],
            },
            {
              title: "Bán hàng",
              items: [
                { id: "prices", label: "Bảng giá", icon: "tag", href: "#" },
                { id: "bundles", label: "Combo", icon: "package", href: "#", isNew: true },
              ],
            },
          ],
          seeAll: { href: "#" },
        },
      },
      { id: "suppliers", label: "Nhà cung cấp", icon: "truck" },
      { id: "customers", label: "Khách hàng", icon: "users" },
    ],
  },
];

const PINNED = {
  label: "Đã ghim",
  items: [
    { id: "pin-late", label: "Đơn trễ hạn", icon: "clock" },
    { id: "pin-vip", label: "Khách VIP", icon: "star" },
  ] satisfies ShellNavItem[],
};

const TABS = [
  { key: "open", label: "Đang xử lý" },
  { key: "done", label: "Đã giao" },
  { key: "all", label: "Tất cả" },
] as const;

export default function FullShell() {
  const [active, setActive] = useState("orders-open");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("open");
  const { resolvedTheme, toggleTheme } = useTheme();
  const utilities: ShellNavItem[] = [
    { id: "help", label: "Trợ giúp", icon: "info", onClick: () => {} },
    { id: "theme", label: resolvedTheme === "dark" ? "Giao diện sáng" : "Giao diện tối", icon: resolvedTheme === "dark" ? "sun" : "moon", onClick: toggleTheme },
    { id: "settings", label: "Cài đặt", icon: "settings" },
  ];

  return (
    <AppShell
      productName="Sales Hub"
      logoIcon="bag"
      sections={SECTIONS}
      activeId={active}
      onSelect={setActive}
      create={{
        label: "Tạo mới",
        items: [
          { label: "Đơn hàng", icon: "bag", onSelect: () => setActive("orders-open") },
          { label: "Khách hàng", icon: "users", onSelect: () => setActive("customers") },
          { label: "Sản phẩm", icon: "box", onSelect: () => {} },
          { label: "Phiếu nhập", icon: "receipt", onSelect: () => {} },
        ],
      }}
      pinned={PINNED}
      utilities={utilities}
      account={({ collapsed }) => (
        <div className={collapsed ? "flex justify-center py-1" : "flex items-center gap-2.5 px-1.5 py-1 min-w-0"}>
          <Avatar name="Lan Phạm" size="sm" />
          {!collapsed && (
            <span className="hidden lg:block min-w-0">
              <span className="block truncate text-label font-medium text-contrast">Lan Phạm</span>
              <span className="block truncate text-caption text-muted">Cửa hàng Quận 1</span>
            </span>
          )}
        </div>
      )}
    >
      <MinimalHeader
        left={<Breadcrumb items={[{ label: "Sales Hub", href: "#" }, { label: "Đơn hàng" }]} />}
        link={<a href="#" className="text-accent-fg hover:underline">Hướng dẫn</a>}
        primary={
          <Button variant="primary" icon="plus">
            Tạo đơn
          </Button>
        }
      />
      <TextTabs label="Đơn hàng" items={[...TABS]} value={tab} onChange={setTab}>
        <div className="@container">
        <div className="grid gap-group @2xl:grid-cols-2 @5xl:grid-cols-3">
          {["DH-1042", "DH-1041", "DH-1039", "DH-1037", "DH-1036", "DH-1033"].map((id, i) => (
            <Card key={id} className="flex flex-col gap-stack">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="text-ui font-semibold text-contrast truncate">{id}</span>
                <span className="text-label text-muted tabular-nums shrink-0">{(i + 2) * 450}.000 ₫</span>
              </div>
              <p className="text-ui text-body truncate">{["Bambu Lab A1 mini", "PLA Basic 1kg × 4", "Combo AMS Lite", "PETG HF 1kg × 2", "Bàn in PEI", "TPU 95A 1kg"][i]}</p>
            </Card>
          ))}
        </div>
        </div>
      </TextTabs>
    </AppShell>
  );
}
```

### Root layout

AppShell fills the viewport, so it is shown as code: this very page is the live example.

```tsx
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
```

### Session gate in the layout

A client-only app checks the session once in the route-group layout and shows BootLoader until it knows whether to render the shell or go to login.

```tsx
"use client";

// app/(app)/layout.tsx of a client-only app: the session check runs once here, never per page.
// With a server session (proxy / async server layout) drop the gate: render AppShell straight away.
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, BootLoader, type ShellNavSection } from "@semi/ui";

const SECTIONS: ShellNavSection[] = [
  {
    label: "Dữ liệu",
    items: [
      { id: "search", label: "Tìm kiếm", icon: "search", href: "/search" },
      { id: "companies", label: "Doanh nghiệp", icon: "store", href: "/companies" },
      { id: "import", label: "Nhập file", icon: "upload", href: "/import" },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? setReady(true) : router.replace("/login")))
      .catch(() => router.replace("/login"));
  }, [router]);

  // Before the layout is known: a centred spinner, not a page skeleton that may never appear.
  if (!ready) return <BootLoader />;
  const active = SECTIONS[0].items.find((i) => path.startsWith(i.href ?? ""))?.id ?? "search";
  return (
    <AppShell productName="Data Hub" logoIcon="database" sections={SECTIONS} activeId={active}>
      {children}
    </AppShell>
  );
}
```

### Content loading

A route loading.tsx beside the layout: the shell stays mounted and only the content area shimmers.

```tsx
// app/(app)/loading.tsx: Next.js shows it inside the layout, so the shell stays and only the content shimmers.
import { PageSkeleton } from "@semi/ui";

export default function Loading() {
  return <PageSkeleton />;
}
```

### Sub-items

A mailbox with folders as sub-items, and the page's own folder picker when the sidebar cannot show them.

```tsx
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
```

## API

### AppShell

| Prop | Type | Default | Description |
|---|---|---|---|
| `productName` * | `string` |  | Product title shown in the sidebar header (e.g. "3D Noobs Studio", "Auton"). |
| `logoIcon` | `IconName` | `"sparkles"` | Icon inside the default brand tile. |
| `logo` | `React.ReactNode` |  | Optional custom logo element replacing the default brand tile. |
| `sections` * | `ShellNavSection[]` |  | Navigation groups separated by thin dividers in the left panel. |
| `activeId` * | `string` |  | Currently active item id (or route path). |
| `onSelect` | `(id: string) => void` |  | Called with the item id when an item is clicked. Items with `href` stay `next/link` links either way, so use it to react to a click (close a sheet, track), not to route: give page items an `href` (`shell-nav-href`). |
| `create` | `ShellCreate` |  | The accent Create action on top (one per app): a menu of things to create, or one link / action. |
| `primaryCta` | `{ label: string; icon: IconName; href?: string; external?: boolean; onClick?: () => void; }` |  | Optional highlighted launcher under Create (another app, a docs link). |
| `pinned` | `ShellPinned` |  | A group under the main nav (saved views, frequent records) with a `text-overline` label. |
| `utilities` | `ShellNavItem[]` | `[]` | Utilities at the bottom of the sidebar (help, theme, notifications): usually items with `onClick`. |
| `account` | `ShellSlot` |  | The account at the very bottom (avatar, workspace switcher). Receives `{ collapsed }` to hide text in the rail. |
| `footer` | `ShellSlot` |  |  |
| `mobileNav` | `'drawer' \| 'tabs'` | `"drawer"` | Phone navigation: `drawer` (default, a full-screen menu from the top bar) or `tabs` (the old MobileTabBar). |
| `mobileTabIds` | `string[]` |  |  |
| `storageKey` | `string` | `"semi_sidebar_collapsed"` | localStorage key for persisting sidebar collapsed state. |
| `children` * | `React.ReactNode` |  |  |
| `containerClassName` | `string` | `""` |  |

### MobileTabBar

| Prop | Type | Default | Description |
|---|---|---|---|
| `tabs` * | `MobileTabItem[]` |  |  |
| `active` * | `string` |  |  |
| `onSelect` | `(id: string) => void` |  |  |
| `moreOpen` | `boolean` | `false` | When the app has more routes than fit on the bottom bar, show a final "Menu" tab that opens a sheet. |
| `onToggleMore` | `() => void` |  |  |
| `moreLabel` | `string` | `"Menu"` |  |

## Accessibility

- The sidebar is a complementary landmark named after the product with nav landmarks inside; the active item has aria-current; the collapse state is remembered per app (storageKey).
- In the rail (collapsed, or md) every item is named (aria-label) and shows its name in a Tooltip on the right on hover and focus.
- An item with sub-items has aria-expanded; its sub-items are a list named after it, the active one with aria-current. A mega item has aria-haspopup="dialog" and aria-expanded.
- The phone drawer is a modal dialog: focus moves in, Tab stays in, Escape goes back a level or closes, and focus returns to the menu button.

## Notes

- Render it once in the root layout (or a route group layout); pages render only their content.
- Page items take an href: they stay next/link links even when onSelect is set (onSelect then only reports the click). Never route with onSelect + router.push (shell-nav-href).
- Never gate the shell behind a page skeleton (shell-gate): a route loading.tsx next to the layout shimmers the content only, and the boot / session check before the layout is known renders BootLoader once in the layout. A page never renders AppShell or imports a component that does (app-shell-in-page).
- Top to bottom: create (one accent action, a Menu when it has items), primaryCta (an optional launcher), sections, pinned (a text-overline label), then utilities (items with onClick: help, theme) and account (avatar, workspace).
- footer is deprecated: split it into utilities (actions) and account (who is signed in). The 0.36.0 migration renames footer to account.
- Phones use the drawer (a top bar with the menu button). mobileNav="tabs" brings back MobileTabBar; mobileTabIds is deprecated and only applies there.
- Sub-items (children) are closed by default: they open under their parent while the parent or one of them is the activeId, and close when another item is chosen. One level only.
- Sub-items take an optional grey icon (give every sub-item of a parent one, or none); no colour dot or count (the menu stays neutral, §4). Put counts and colours in the page.
- The rail and widths below lg never show sub-items: read useAppShell().submenuVisible and give the page its own picker (a CustomSelect in the toolbar) when it is false. The phone drawer shows them as a drill-down level.
- Choosing the parent alone usually opens its first sub-item: map it in onSelect.

<!-- GENERATED by scripts/build-docs.mjs from examples/app-shell/ and the types in src/ -->
