# Sticky context bar

The top of a list page that pins on scroll or search focus (250ms ease-out), holds against trackpad momentum and flings, and moves up to 2 page actions into SearchPill via BarActions while pinned. Pins by layout from md+ with independent overscroll-contained list/reader scrollers; keeps native touch scrolling below md.

## When to use

- A list, grid or table page with a search and filters people change while they scroll (customers, suppliers, products).
- In place of a SubpageToolbar when the page needs the wide search and the chip row.

## Use something else when

| Need | Use |
|---|---|
| A page with one or two filters and a few actions | SubpageToolbar |
| The page's create action and refresh | PageTitle actions, above this bar |
| Actions of one record | MinimalHeader or PageActions |

## Import

```tsx
import { StickyContextBar, BarActions } from "@semi/ui";
```

## Examples

### Suppliers list

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  Button,
  FilterChipRow,
  FilterPanel,
  Item,
  PageTitle,
  PhoneFilterBar,
  SearchPill,
  StickyContextBar,
  ViewSwitch,
  toast,
  type FilterDef,
  type ViewMode,
} from "@semi/ui";

const SUPPLIERS = [
  { name: "Hợp tác xã Tiêu Chư Sê", region: "highlands", item: "pepper", certified: true },
  { name: "Công ty Quế Văn Yên", region: "north", item: "cinnamon", certified: true },
  { name: "Hồi Lạng Sơn Xanh", region: "north", item: "anise", certified: false },
  { name: "Nông trại Tiêu Phú Quốc", region: "south", item: "pepper", certified: false },
  { name: "Gia vị Bình Phước", region: "south", item: "pepper", certified: true },
  { name: "Quế Trà My", region: "central", item: "cinnamon", certified: false },
];
const SPECS: Omit<FilterDef, "selected">[] = [
  { key: "item", label: "Mặt hàng", icon: "box", options: [{ value: "pepper", label: "Tiêu" }, { value: "cinnamon", label: "Quế" }, { value: "anise", label: "Hồi" }] },
  { key: "region", label: "Vùng", icon: "mapPin", options: [{ value: "north", label: "Miền Bắc" }, { value: "central", label: "Miền Trung" }, { value: "highlands", label: "Tây Nguyên" }, { value: "south", label: "Miền Nam" }] },
  { key: "certified", label: "Có chứng nhận", icon: "badgeCheck", kind: "switch" },
];
const SORTS = [
  { value: "name", label: "Tên A–Z" },
  { value: "recent", label: "Mới thêm" },
];

export default function StickyContextBarListPage() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<ViewMode>("list");
  const [panel, setPanel] = useState(false);
  const filters: FilterDef[] = SPECS.map((s) => ({ ...s, selected: sel[s.key] ?? [] }));
  const onChange = (key: string, selected: string[]) => setSel({ ...sel, [key]: selected });
  const rows = useMemo(() => {
    const r = SUPPLIERS.filter(
      (s) =>
        s.name.toLocaleLowerCase("vi").includes(q.toLocaleLowerCase("vi")) &&
        (!sel.item?.length || sel.item.includes(s.item)) &&
        (!sel.region?.length || sel.region.includes(s.region)) &&
        (!sel.certified?.length || s.certified),
    );
    return sort === "name" ? [...r].sort((a, b) => a.name.localeCompare(b.name, "vi")) : r;
  }, [q, sel, sort]);
  const sortDef = { value: sort, onChange: setSort, options: SORTS };
  const active = filters.filter((f) => f.selected.length > 0).length;
  return (
    // the scrolling content panel of the page: STICKY_TOOLBAR bleeds into its side padding (px-4 sm:px-6, as AppShell's)
    <div className="w-full min-w-0 h-96 overflow-y-auto overscroll-contain rounded-card bg-panel px-4 sm:px-6 pt-2.5 pb-4">
      {/* the title row scrolls away with the page's action; the bar under it stays */}
      <PageTitle
        title="Nhà cung cấp"
        actions={
          <Button variant="inverse" icon="plus" onClick={() => toast({ title: "Thêm nhà cung cấp" })}>
            Thêm nhà cung cấp
          </Button>
        }
      />
      <StickyContextBar label="Tìm và lọc nhà cung cấp">
        <SearchPill value={q} onChange={setQ} label="Tìm nhà cung cấp" placeholder="Tìm tên nhà cung cấp…" focusKey="/" />
        <FilterChipRow
          className="max-md:hidden"
          filters={filters}
          onChange={onChange}
          onClear={() => setSel({})}
          sort={sortDef}
          trailing={<ViewSwitch view={view} onViewChange={setView} />}
        />
        <PhoneFilterBar className="md:hidden" activeCount={active} onOpenFilters={() => setPanel(true)} filtersOpen={panel} sort={sortDef} />
      </StickyContextBar>
      <ul className={view === "grid" ? "grid grid-cols-2 gap-group" : "flex flex-col"}>
        {rows.map((s) => (
          <li key={s.name}>
            <Item title={s.name} description={`${SPECS[0].options?.find((o) => o.value === s.item)?.label} · ${SPECS[1].options?.find((o) => o.value === s.region)?.label}`} />
          </li>
        ))}
      </ul>
      <FilterPanel open={panel} onClose={() => setPanel(false)} filters={filters} onChange={onChange} onClear={() => setSel({})} sort={sortDef} resultCount={rows.length} />
    </div>
  );
}
```

## API

### StickyContextBar

The search and filter bar of a list page, pinned to the top of the scrolling content while the rows scroll under it.

Pin behaviour (#150):
- Pins when the scroller scrolls past the bar, or when the search text field gets focus (250ms ease-out, instant
  under reduced motion, cancelled by wheel/touch; works on short lists too; chips/sort/view buttons do not pin).
- From `md` (768px), pins by layout: the scroller's exact scroll range equals `--sticky-pin` and the list area (or
  each `ListReaderLayout` panel) scrolls independently with `overscroll-behavior: contain`. Only a new upward wheel
  gesture starting at the list top unpins; momentum and flings never unpin. Below `md`, keeps native touch scrolling.
- Exposes `data-stuck` and `data-searching` on the bar and `--sticky-pin` / `--sticky-view` on the scroller, clearing
  them on unmount. The pin and `data-stuck` are measured from the scroller's padding edge (where sticky children stick).
- Never writes `scrollTop` while the browser scrolls natively (#193): holds are decided on the first wheel event of a
  gesture. Without layout-pin (below `md`, or a scroller outside `AppShell`), an upward gesture starting within one
  screen above the pin is driven by the bar and stops at the pin; from further up it scrolls natively and may pass it.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` * | `React.ReactNode` |  | Usually SearchPill (with optional BarActions in `trailing`), then FilterChipRow (PhoneFilterBar on phones). The list sits 16px under the filter row. |
| `label` | `string` |  | Accessible name of the region ("Tìm và lọc khách hàng"); leave it out when the bar holds only a search. |
| `pin` | `boolean` | `true` | Enable trackpad-proven layout pinning, focus-pin and `data-stuck` / `data-searching` state (default `true`). |
| `className` | `string` |  |  |

### BarActions

Page actions that move inside `SearchPill`'s `trailing` slot while `StickyContextBar` is pinned (`data-stuck`) and
hide while the search field has focus (`data-searching`, 150ms fade, out of the accessibility tree and taking zero
layout space when hidden so the `"/"` shortcut hint never shifts).

Always renders at most **2 slots**, in the title row's order (`[•••][main action]`, 8px apart, last button inset
matching the `"/"` hint): with more than two actions (or any `menu` items), the main action stays on the right and
the rest collapse into `•••` on the left.

| Prop | Type | Default | Description |
|---|---|---|---|
| `actions` * | `BarAction[]` |  | Primary and secondary page actions (in title-row order: secondary left, `primary` last). |
| `menu` | `BarAction[]` |  | Extra overflow items always placed inside the `•••` menu. |
| `moreLabel` | `string` |  | Accessible name and tooltip of the `•••` overflow button (default locale `moreActions`). |
| `className` | `string` |  |  |

## Accessibility

- With label it is a search landmark (role=search) named for the page, so screen-reader users jump to it.
- BarActions hides its icon buttons out of flow and out of the accessibility tree while unpinned or while the search field has focus.

## Notes

- One per page, right under the page heading: PageTitle with `actions` (the page's one `inverse` or `primary` action + `•••` / RefreshButton) or TextTabs. Pass `<BarActions actions={…} menu={…} />` in SearchPill's `trailing` slot so up to 2 icon buttons (`[•••][main action]`) appear inside the pinned search bar when the title row scrolls out of view.
- 1.0 list pages have no result-count row: the list sits 16px under the filter row, and `sort` + `selection` ("Chọn", managed with `useListSelection`) live on FilterChipRow / PhoneFilterBar.
- Desktop and iPad show FilterChipRow (max-md:hidden on the phone bar's sibling), phones PhoneFilterBar (md:hidden): same filters, same state.
- The page's views (Đang mở · Đã đóng · Tất cả) are `SegmentedControl` in FilterChipRow `leading` on md+ and PhoneFilterBar `typeItems` (radio items) on phones: same state, usually a plain param (?view=) written with useFilterParams().setParams. The default view may be other than “all”; leave it out of the URL.
- Phone chrome: at most 2 rows (search + PhoneFilterBar), under 25% of the viewport (P1).

<!-- GENERATED by scripts/build-docs.mjs from examples/sticky-context-bar/ and the types in src/ -->
