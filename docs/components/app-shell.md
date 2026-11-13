# App shell

The frame of a multi-page app: a floating bento sidebar (w-52, collapses to a w-14 icon rail) on bg-canvas, the content panel beside it, and MobileTabBar at the bottom on phones. Items can carry sub-items that open only while their parent is chosen. This docs site is an AppShell.

## When to use

- Every app with several pages (dashboards, admin, store back office).
- An area with its own sub-views that people switch between often (mailbox folders, saved views): sub-items under one nav item.

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

### Sub-items

A mailbox with folders as sub-items, and the page's own folder picker when the sidebar cannot show them.

```tsx
"use client";

import { useState } from "react";
import { AppShell, CustomSelect, PageTitle, useAppShell, type ShellNavSection } from "@semi/ui";

const FOLDERS = [
  { id: "mail:inbox", label: "Hộp thư đến" },
  { id: "mail:starred", label: "Gắn sao" },
  { id: "mail:sent", label: "Đã gửi" },
  { id: "mail:failed", label: "Thất bại" },
];

const SECTIONS: ShellNavSection[] = [
  {
    label: "Làm việc",
    hideLabel: true,
    items: [
      // Choosing "Hộp thư" opens its sub-items; choosing another item closes them.
      { id: "mail", label: "Hộp thư", icon: "send", children: FOLDERS },
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
| `logoIcon` | `IconName` | `"sparkles"` | Icon inside the default 24x24 brand tile. |
| `logo` | `React.ReactNode` |  | Optional custom logo element replacing the default brand tile. |
| `sections` * | `ShellNavSection[]` |  | Navigation groups separated by thin dividers in the left panel. |
| `activeId` * | `string` |  | Currently active item id (or route path). |
| `onSelect` | `(id: string) => void` |  | Callback when a tab is clicked (optional if items use `href` routing). |
| `primaryCta` | `{ label: string; icon: IconName; href?: string; external?: boolean; onClick?: () => void; }` |  | Optional highlighted CTA button at the top of the sidebar (e.g. Slicer launcher). |
| `footer` | `React.ReactNode \| ((state: { collapsed: boolean }) => React.ReactNode)` |  | Footer content at the bottom of the sidebar. Receives `{ collapsed }` so it can hide text in rail mode. |
| `mobileTabIds` | `string[]` |  | Up to 5 item ids to pin on the phone bottom tab bar (defaults to the first 5 items). |
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

- The sidebar is a nav landmark; the active item has aria-current; the collapse state is remembered per app (storageKey).
- An item with sub-items has aria-expanded; its sub-items are a list named after it, the active one with aria-current.

## Notes

- Render it once in the root layout (or a route group layout); pages render only their content.
- Use next/link hrefs for items; onSelect is for in-page sections.
- MobileTabBar is used by AppShell; render it yourself only in a custom shell.
- Sub-items (children) are closed by default: they open under their parent while the parent or one of them is the activeId, and close when another item is chosen. One level only.
- Sub-items are text only: no icon, colour dot or count (the menu stays neutral, §4). Put counts and colours in the page.
- The rail (w-14), widths below lg and phones never show sub-items: read useAppShell().submenuVisible and give the page its own picker (a CustomSelect in the toolbar) when it is false.
- Choosing the parent alone usually opens its first sub-item: map it in onSelect.

<!-- GENERATED by scripts/build-docs.mjs from examples/app-shell/ and the types in src/ -->
