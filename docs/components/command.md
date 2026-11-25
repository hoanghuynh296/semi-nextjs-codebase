# Command

Command palette and searchable action lists: CommandPalette is the app-wide ⌘K / Ctrl+K “search or create” box (mounted once in the root layout, fed by pages with useRegisterCommands); CommandDialog is a controlled dialog with your own open state (useHotkey); Command is the inline list. Matching ignores case and Vietnamese marks.

## When to use

- Every app with more than a few pages: mount CommandPalette once in the root layout to jump to a place or record and start a create action from anywhere on ⌘K (L1).
- A SearchPill or “Tìm hoặc tạo” button in the header that opens CommandPalette (openCommandPalette).
- A palette with your own open state and no app-wide registry (CommandDialog) or a searchable action list inside a Popover (Command).

## Use something else when

| Need | Use |
|---|---|
| Pick one value in a form | CustomCombobox |
| Filter the list on the page | SearchPill or SearchInput |

## Import

```tsx
import { Command, CommandDialog, CommandPalette, useRegisterCommands, openCommandPalette, useHotkey, filterCommands, normalizeSearch, type CommandItem } from "@semi/ui";
```

## Examples

### App-wide palette (CommandPalette)

Press ⌘K (Ctrl+K) or the button; type “tieu” to find the supplier by keyword.

```tsx
"use client";

import { useMemo } from "react";
import { Button, CommandPalette, Kbd, openCommandPalette, toast, useRegisterCommands, type CommandItem } from "@semi/ui";

// Mount CommandPalette once in the root layout with the app's places. A page adds its own quick actions and records
// with useRegisterCommands while it is mounted. ⌘↵ opens an item with href in a new tab.
const PLACES: CommandItem[] = [
  { id: "inbox", label: "Hộp thư", group: "Trang", icon: "mail", href: "#inbox", onSelect: () => toast({ title: "Mở Hộp thư" }) },
  { id: "suppliers", label: "Nhà cung cấp", group: "Trang", icon: "store", href: "#suppliers", onSelect: () => toast({ title: "Mở Nhà cung cấp" }) },
  { id: "settings", label: "Cài đặt", group: "Trang", icon: "settings", onSelect: () => toast({ title: "Mở Cài đặt" }) },
];

export default function CommandPaletteApp() {
  const pageItems = useMemo<CommandItem[]>(
    () => [
      { id: "new-supplier", label: "Thêm nhà cung cấp", group: "Tạo nhanh", icon: "plus", tone: "blue", shortcut: ["⌘", "N"], onSelect: () => toast({ title: "Thêm nhà cung cấp" }) },
      { id: "new-request", label: "Tạo yêu cầu mua", group: "Tạo nhanh", icon: "clipboardList", tone: "green", onSelect: () => toast({ title: "Tạo yêu cầu mua" }) },
      { id: "s1", label: "Gia vị Tây Nguyên", hint: "Nhà cung cấp · Đắk Lắk", group: "Nhà cung cấp", icon: "store", keywords: ["tieu", "pepper"], href: "#suppliers?open=s1", onSelect: () => toast({ title: "Mở Gia vị Tây Nguyên" }) },
    ],
    [],
  );
  useRegisterCommands(pageItems);
  return (
    <>
      <Button icon="search" onClick={() => openCommandPalette()}>
        Tìm hoặc tạo <Kbd keys={["⌘", "K"]} />
      </Button>
      <CommandPalette items={PLACES} />
    </>
  );
}
```

### Controlled dialog (CommandDialog)

Press ⌘J (Ctrl+J) or the button; try typing “don hang” without marks.

```tsx
"use client";

import { useState } from "react";
import { Button, CommandDialog, Kbd, toast, useHotkey, type CommandItem } from "@semi/ui";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  useHotkey(() => setOpen((v) => !v), "j");
  const go = (title: string) => () => toast({ title });
  const items: CommandItem[] = [
    { id: "orders", label: "Đơn hàng", group: "Trang", icon: "bag", onSelect: go("Mở Đơn hàng") },
    { id: "printers", label: "Máy in", group: "Trang", icon: "printer", keywords: ["printer"], onSelect: go("Mở Máy in") },
    { id: "inventory", label: "Kho vật liệu", group: "Trang", icon: "box", onSelect: go("Mở Kho") },
    { id: "new-order", label: "Tạo đơn hàng", group: "Thao tác", icon: "plus", shortcut: ["⌘", "N"], onSelect: go("Tạo đơn") },
    { id: "theme", label: "Đổi giao diện sáng / tối", group: "Thao tác", icon: "moon", onSelect: go("Đổi giao diện") },
  ];
  return (
    <>
      <Button icon="search" onClick={() => setOpen(true)}>
        Tìm nhanh <Kbd keys={["⌘", "J"]} />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}
```

### Inline (Command)

```tsx
"use client";

import { Command, toast } from "@semi/ui";

export default function CommandInline() {
  return (
    <div className="h-72 max-w-md rounded-card border border-line bg-panel overflow-hidden">
      <Command
        items={[
          { id: "pla", label: "PLA đen", group: "Vật liệu", icon: "box", onSelect: () => toast({ title: "PLA đen" }) },
          { id: "petg", label: "PETG trong", group: "Vật liệu", icon: "box", onSelect: () => toast({ title: "PETG trong" }) },
          { id: "x1", label: "X1 Carbon 03", group: "Máy in", icon: "printer", onSelect: () => toast({ title: "X1 Carbon 03" }) },
          { id: "a1", label: "A1 Mini 01", group: "Máy in", icon: "printer", disabled: true, onSelect: () => undefined },
        ]}
        placeholder="Tìm vật liệu, máy in…"
      />
    </div>
  );
}
```

## API

### Command

The searchable list itself (inside a page, a Popover or CommandDialog). The input is an ARIA combobox that owns a
listbox; the active option follows aria-activedescendant so focus never leaves the input.

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` * | `CommandItem[]` |  |  |
| `placeholder` | `string` |  |  |
| `emptyText` | `React.ReactNode \| ((query: string) => React.ReactNode)` |  | Shown when nothing matches (default from the locale); a function gets the query. |
| `onEscape` | `() => void` |  | Escape on an empty query (CommandDialog closes). |
| `autoFocus` | `boolean` | `false` |  |
| `className` | `string` |  |  |
| `size` | `'md' \| 'lg'` | `"md"` | `lg`: taller rows with an icon tile and the hint line, `text-overline` group headings (CommandPalette). |
| `initialQuery` | `string` | `""` | The query when the list mounts. |
| `label` | `string` |  | Accessible name of the listbox (default from the locale). |
| `inputEnd` | `React.ReactNode` |  | Shown at the end of the input row (an Esc key cap). |
| `footer` | `React.ReactNode` |  | Shown under the list (a key legend). |
| `onOpenInNewTab` | `(item: CommandItem) => void` |  | ⌘↵ / Ctrl+↵ on an item with `href` (default: open `href` in a new tab). |

### CommandDialog

The command palette over the page: a modal dialog near the top, closed by Escape, a click outside or a pick.

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` * | `boolean` |  |  |
| `onOpenChange` * | `(open: boolean) => void` |  |  |
| `items` * | `CommandItem[]` |  |  |
| `placeholder` | `string` |  |  |
| `emptyText` | `React.ReactNode` |  |  |

### CommandPalette

The app-wide "search or create" box (L1): one dialog for search and quick actions, opened with ⌘K / Ctrl+K. Mount
it once in the root layout with the app's places; pages add their own items with useRegisterCommands. Groups get
`text-overline` headings, actions a coloured tile (`tone`), records a hint line; the footer shows the keys
(↑↓ select, ↵ open, ⌘↵ new tab for items with `href`, Esc close). Uncontrolled unless `open` is given.

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `CommandItem[]` | `EMPTY` | The app's own items (places, global actions). Items registered by pages are listed first. |
| `open` | `boolean` |  | Controlled open state; leave out to let the palette (⌘K, openCommandPalette) manage it. |
| `onOpenChange` | `(open: boolean) => void` |  |  |
| `hotkey` | `string \| false` | `"k"` | ⌘ / Ctrl + this key toggles the palette; `false` binds nothing. |
| `placeholder` | `string` |  |  |
| `emptyText` | `React.ReactNode \| ((query: string) => React.ReactNode)` |  |  |
| `initialQuery` | `string` |  | The query when it opens (a `?q=` deep link). |
| `onOpenInNewTab` | `(item: CommandItem) => void` |  |  |

## Accessibility

- The input is an ARIA combobox owning a listbox (aria-activedescendant), so focus stays in the input; groups are labelled by their heading, disabled items are aria-disabled; dialogs trap focus, Escape closes and focus returns.

## Notes

- A record that opens in a DetailOverlay on the current route: its `onSelect` calls `openDetail(id)` (or the page's `open(id)`), not `router.push("?open=…")` to the same route, which browsers without the Navigation API do not report to the list. Give it `href` too, for ⌘↵.
- ⌘K on Apple devices, Ctrl+K elsewhere (Ctrl+K on a Mac deletes to the end of the line in text fields); a key a widget already handled, or typed in a rich-text editor, does not open it.

<!-- GENERATED by scripts/build-docs.mjs from examples/command/ and the types in src/ -->
