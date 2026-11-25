# Search pill

The wide pill search of a list page (one per page), with an optional `trailing` slot for `<BarActions>` when pinned in StickyContextBar. Typing is debounced (250 ms), Escape and the clear button clear at once, an optional key (/) focuses it. ResultLine is deprecated for 1.0 list pages (use FilterChipRow / PhoneFilterBar `sort` and `selection` instead).

## When to use

- The search of a list, grid or DataTable page, above its filter chips (inside StickyContextBar).
- Showing how many rows match and how they are sorted, right above the rows.

## Use something else when

| Need | Use |
|---|---|
| A search among the toolbar's icon buttons (a small page, few rows) | SubpageToolbar onSearchChange (SearchInput) |
| Jump to any page or action from anywhere | Command |
| A search field inside a form or a popover | Input with a search icon (InputGroup) |

## Import

```tsx
import { SearchPill, ResultLine } from "@semi/ui";
```

## Examples

### Search

```tsx
"use client";

import { useState } from "react";
import { SearchPill } from "@semi/ui";

export default function SearchPillDefault() {
  const [q, setQ] = useState("");
  return (
    <div className="flex flex-col gap-2 w-full">
      <SearchPill value={q} onChange={setQ} label="Tìm khách hàng" placeholder="Tìm khách, quốc gia, mặt hàng…" focusKey="/" />
      <p className="text-ui text-muted">
        Đang tìm: <span className="text-strong">{q || "—"}</span> (gõ xong 250 ms mới gửi; Esc để xoá; phím / để vào ô tìm)
      </p>
    </div>
  );
}
```

### With the result line and sort

```tsx
"use client";

import { useState } from "react";
import { ResultLine, SearchPill } from "@semi/ui";

const SORTS = [
  { value: "recent", label: "Mới thêm" },
  { value: "volume", label: "Sản lượng năm" },
  { value: "name", label: "Tên A–Z" },
];

export default function SearchPillResultLine() {
  const [q, setQ] = useState("tiêu đen");
  const [sort, setSort] = useState("recent");
  return (
    <div className="flex flex-col gap-2 w-full">
      <SearchPill value={q} onChange={setQ} label="Tìm khách hàng" shortcut="⌘K" />
      <ResultLine query={q} count={q ? 128 : 1240} unit="khách hàng" sort={{ value: sort, onChange: setSort, options: SORTS }} />
    </div>
  );
}
```

## API

### SearchPill

The wide pill search of a list page: one per page, it feeds the list (or DataTable). Typing calls `onChange` after
`debounce` ms; the clear button and Escape clear at once. A history push of useFilterParams / useDetailParam /
openDetail during the debounce sends the pending text first, so the query stays on the entry it was typed on. `focusKey` ("/") focuses it from anywhere on the page
(not while typing in another field).

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` * | `string` |  |  |
| `onChange` * | `(value: string) => void` |  | Gets the text after the debounce. For a query in the URL write it at once with `useFilterParams().setParams({ q: v }, "replace")`: a push during the debounce (opening a row, a filter chip) then keeps it on the list's entry. `router.replace`, nuqs or state + an effect land after that push. |
| `label` * | `string` |  | Accessible name ("Tìm khách hàng"); also the placeholder when none is given. |
| `placeholder` | `string` |  |  |
| `debounce` | `number` | `250` | Milliseconds to wait after the last key before `onChange` (0: every key). |
| `focusKey` | `string` |  | A key that focuses the field from anywhere on the page, e.g. "/". Shown as a key cap while the field is empty. |
| `shortcut` | `string` |  | Key cap shown while empty when the app binds the shortcut itself ("⌘K" for a command palette). |
| `trailing` | `React.ReactNode` |  | Extra tools at the right end (pinned `<BarActions />`, image search, voice). |
| `className` | `string` |  |  |

### ResultLine

The line under the search: `“query” · N kết quả` on the left (announced politely when it changes), the sort menu on
the right. Leave out `query` for a plain count.

| Prop | Type | Default | Description |
|---|---|---|---|
| `count` * | `number` |  |  |
| `query` | `string` |  |  |
| `unit` | `string` |  | What is counted ("khách hàng"); default the locale's "kết quả". |
| `sort` | `SortDef` |  |  |
| `trailing` | `React.ReactNode` |  | More tools at the right end, after the sort (a ViewSwitch when there is no chip row). |
| `className` | `string` |  |  |

## Accessibility

- label is required: it names the field (type=search) and is the placeholder when none is given.
- The result line is a polite live region, so the new count is read after typing; the sort trigger says the current choice (“Sắp xếp: Mới thêm”).
- focusKey is ignored while typing in another field and with ⌘ / Ctrl / Alt; the key cap is hidden from screen readers.

## Notes

- Controlled: keep the query in the URL (?q=) so a reload or a shared link keeps it; the field shows a value changed from outside (Back, Xoá lọc).
- One search per page, feeding the list or DataTable (C-021 D5): never a second search in the table header.
- debounce={0} sends every key (a small local list).
- Opening a row (useDetailParam().open, openDetail) or a filter chip inside the debounce sends the pending text first, onto the list's history entry: Back keeps the query, no need for debounce={0}. Text typed before a navigation to another route is dropped. This needs an onChange that writes the URL at once: useFilterParams().setParams({ q: v }, "replace"). router.replace, nuqs or state + an effect still land after the push.

<!-- GENERATED by scripts/build-docs.mjs from examples/search-pill/ and the types in src/ -->
