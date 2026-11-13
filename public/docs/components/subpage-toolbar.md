# Subpage toolbar

The sticky row with a page's filters on the left and search, refresh and the icon-only primary action on the right: under the page title, or with the title on the same row (title). RefreshButton spins while its promise runs.

## When to use

- Every list or grid page.
- A page whose filters and actions fit beside its title (one or two filters, a few actions): pass title and drop the PageTitle, so the content starts higher.

## Use something else when

| Need | Use |
|---|---|
| Actions of a tool app | AppHeader |
| Many filters, or filters that need the full width | PageTitle above, SubpageToolbar on its own row (no title) |

## Import

```tsx
import { SubpageToolbar, RefreshButton } from "@semi/ui";
```

## Examples

### List page

```tsx
"use client";

import { useState } from "react";
import { Pills, SubpageToolbar, toast } from "@semi/ui";

export default function SubpageToolbarListPage() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  return (
    <SubpageToolbar
      left={
        <Pills
          value={status}
          onChange={setStatus}
          options={[
            { key: "all", label: "Tất cả" },
            { key: "printing", label: "Đang in" },
            { key: "idle", label: "Chờ lệnh" },
          ]}
        />
      }
      searchValue={q}
      onSearchChange={setQ}
      searchPlaceholder="Tìm máy in…"
      onRefresh={() => new Promise((r) => setTimeout(r, 800))}
      onPrimaryAction={() => toast({ title: "Thêm máy in" })}
      primaryActionLabel="Thêm máy in"
    />
  );
}
```

### Title on the toolbar row

```tsx
"use client";

import { useState } from "react";
import { Button, CustomSelect, SubpageToolbar, toast } from "@semi/ui";

export default function SubpageToolbarTitleRow() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  return (
    // The title shares the row with the filter and actions; the page has no PageTitle above.
    <SubpageToolbar
      title="Khách hàng"
      left={
        <CustomSelect
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Mọi trạng thái" },
            { value: "new", label: "Mới" },
            { value: "replied", label: "Đã trả lời" },
          ]}
        />
      }
      right={
        <Button icon="upload" onClick={() => toast({ title: "Nhập file" })}>
          Nhập file
        </Button>
      }
      searchValue={q}
      onSearchChange={setQ}
      searchPlaceholder="Tìm khách…"
      onPrimaryAction={() => toast({ title: "Thêm khách" })}
      primaryActionLabel="Thêm khách"
    />
  );
}
```

### RefreshButton

```tsx
import { RefreshButton } from "@semi/ui";

export default function RefreshButtonBasic() {
  return <RefreshButton onRefresh={() => new Promise((r) => setTimeout(r, 1000))} />;
}
```

## API

### SubpageToolbar

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` |  | The page title, on the same row as the filters and actions (the page then has no PageTitle). A string becomes the page's h1 in PageTitle type; pass a PageTabsTitle for sibling views. Leave it out to keep the title on its own row above (PageTitle + SubpageToolbar). On narrow screens the filters and actions wrap below the title. |
| `left` | `React.ReactNode` |  | Filter controls on the left (Pills, Chip, CustomSelect). |
| `right` | `React.ReactNode` |  | Optional extra controls on the right (placed before the primary icon button). |
| `onPrimaryAction` | `() => void` |  | Click handler for the icon-only primary CTA button (e.g. "Thêm"). |
| `primaryActionLabel` | `string` |  | Accessible title & aria-label for the icon-only primary CTA button. |
| `primaryActionIcon` | `IconName` | `"plus"` | Icon for the primary CTA button (default: "plus"). |
| `searchValue` | `string` |  | Search query value (renders a SearchInput when onSearchChange is provided). |
| `onSearchChange` | `(val: string) => void` |  | Search change handler. |
| `searchPlaceholder` | `string` |  | Placeholder for SearchInput. |
| `onRefresh` | `() => unknown` |  | Async or sync reload callback (renders RefreshButton when provided). |
| `className` | `string` | `""` |  |

### RefreshButton

| Prop | Type | Default | Description |
|---|---|---|---|
| `onRefresh` * | `() => unknown` |  |  |
| `className` | `string` | `""` |  |
| `label` | `string` |  |  |

## Accessibility

- The primary action is icon-only, so primaryActionLabel is required (aria-label + title).

## Notes

- Two layouts, both valid: PageTitle + SubpageToolbar (title on its own row), or SubpageToolbar with title (one row). Pick one per page, never both.
- With title, a string becomes the page h1 in PageTitle type; a PageTabsTitle works too. Narrow screens wrap the filters and actions below the title.
- Text buttons belong in right (secondary actions); the title itself stays text only and the primary action stays icon-only.

<!-- GENERATED by scripts/build-docs.mjs from examples/subpage-toolbar/ and the types in src/ -->
