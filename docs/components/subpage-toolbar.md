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

### Typed filters and secondary actions (phone layout)

```tsx
"use client";

import { useState } from "react";
import { SubpageToolbar, toast, type FilterDef } from "@semi/ui";

const SPECS: Omit<FilterDef, "selected">[] = [
  { key: "group", label: "Nhóm", options: [{ value: "retail", label: "Bán lẻ" }, { value: "wholesale", label: "Bán sỉ" }] },
  { key: "region", label: "Khu vực", options: [{ value: "hn", label: "Hà Nội" }, { value: "hcm", label: "TP.HCM" }, { value: "dn", label: "Đà Nẵng" }] },
  { key: "owner", label: "Phụ trách", options: [{ value: "ha", label: "Thu Hà" }, { value: "nam", label: "Hoàng Nam" }] },
  { key: "debt", label: "Còn nợ", kind: "switch" },
];

export default function SubpageToolbarPhone() {
  const [sel, setSel] = useState<Record<string, string[]>>({ region: ["hn"] });
  const [q, setQ] = useState("");
  return (
    <SubpageToolbar
      title="Khách hàng"
      filters={{
        filters: SPECS.map((s) => ({ ...s, selected: sel[s.key] ?? [] })),
        onChange: (key, selected) => setSel({ ...sel, [key]: selected }),
        onClear: () => setSel({}),
        resultCount: 42,
      }}
      secondaryActions={[
        { label: "Nhập tệp", icon: "upload", onSelect: () => toast({ title: "Nhập tệp" }) },
        { label: "Xuất Excel", icon: "download", onSelect: () => toast({ title: "Xuất Excel" }) },
      ]}
      searchValue={q}
      onSearchChange={setQ}
      searchPlaceholder="Tìm khách hàng…"
      onPrimaryAction={() => toast({ title: "Thêm khách hàng" })}
      primaryActionLabel="Thêm khách hàng"
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
| `filters` | `ToolbarFilters` |  | Typed filters (C-026): up to two show as chips; with more, and always below `sm`, a "Bộ lọc · N" button opens a FilterPanel and the active ones show as chips beside it. Use instead of hand-made chips in `left`. |
| `collapseFilters` | `boolean` | `false` | Below `sm`, move `left` into a bottom sheet opened by a "Bộ lọc" button (above `sm` it renders as before). |
| `filterCount` | `number` |  | Active filters in `left`, shown on that button ("Bộ lọc · 2") when `collapseFilters` is set. |
| `secondaryActions` | `MenuItem[]` |  | Text actions that are not the primary one: buttons from `sm`, a ⋯ menu below it (the primary stays visible). |
| `className` | `string` | `""` |  |

### RefreshButton

| Prop | Type | Default | Description |
|---|---|---|---|
| `onRefresh` * | `() => unknown` |  |  |
| `className` | `string` | `""` |  |
| `label` | `string` |  |  |

## Accessibility

- The primary action is icon-only, so primaryActionLabel is required (aria-label + title).
- The Bộ lọc button says the active count (“Bộ lọc · 2”) and opens a modal FilterPanel (or a bottom Drawer for collapseFilters): focus trap, Escape, focus back to the button; the ⋯ menu is named “Thao tác khác”.

## Notes

- Two layouts, both valid: PageTitle + SubpageToolbar (title on its own row), or SubpageToolbar with title (one row). Pick one per page, never both.
- With title, a string becomes the page h1 in PageTitle type; a PageTabsTitle works too. Narrow screens wrap the filters and actions below the title.
- Text buttons belong in right (secondary actions); the title itself stays text only and the primary action stays icon-only.
- Phone layout (#57): with filters (typed, FilterDef[]) or collapseFilters (for left), below sm the toolbar is two rows at most: the title, then Bộ lọc · N, ⋯ (secondaryActions), the primary, the search. Above sm it is the row it always was; more than two typed filters collapse into Bộ lọc with the active ones as chips beside it (C-026).

<!-- GENERATED by scripts/build-docs.mjs from examples/subpage-toolbar/ and the types in src/ -->
