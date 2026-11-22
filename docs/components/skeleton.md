# Skeleton

Shimmer placeholders while content loads, shaped like what loads: Skeleton blocks, SkeletonCard, SkeletonGrid, SkeletonRows, SkeletonList (divided list rows), SkeletonTable (table rows), SkeletonDetail (a record's detail panel), PageSkeleton; Loading announces the region. Never “Đang tải…” text or a spinner in a list. BootLoader is the one centred spinner, for the boot / session gate before the shell exists.

## When to use

- Any content that is loading: show its shape.
- Lists, tables and detail panels: SkeletonList, SkeletonTable, SkeletonDetail (DataTable shows table-shaped rows by itself while loading).
- BootLoader: before the app knows its layout (session, auth, boot), once in the root or route-group layout.

## Use something else when

| Need | Use |
|---|---|
| An action in progress | Button loading or Spinner |
| A known amount of work | Progress |
| Loading inside the shell (a page, a tab, a list) | Skeleton* or a route loading.tsx with PageSkeleton, never BootLoader |

## Import

```tsx
import { Skeleton, SkeletonCard, SkeletonGrid, SkeletonRows, SkeletonList, SkeletonTable, SkeletonDetail, PageSkeleton, Loading, BootLoader } from "@semi/ui";
```

## Examples

### Card and rows

```tsx
import { SkeletonCard, SkeletonRows } from "@semi/ui";

export default function SkeletonCardRows() {
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <SkeletonCard />
      <SkeletonRows count={3} />
    </div>
  );
}
```

### Page and grid

```tsx
"use client";

import { useState } from "react";
import { Button, Loading, PageSkeleton, SkeletonGrid } from "@semi/ui";

export default function SkeletonPage() {
  const [shape, setShape] = useState<"grid" | "page">("grid");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant={shape === "grid" ? "primary" : "secondary"} onClick={() => setShape("grid")}>
          SkeletonGrid
        </Button>
        <Button size="sm" variant={shape === "page" ? "primary" : "secondary"} onClick={() => setShape("page")}>
          PageSkeleton
        </Button>
      </div>
      {shape === "grid" ? (
        <SkeletonGrid count={3} className="grid grid-cols-1 @2xl:grid-cols-3 gap-3" />
      ) : (
        <Loading>
          <PageSkeleton />
        </Loading>
      )}
    </div>
  );
}
```

### List, table and detail

Shaped like what loads: avatar rows, a table with a number column, a record with its side panel.

```tsx
import { SkeletonDetail, SkeletonList, SkeletonTable } from "@semi/ui";

// Shaped like what loads: list rows, table rows, a record's detail. No spinners in lists (L16).
export default function SkeletonShaped() {
  return (
    <div className="flex flex-col gap-section">
      <div className="rounded-card bg-card">
        <SkeletonList rows={4} columns={2} label="Đang tải hộp thư" />
      </div>
      <SkeletonTable rows={4} columns={5} numeric={[4]} label="Đang tải đơn hàng" />
      <SkeletonDetail fields={4} side label="Đang tải nhà cung cấp" />
    </div>
  );
}
```

### Shape of a list page

A toolbar row and rows: match what the real page shows. PageSkeleton shape="list" does the same for a whole page.

```tsx
import { Skeleton, SkeletonRows } from "@semi/ui";

// The shape of a records page: a toolbar row, then rows. Use it as a Suspense fallback or inside loading.tsx.
export default function SkeletonListShape() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 flex-1 sm:max-w-xs" />
        <Skeleton className="h-9 w-20" />
      </div>
      <SkeletonRows count={4} label="Đang tải đơn hàng" />
    </div>
  );
}
```

### Page shapes (in the shell)

cards, list and detail with inShell: what a route loading.tsx renders.

```tsx
import { PageSkeleton } from "@semi/ui";

// The three page shapes of a route loading.tsx (`inShell`: no full-page height or padding).
export default function SkeletonShapes() {
  return (
    <div className="flex flex-col gap-6">
      {(["cards", "list", "detail"] as const).map((shape) => (
        <div key={shape} data-shape={shape} className="max-h-56 overflow-hidden">
          <PageSkeleton shape={shape} inShell />
        </div>
      ))}
    </div>
  );
}
```

## API

### Skeleton

One shimmering block; size and radius come from className (default rounded-control).

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | `""` |  |
| `style` | `CSSProperties` |  |  |

### SkeletonCard

Card placeholder: icon tile + two text lines, then an optional body block.

| Prop | Type | Default | Description |
|---|---|---|---|
| `body` | `null \| string` | `"h-24"` |  |
| `className` | `string` | `""` |  |

### SkeletonGrid

Grid of card placeholders (the grid classes should match the real grid).

| Prop | Type | Default | Description |
|---|---|---|---|
| `count` | `number` | `6` |  |
| `className` | `string` | `"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"` |  |
| `body` | `null \| string` | `"h-24"` |  |
| `label` | `string` |  |  |

### SkeletonRows

List row placeholders (dialog lists, tables).

| Prop | Type | Default | Description |
|---|---|---|---|
| `count` | `number` | `5` |  |
| `className` | `string` | `"flex flex-col gap-2"` |  |
| `label` | `string` |  |  |

### SkeletonList

Rows of a divided list (an `ItemGroup`, an inbox, a people list): optional avatar, a title and a meta line, then
`columns` short values on the right (from `md` after the first). Matches `Item` rows (`px-4 py-3`).

| Prop | Type | Default | Description |
|---|---|---|---|
| `rows` | `number` | `6` |  |
| `columns` | `number` | `1` | Short values on the right of each row (a date, a status). |
| `avatar` | `boolean` | `true` | A round avatar / icon at the start of each row. |
| `className` | `string` |  |  |
| `label` | `string` |  |  |

### SkeletonTable

Table-shaped placeholder for a hand-made `Table` (DataTable shows the same shape by itself while `loading`): a
header row and `rows` rows of `columns` cells, the first column wider, `numeric` columns right-aligned.

| Prop | Type | Default | Description |
|---|---|---|---|
| `rows` | `number` | `5` |  |
| `columns` | `number` | `4` |  |
| `numeric` | `number[]` | `[]` | Indexes of number columns (short, right-aligned). |
| `className` | `string` |  |  |
| `label` | `string` |  |  |

### SkeletonDetail

A record's detail panel (a `DetailOverlay`, a side panel, a detail page): title and status, a row of actions, then
`fields` label / value pairs and a text block. `side` adds the facts column beside it from `lg`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `fields` | `number` | `6` |  |
| `side` | `boolean` | `false` | A second column of facts from `lg` (the overlay's side panel). |
| `className` | `string` |  |  |
| `label` | `string` |  |  |

### PageSkeleton

Whole-page placeholder (Suspense fallbacks, route `loading.tsx`): title row + the shape of the content.
`cards` (default) = a grid of cards, `list` = a toolbar and table rows, `detail` = a header card and two panels.
Pick the shape the real page has, so nothing jumps when the data arrives (§13b).
`inShell` drops the full-viewport height, background and padding: use it in a route `loading.tsx` (the shell and its
content slot already give those). Without it the skeleton is a whole page, for a Suspense fallback outside the shell.

| Prop | Type | Default | Description |
|---|---|---|---|
| `shape` | `'list' \| 'cards' \| 'detail'` | `"cards"` |  |
| `inShell` | `boolean` | `false` |  |

### Loading

Wrapper that tells assistive tech the region is loading. `relative` keeps the absolute sr-only label inside scroll containers.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` * | `React.ReactNode` |  |  |
| `className` | `string` | `""` |  |
| `label` | `string` |  |  |

### BootLoader

Boot / session gate before the app knows its layout (login or shell), the one place a centred spinner is allowed
(§13b). Render it once in the root or route-group layout, never inside AppShell content (`boot-loader-place`).
Prefer a server-side session check (proxy / async layout), which needs no gate at all.

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` |  | Screen-reader text (never shown). Defaults to the locale's "opening the app". |
| `delay` | `number` | `300` | Milliseconds before the spinner appears, so a fast check shows only the background. |
| `className` | `string` | `""` |  |

## Accessibility

- Loading (and every Skeleton* group) sets role="status" + aria-busy on the container with one screen-reader label; the blocks themselves are aria-hidden.
- BootLoader is a role="status" region whose label (default: the locale's booting string) is for screen readers only.

## Notes

- BootLoader waits `delay` (300 ms) before the spinner shows, so a fast check flashes nothing; the spin stops under prefers-reduced-motion. Prefer a server-side session check, which needs no gate (see the App shell doc, "Session gate in the layout").
- PageSkeleton takes shape="cards" (default), "list" or "detail": pick the one the real page has so nothing jumps when the data arrives.

<!-- GENERATED by scripts/build-docs.mjs from examples/skeleton/ and the types in src/ -->
