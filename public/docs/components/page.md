# Page layouts

Shared 1.0 page anatomy and three layouts inside AppShell's content card: work (flush, padding 16 / 24), reading (centred max 1536px inside 16px card padding, 64px bottom), and two-column (240px sub-nav card + 4px gap + main card, stacking below md). Owns vertical rhythm (32 / 28 / 32 / 16 / 8).

## When to use

- Every page inside AppShell: lists and workspaces (work), settings / explore / articles (reading), areas with sub-pages or mailbox folders (two-column).
- Shared page slots (title, actions, tabs, intro, toolbar, content, footer) so pages set no margins between blocks.

## Use something else when

| Need | Use |
|---|---|
| A tool with a 380px control panel and live result | WorkspaceLayout inside Page layout="work" |
| A list and open record side by side | ListReaderLayout inside Page fixed |

## Import

```tsx
import { Page, PageEnter, SubNav, PageSection, PageGrid } from "@semi/ui";
```

## Examples

### Work layout (flush)

```tsx
"use client";

import { Button, Card, KpiCard, Page, PageGrid, PageSection, toast } from "@semi/ui";

export default function PageWorkExample() {
  return (
    <Page
      layout="work"
      title="Tổng quan xưởng in"
      actions={
        <Button variant="inverse" icon="plus" onClick={() => toast({ title: "Tạo lệnh in" })}>
          Tạo lệnh in
        </Button>
      }
    >
      <PageSection title="Hôm nay">
        <PageGrid columns={3}>
          <KpiCard label="Đang in" value="8 máy" sub="2 máy sắp xong" featured />
          <KpiCard label="Hoàn thành" value="24 đơn" sub="+4 so với hôm qua" />
          <KpiCard label="Chờ duyệt" value="3 đơn" sub="Cần kiểm tra file" />
        </PageGrid>
      </PageSection>
      <PageSection title="Ghi chú vận hành">
        <Card>
          <p className="text-ui text-body">Ca chiều ưu tiên các đơn giao trong ngày trước 17:00.</p>
        </Card>
      </PageSection>
    </Page>
  );
}
```

### Reading layout (centred 1536px + 44px title)

```tsx
"use client";

import { Card, Page, PageGrid, PageSection } from "@semi/ui";

const ITEMS = [
  { title: "Nhựa PLA+", detail: "Dễ in, ít cong vênh cho mô hình trưng bày." },
  { title: "Nhựa PETG", detail: "Chịu nhiệt tốt hơn, phù hợp vỏ thiết bị." },
  { title: "Nhựa ABS", detail: "Bền cơ học cao, cần buồng in kín." },
];

export default function PageReadingExample() {
  return (
    <Page
      layout="reading"
      title="Thư viện vật liệu"
      titleVariant="reading"
      intro="Chọn đúng vật liệu giúp bản in bền và ổn định kích thước ngay từ lần đầu."
    >
      <PageSection title="Vật liệu phổ biến" editorial>
        <PageGrid columns={3}>
          {ITEMS.map((item) => (
            <Card key={item.title} className="flex flex-col gap-2">
              <h3 className="text-lead font-medium text-strong">{item.title}</h3>
              <p className="text-ui text-muted">{item.detail}</p>
            </Card>
          ))}
        </PageGrid>
      </PageSection>
    </Page>
  );
}
```

### Two-column layout (SubNav + main card)

```tsx
"use client";

import { useState } from "react";
import { Button, Card, Page, PageSection, SubNav, toast, type SubNavSection } from "@semi/ui";

export default function PageTwoColumnExample() {
  const [active, setActive] = useState("inbox");
  const sections: SubNavSection[] = [
    {
      label: "Thư mục",
      items: [
        { id: "inbox", label: "Hộp thư đến", icon: "inbox", meta: 12 },
        { id: "sent", label: "Đã gửi", icon: "send" },
        { id: "archive", label: "Lưu trữ", icon: "folder" },
      ],
    },
    {
      label: "Nhóm thư",
      actions: [{ label: "Tạo nhóm thư", icon: "plus", onClick: () => toast({ title: "Tạo nhóm thư mới" }) }],
      items: [
        { id: "suppliers", label: "Nhà cung cấp", icon: "tag", meta: 4 },
        { id: "quotes", label: "Báo giá", icon: "fileText", meta: 7 },
      ],
    },
  ];
  const current = sections.flatMap((s) => s.items).find((i) => i.id === active);
  return (
    <Page
      layout="two-column"
      subNav={<SubNav sections={sections} activeId={active} onSelect={setActive} label="Thư mục hộp thư" />}
      title={current?.label ?? "Hộp thư"}
      actions={
        <Button variant="inverse" icon="plus" onClick={() => toast({ title: "Soạn thư mới" })}>
          Soạn thư
        </Button>
      }
    >
      <PageSection title="Danh sách gần đây">
        <Card>
          <p className="text-ui text-body">Đang xem mục: {current?.label}.</p>
        </Card>
      </PageSection>
    </Page>
  );
}
```

## API

### Page

Shared 1.0 page anatomy and layout inside `AppShell`'s content card (#149, #71):
- `layout="work"` (default): flush, no centred max-width, card padding 16 / 24 (`px-4 sm:px-6`).
- `layout="reading"`: centred at max 1536px (`max-w-screen-2xl`) inside 16px card padding, 64px bottom padding.
- `layout="two-column"`: 240px (`md:w-60`) sub-nav card + 4px gap + main card (padding 24); stacks below `md`.

Owns the vertical rhythm from the card top (32px to the header block, 28px from title or tabs to intro / toolbar,
16px from filter toolbar to list, 32px between content blocks), so pages set no margins on those joins.

| Prop | Type | Default | Description |
|---|---|---|---|
| `layout` | `'work' \| 'reading' \| 'two-column'` | `"work"` | Page layout inside the content card: `"work"` (flush, 16 / 24), `"reading"` (centred max 1536px inside 16px card padding, 64px bottom), or `"two-column"` (240px sub-nav card + 4px gap + main card). |
| `fixed` | `boolean` | `false` | Fixed-height page: fills the content column without scrolling the card so inner panels (`ListReaderLayout`, a pinned list) scroll independently. Works inside `<AppShell page="fixed">` or a shared `<AppShell>`. |
| `enter` | `string \| boolean` | `false` | Run `motion-enter` + `motion-stagger` on the page's top blocks and first ~10 rows / cards once per route (`PageEnter`). Pass `true` to key by pathname, or a string for a custom route key. Adds no layout box. |
| `subNav` | `React.ReactNode` |  | Sub-navigation card for `layout="two-column"` (`<SubNav sections={…} activeId={…} />`). With a `ListReaderLayout` in the page, it turns into a sheet trigger at the top of the main card while list + reader + SubNav do not fit (956 / 1020 / 1068px of page for `listWidth` sm / md / lg, #196). |
| `title` | `React.ReactNode` |  | Page heading: a string / node rendered via `PageTitle` (18/400 UI sans by default), or leave out when `tabs` is big `TextTabs`. |
| `titleVariant` | `'work' \| 'reading'` | `"work"` | On a `"reading"` page, `"reading"` opts into the 44 / 500 display title (`text-title-xl`). Ignored on other layouts. |
| `actions` | `React.ReactNode` |  | Actions at the right end of the title row (one `inverse` or `primary` action, optional `•••` `Menu` / `RefreshButton`). |
| `tabs` | `React.ReactNode` |  | Optional tab bar (`PillTabs`, `Tabs`, `SegmentedControl`, `TextTabs`). |
| `intro` | `React.ReactNode` |  | Optional lead intro under the title or tabs (28px below). |
| `toolbar` | `React.ReactNode` |  | Optional sticky toolbar / filter row (`StickyContextBar`, `SubpageToolbar`); content sits 16px below it. |
| `children` * | `React.ReactNode` |  | Page blocks (spaced 32px apart; in `fixed` mode, fills the remaining height). |
| `footer` | `React.ReactNode` |  | Optional page footer (`Pagination`, `FormActions`). |
| `className` | `string` |  |  |

### PageEnter

Runs `motion-enter` + `motion-stagger` (first ~10 rows / cards) once per route without adding a layout box
(`display: contents`). Wrap `{children}` inside `AppShell` (or pass `enter` on `<Page>`) so the shell stays still
and only page content rises in on route changes. Filter, search, sort and `?tab=` changes never replay it, and rows
arriving after `windowMs` do not animate. Under `prefers-reduced-motion: reduce`, entrance is opacity only.

| Prop | Type | Default | Description |
|---|---|---|---|
| `routeKey` | `string` |  | Key that triggers a new entrance when it changes. Defaults to `usePathname()` (ignores query string changes). |
| `disabled` | `boolean` | `false` | Disable the enter animation completely. |
| `windowMs` | `number` | `DEFAULT_ENTER_WINDOW_MS` | Milliseconds after route mount before the enter window closes so late-arriving rows do not animate. |
| `children` * | `React.ReactNode` |  |  |

### SubNav

The 240px sub-navigation card of a `two-column` page (`Page layout="two-column" subNav={<SubNav … />}`):
padding 20 / 10, sections separated by a 1px `bg-raised` line, group labels in `text-nav-label` (10 / 500 uppercase
faint, row h32, optional 16px icon actions on the right), and items (h32, `rounded-control`, padding 4 / 16,
`text-chrome` 12 / 500, 16px icon, 2px apart; inactive `text-muted`, hover `bg-item-hover`, active
`bg-item-selected text-strong`).

| Prop | Type | Default | Description |
|---|---|---|---|
| `sections` * | `SubNavSection[]` |  |  |
| `activeId` * | `string` |  |  |
| `onSelect` | `(id: string) => void` |  |  |
| `label` | `string` |  | Accessible name of the sub-nav landmark (default locale `subNav`). |
| `className` | `string` |  |  |

### PageSection

One content section inside `<Page>`: a 20 / 500 heading (`text-section`) spaced 16px (`gap-4`) above its content,
with optional actions on the heading row. Multiple `PageSection`s inside `<Page>` sit 32px apart automatically.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` |  |  |
| `editorial` | `boolean` | `false` | Use `font-display` on the 20px section heading (discovery / editorial reading pages only). |
| `actions` | `React.ReactNode` |  | Optional quiet control or link on the right of the heading row. |
| `description` | `React.ReactNode` |  | Optional short muted line under the heading. |
| `headingLevel` | `2 \| 3` | `2` |  |
| `children` * | `React.ReactNode` |  |  |
| `className` | `string` |  |  |

### PageGrid

Compact 8px (`gap-2`) grid inside a `<PageSection>` or `<Card>`, sized by `@container` width (§4a rhythm).

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `2 \| 3 \| 4` | `3` |  |
| `children` * | `React.ReactNode` |  |  |
| `className` | `string` |  |  |

## Accessibility

- Page renders one h1 via PageTitle, groups its header in <header>, and SubNav is an <aside> landmark with <nav> lists and aria-current on the active item.
- SubNav icon actions carry aria-label, Tooltip, HIT_AREA and FOCUS_RING.

## Notes

- Inside AppShell, a direct-child Page automatically overrides the default 1440px container and switches two-column / fixed modes in CSS without remounting AppShell (also works when wrapped in PageEnter).
- Wrap AppShell children in PageEnter (or pass enter on Page) to run motion-enter + motion-stagger on top blocks and the first ~10 rows / cards once per route. PageEnter renders display: contents so fixed-height chains and inner scrollers keep working; filter, search, sort and ?tab= changes never replay it.
- Vertical rhythm from the card top: 32px to the header block, 28px title/tabs to intro or toolbar, 16px toolbar to list, 32px between blocks, 16px heading to content (PageSection), 8px inside grids (PageGrid).
- two-column + ListReaderLayout (#196): where list + reader + SubNav do not fit (page narrower than 956 / 1020 / 1068px for listWidth sm / md / lg), the SubNav card hides and a trigger naming the active item opens it in a left Drawer; at 1024 with the rail, list and reader then sit side by side. Only a <SubNav> element collapses; pages without a ListReaderLayout keep the card.

<!-- GENERATED by scripts/build-docs.mjs from examples/page/ and the types in src/ -->
