# App shell

The 1.0 frame of a multi-page app: a canvas frame with the nav panel (main action, groups, pinned, a bottom row of icon tools) and the content column (the RouteHeader with crumbs, actions and the account avatar menu, then the content card). The nav is the 72px rail first when width runs short (always md–lg, by default lg–1280, the user's toggle remembered), then the phone drawer. Alt + 1…9 opens a nav item. This docs site is an AppShell; the full example runs at /demo/app-shell/.

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
import { AppShell, RouteHeader, AccountMenu, MobileTabBar } from "@semi/ui";
```

## Examples

### Main action, tools, header, account menu

The whole shell in one screen, opened full screen at /demo/app-shell/ of this site: main action menu, sub-items, a mega menu, a pinned group, tools with a count and a ••• menu, a header action with its own state and the account avatar menu.

```tsx
"use client";

import { useState } from "react";
import {
  AppShell,
  Button,
  Card,
  PageTitle,
  TextTabs,
  Tooltip,
  type ShellNavItem,
  type ShellNavSection,
} from "@semi/ui";

// The whole 1.0 shell in one screen: main action, groups, sub-items, a mega menu, a pinned group, the bottom row of
// tools, and the route header with an action and the account avatar menu (theme, account, sign-out). A real app renders AppShell in layout.tsx and gives page items an
// `href` (shell-nav-href); this demo keeps everything on one page with onSelect so it can run anywhere.
const SECTIONS: ShellNavSection[] = [
  {
    items: [
      { id: "inbox", label: "Hộp thư", icon: "inbox", right: <span className="px-1 text-chrome text-muted tabular-nums">3</span> },
      {
        id: "orders",
        label: "Đơn hàng",
        icon: "bag",
        href: "#orders",
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

const PRICE = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const TABS = [
  { key: "open", label: "Đang xử lý" },
  { key: "done", label: "Đã giao" },
  { key: "all", label: "Tất cả" },
] as const;

/** A header action with its own state: a slot is rendered as a component, so it may hold state and call hooks. */
function StarAction() {
  const [on, setOn] = useState(false);
  return (
    <Tooltip content={on ? "Bỏ ghim trang" : "Ghim trang"}>
      <Button variant="ghost" iconOnly icon="star" aria-label="Ghim trang" aria-pressed={on} onClick={() => setOn(!on)} className="!w-8 !h-8" />
    </Tooltip>
  );
}

export default function FullShell() {
  const [active, setActive] = useState("orders-open");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("open");

  return (
    <AppShell
      productName="Sales Hub"
      logoIcon="bag"
      sections={SECTIONS}
      activeId={active}
      onSelect={setActive}
      mainAction={{
        label: "Tạo mới",
        items: [
          // not available on this plan: shown, but disabled (the phone drawer focuses the first enabled row)
          { label: "Báo giá", icon: "fileText", disabled: true, onSelect: () => {} },
          { label: "Đơn hàng", icon: "bag", onSelect: () => setActive("orders-open") },
          { label: "Khách hàng", icon: "users", onSelect: () => setActive("customers") },
          { label: "Sản phẩm", icon: "box", onSelect: () => {} },
          { label: "Phiếu nhập", icon: "receipt", onSelect: () => {} },
        ],
      }}
      pinned={PINNED}
      tools={[
        { id: "notifications", label: "Thông báo", icon: "bell", count: 12, onClick: () => {} },
        { id: "help", label: "Trợ giúp", icon: "info", onClick: () => {} },
      ]}
      toolsMenu={[
        { label: "Cài đặt", icon: "settings", onSelect: () => {} },
        { label: "Phím tắt", icon: "layers", onSelect: () => {} },
      ]}
      header={{
        actions: <StarAction />,
        account: {
          name: "Lan Phạm",
          detail: "Cửa hàng Quận 1",
          items: [{ label: "Tài khoản", icon: "user", onSelect: () => {} }],
          onSignOut: () => {},
        },
      }}
    >
      <PageTitle
        title="Đơn hàng"
        actions={
          <Button variant="inverse" icon="plus">
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
                <span className="text-ui font-medium text-strong truncate">{id}</span>
                <span className="text-ui text-muted tabular-nums shrink-0">{PRICE.format((i + 2) * 450_000)}</span>
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
import { AppShell, type ShellNavSection } from "@semi/ui";

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
    <AppShell
      productName="3D Noobs Manager"
      logoIcon="printer"
      sections={SECTIONS}
      activeId={active}
      tools={[{ id: "help", label: "Trợ giúp", icon: "info", href: "/help" }]}
      // the account avatar menu holds the theme (Light / Dark / System), the app's items and sign-out
      header={{ account: { name: "Minh Trần", detail: "minh@example.com", items: [{ label: "Tài khoản", icon: "user", href: "/account" }], onSignOut: () => {} } }}
    >
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
| `productName` * | `string` |  | Product title shown next to the logo (e.g. "3D Noobs Studio", "Auton"). |
| `logoIcon` | `IconName` | `"sparkles"` | Icon inside the default brand tile. |
| `logo` | `React.ReactNode` |  | Optional custom logo element replacing the default brand tile (32px tall). |
| `sections` * | `ShellNavSection[]` |  | Nav groups, separated by a 24px spacer with a line. |
| `activeId` * | `string` |  | Currently active item id (or route path). |
| `onSelect` | `(id: string) => void` |  | Called with the item id when an item is clicked. Items with `href` stay `next/link` links either way, so use it to react to a click (close a sheet, track), not to route: give page items an `href` (`shell-nav-href`). |
| `mainAction` | `ShellAction \| ShellSlot` |  | The nav's one main action, the only brand-filled control in the nav: data (label + icon, a menu, a link or an action) drawn as an ordinary primary button, or your own slot. In the rail: the icon with a Tooltip. The phone drawer shows the data form as a row; a slot keeps its one instance in the nav, so give phones its action elsewhere. |
| `primaryCta` | `{ label: string; icon: IconName; href?: string; external?: boolean; onClick?: () => void; }` |  | Optional quiet launcher under the main action (another app, a docs link). |
| `pinned` | `ShellPinned` |  | A group under the main nav (saved views, frequent records). |
| `tools` | `ShellTool[]` | `[]` | The bottom row of the nav: 32×32 ghost icon buttons (help, notifications), stacked in the rail. |
| `toolsMenu` | `MenuItem[]` | `[]` | The rest of the bottom row, in a ••• Menu after the tools. |
| `header` | `false \| ShellHeader` |  | The route header (crumbs, middle, actions, account). Default: shown with the default crumbs. `false`: none. |
| `page` | `'scroll' \| 'fixed'` | `"scroll"` | `scroll` (default): the content card scrolls. `fixed`: the card fills the column and does not scroll; the page's panels scroll inside it (list + reader, a pinned bar). Give the page `h-full min-h-0 flex flex-col`. |
| `flush` | `boolean` | `false` | No centred max-width container and no padding around the page: the page layout decides (T7). |
| `railBelow` | `number` | `1280` | Below this width (px, at least 1024) the nav starts as the rail while the user has not chosen; from it, expanded. Between md and lg it is always the rail. Default 1280. |
| `railWidth` | `number` | `72` | Width of the rail in px (default 72; the icons stay 32px, centred). |
| `shortcuts` | `boolean` | `true` | ⌥ / Alt + 1…9 opens the nth nav item (⌘ / Ctrl + digit in an installed app). Default true. |
| `mobileNav` | `'drawer' \| 'tabs'` |  | Phone navigation: `drawer` (a full-screen menu from the header's menu button) or `tabs` (MobileTabBar, the items in `mobileTabIds`). Default: `tabs` when `mobileTabIds` is set, else `drawer`. |
| `mobileTabIds` | `string[]` |  | With `mobileNav="tabs"`: the ids of the items on the tab bar (up to 5; the rest go in its More sheet). |
| `storageKey` | `string` | `"semi-nav"` | localStorage key of the user's collapse choice ("rail" / "full"; one value for every width). A 0.x value ("1" / "0", in this key or in the old default key `semi_sidebar_collapsed`) is upgraded once on load. |
| `children` * | `React.ReactNode` |  |  |
| `containerClassName` | `string` | `""` | Classes added to the page container inside the content card. |

### RouteHeader

The route header: h60 from `lg` (56 below), padding 0 8px (16px from `sm`), the column's full width. Crumbs enter with
`motion-crumb-in` and leave with `motion-crumb-out` (opacity only under reduced motion); the row itself never moves.

| Prop | Type | Default | Description |
|---|---|---|---|
| `crumbs` * | `RouteCrumb[]` |  | The trail: group (a link), page, record. Every crumb is muted; the trail never wraps and long crumbs truncate. |
| `middle` | `React.ReactNode` |  | Optional middle: a search field on a search page, a small info banner. Hidden below `md`. In its own Suspense. |
| `actions` | `React.ReactNode` |  | The page's action icon buttons (32×32, ghost or outline); keep room for a future AI chat button. In its own Suspense. |
| `account` | `ShellAccount \| React.ReactNode` |  | The account avatar menu: the who-is-signed-in data, or your own element. |
| `onMenu` | `() => void` |  | Phones: the menu button that opens the nav drawer (shown below `md` when set). |
| `menuExpanded` | `boolean` |  |  |
| `className` | `string` |  |  |

### AccountMenu

The account avatar menu of the route header: a one-letter avatar (32px) whose Menu has a header (name, role or email),
then the theme (Light / Dark / System), the app's items and sign-out.

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` * | `string` |  | The person's name: the avatar shows its first letter, the menu header shows it whole. |
| `detail` | `string` |  | One line under the name in the menu header: a role or an email. |
| `avatarSrc` | `string` |  | A photo in place of the letter. |
| `items` | `MenuItem[]` | `[]` | The app's own items (Tài khoản, Cài đặt…), between the theme choices and sign-out. |
| `onSignOut` | `() => void` |  | Adds the last item, "Đăng xuất" (locale `signOut`), after a divider. |
| `theme` | `boolean` | `true` | Light / Dark / System as radio items at the top (default true). Turn off only when the app pins one theme. |

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

- The nav is a complementary landmark named after the product with nav landmarks inside; the active item has aria-current; the collapse choice is one stored value (storageKey).
- In the rail every item keeps its name (the label is visually hidden, never removed) and shows it in a Tooltip on the right with its shortcut, on hover and focus.
- The route header's trail is a navigation named "Đường dẫn" with aria-current on the last crumb; the account avatar is a named button opening a menu (a header that is not an item, radio items for the theme, account items, sign-out) by keyboard.
- An item with sub-items has aria-expanded; its sub-items are a list named after it. A mega item has aria-haspopup="dialog" and aria-expanded.
- Bottom-row tools are named with their count ("Thông báo (12)"); the badge itself is hidden from assistive tech.
- Nav shortcuts (Alt + digit) click the link, so the router and an unsaved-changes guard run; ignored while composing (IME), in fields and editors, and when the app already took the key.
- The phone drawer is a modal dialog: focus moves in, Tab stays in, Escape goes back a level or closes, and focus returns to the menu button.

## Notes

- Render it once in the root layout (or a route group layout); pages render only their content. It never remounts on a route change or a resize.
- Page items take an href: they stay next/link links even when onSelect is set (onSelect then only reports the click). Never route with onSelect + router.push (shell-nav-href).
- Never gate the shell behind a page skeleton (shell-gate): a route loading.tsx next to the layout shimmers the content only, and the boot / session check before the layout is known renders BootLoader once in the layout. A page never renders AppShell or imports a component that does (app-shell-in-page).
- Top to bottom: logo + collapse, mainAction (the one brand-filled button: label + icon, a Menu with items), primaryCta (an optional quiet launcher), sections, pinned, then tools (32×32 icons with a count) and toolsMenu (•••).
- header: crumbs (default from the active item; useRecordCrumb(label) in a detail page adds its record), middle (search field, banner; hidden below md), actions (32×32 ghost icon buttons) and account ({ name, detail, items, onSignOut }: the theme is in that menu). header={false} drops the row.
- Slots (mainAction, header.middle / actions / account) are an element or a function of { collapsed, rail } rendered as one stable component: it may call hooks and keeps its state across a collapse, a resize and a route change. rail is exact after mount only.
- railBelow (default 1280, at least 1024) sets where the nav starts expanded; between md and lg it is always the rail. railWidth (default 72) sets the rail width.
- page="fixed": the card does not scroll; give the page h-full min-h-0 flex flex-col and let its panels scroll. flush: no centred max-width container or padding.
- 1.0 breaking: create → mainAction and utilities → tools (the 1.0.0-app-shell migration renames them); account / footer are gone from the nav (move the account to header.account); the stored collapse key is now semi-nav (a 0.x choice is upgraded once on load).
- Phones use the drawer (the header's menu button) unless the app sets mobileNav="tabs", with mobileTabIds naming the items on MobileTabBar. In the drawer a parent with its own href is the first row of its level.
- Sub-items (children) open under their parent while the parent or one of them is the activeId. The rail and widths below lg never show them: read useAppShell().submenuVisible and give the page its own picker when it is false.
- Pinned items in the rail: give each a distinct icon, or none so the rail shows its initials (shortLabel to choose them).
- Shortcut hints in a CommandPalette: shortcut: useAppShell().shortcuts[id] inside the shell, or navShortcutKeys(n) outside it.
- The nav's stored choice is set on <html> (data-semi-nav) by an inline script before paint: give <html> suppressHydrationWarning, as ThemeScript already asks. A slot main action is not repeated in the phone drawer (one instance): give phones its action elsewhere, or pass the data form.

<!-- GENERATED by scripts/build-docs.mjs from examples/app-shell/ and the types in src/ -->
