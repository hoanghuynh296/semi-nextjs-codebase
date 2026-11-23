# List page

A records page on the StickyContextBar anatomy: the title row with refresh and the create action (PageTitle actions), then the sticky bar (SearchPill, views as Pills + filter chips on md+, PhoneFilterBar + FilterPanel on phones, ResultLine), then a data table that sorts, selects and pages, with bulk actions. State in the URL. Copy it with `semi add list-page`.

## When to use

- Orders, customers, products, jobs: any page whose job is to find and act on records.

## Use something else when

| Need | Use |
|---|---|
| Entities people recognise by image and status | a grid of Card |
| A page with one or two filters and no search | PageTitle + SubpageToolbar |

## Examples

### Orders

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  FilterChipRow,
  FilterPanel,
  PageTitle,
  PhoneFilterBar,
  Pills,
  RefreshButton,
  ResultLine,
  SearchPill,
  StickyContextBar,
  toast,
  useFilterParams,
  type DataTableColumn,
  type FilterSpec,
} from "@semi/ui";

type Order = { id: string; customer: string; status: "pending" | "paid" | "refunded"; channel: "web" | "shopee" | "store"; branch: "hcm" | "hn"; total: number; date: string };
const STATUS = { paid: ["emerald", "Đã thanh toán"], pending: ["amber", "Chờ xử lý"], refunded: ["rose", "Hoàn tiền"] } as const;
const ORDERS: Order[] = Array.from({ length: 36 }, (_, i) => ({
  id: `SO-${1040 + i}`,
  customer: ["Nguyễn An", "Trần Bình", "Lê Chi", "Phạm Dũng", "Hoàng Hà", "Võ Lan"][i % 6],
  status: (["pending", "paid", "pending", "refunded"] as const)[i % 4],
  channel: (["web", "shopee", "store"] as const)[i % 3],
  branch: i % 5 < 3 ? "hcm" : "hn",
  total: 180_000 + ((i * 97_000) % 2_400_000),
  date: `2026-10-${String(1 + (i % 28)).padStart(2, "0")}`,
}));

// the page's views: the default is not "all" (it is left out of the URL)
type View = "open" | "done" | "all";
const VIEWS: { key: View; label: string }[] = [
  { key: "open", label: "Đang xử lý" },
  { key: "done", label: "Đã xong" },
  { key: "all", label: "Tất cả" },
];
const IN_VIEW: Record<View, (o: Order) => boolean> = {
  open: (o) => o.status === "pending",
  done: (o) => o.status !== "pending",
  all: () => true,
};

const SPECS: (FilterSpec & { key: "channel" | "branch" | "big" })[] = [
  { key: "channel", label: "Kênh bán", icon: "store", options: [{ value: "web", label: "Website" }, { value: "shopee", label: "Shopee" }, { value: "store", label: "Cửa hàng" }] },
  // one of N: "Chi nhánh: Tất cả" until a branch is picked
  { key: "branch", label: "Chi nhánh", icon: "mapPin", kind: "single", clearValue: "all", options: [{ value: "all", label: "Tất cả" }, { value: "hcm", label: "Hồ Chí Minh" }, { value: "hn", label: "Hà Nội" }] },
  { key: "big", label: "Trên 1 triệu", icon: "banknote", kind: "switch" },
];

const COLUMNS: DataTableColumn<Order>[] = [
  { key: "id", header: "Mã đơn", sortable: true, cell: (o) => <span className="font-medium text-contrast">{o.id}</span> },
  { key: "customer", header: "Khách hàng", sortable: true },
  { key: "status", header: "Trạng thái", value: (o) => STATUS[o.status][1], cell: (o) => <Badge tone={STATUS[o.status][0]} dot>{STATUS[o.status][1]}</Badge> },
  { key: "date", header: "Ngày", sortable: true },
  { key: "total", header: "Tổng", sortable: true, numeric: true, cell: (o) => `${o.total.toLocaleString("vi-VN")} ₫` },
];

export default function ListPage() {
  // filters, view and query live in the URL (?view=done&q=an&f.channel=web): reload, share, Back / Forward keep them
  const f = useFilterParams(SPECS);
  const [panel, setPanel] = useState(false);
  const q = f.params.get("q") ?? "";
  const view = (VIEWS.find((v) => v.key === f.params.get("view"))?.key ?? "open") as View;
  const setView = (v: View) => f.setParams({ view: v === "open" ? null : v });
  const rows = useMemo(() => {
    const needle = q.toLocaleLowerCase("vi");
    const branch = f.values.branch[0] ?? "all";
    return ORDERS.filter(
      (o) =>
        IN_VIEW[view](o) &&
        (!needle || `${o.id} ${o.customer}`.toLocaleLowerCase("vi").includes(needle)) &&
        (!f.values.channel.length || f.values.channel.includes(o.channel)) &&
        (branch === "all" || o.branch === branch) &&
        (!f.values.big.length || o.total > 1_000_000),
    );
  }, [q, view, f.values]);
  return (
    <div className="min-w-0">
      <PageTitle
        title="Đơn hàng"
        actions={
          <>
            <RefreshButton onRefresh={() => new Promise((r) => setTimeout(r, 600))} />
            <Button variant="primary" icon="plus" onClick={() => toast({ title: "Tạo đơn mới" })}>
              Tạo đơn
            </Button>
          </>
        }
      />
      <StickyContextBar label="Tìm và lọc đơn hàng">
        <SearchPill value={q} onChange={(v) => f.setParams({ q: v || null }, "replace")} label="Tìm đơn hàng" placeholder="Tìm mã đơn, khách hàng…" focusKey="/" />
        <FilterChipRow
          className="max-md:hidden"
          leading={<Pills value={view} onChange={setView} options={VIEWS} />}
          filters={f.filters}
          onChange={f.onChange}
          onClear={f.onClear}
        />
        <PhoneFilterBar
          className="md:hidden"
          typeLabel={VIEWS.find((v) => v.key === view)?.label}
          typeItems={VIEWS.map((v) => ({ label: v.label, radio: true, checked: v.key === view, onSelect: () => setView(v.key) }))}
          activeCount={f.activeCount}
          onOpenFilters={() => setPanel(true)}
          filtersOpen={panel}
        />
        <ResultLine query={q} count={rows.length} unit="đơn hàng" />
      </StickyContextBar>
      <DataTable
        label="Đơn hàng"
        rows={rows}
        columns={COLUMNS}
        getRowId={(o) => o.id}
        defaultSort={{ key: "date", dir: "desc" }}
        selectable
        bulkActions={(ids) => (
          <Button size="sm" variant="secondary" icon="download" onClick={() => toast({ title: `Đã xuất ${ids.length} đơn` })}>
            Xuất CSV
          </Button>
        )}
        pageSize={10}
      />
      <FilterPanel open={panel} onClose={() => setPanel(false)} filters={f.filters} onChange={f.onChange} onClear={f.onClear} resultCount={rows.length} />
    </div>
  );
}
```

## API

## Accessibility

- The title row is the page h1 with its action; the bar under it is a search landmark named for the page; the table has a caption; bulk actions appear as a labelled region.
- Views are toggle buttons (Pills) on md+ and radio items of a menu on phones; a single-choice filter chip opens a menu of radio items.

<!-- GENERATED by scripts/build-docs.mjs from examples/list-page/ and the types in src/ -->
