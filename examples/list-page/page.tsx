"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  DetailOverlay,
  FilterChipRow,
  FilterPanel,
  Item,
  ItemGroup,
  Page,
  PageGrid,
  PhoneFilterBar,
  RefreshButton,
  SearchPill,
  SegmentedControl,
  StickyContextBar,
  ViewSwitch,
  toast,
  useDetailParam,
  useFilterParams,
  useListSelection,
  type DataTableColumn,
  type FilterSpec,
  type ListSelection,
  type SortDef,
} from "@semi/ui";

type Order = { id: string; customer: string; status: "pending" | "paid" | "refunded"; channel: "web" | "shopee" | "store"; branch: "hcm" | "hn"; total: number; date: string };
const STATUS = { paid: ["emerald", "Đã thanh toán"], pending: ["amber", "Chờ xử lý"], refunded: ["rose", "Hoàn tiền"] } as const;
const ORDERS: Order[] = Array.from({ length: 24 }, (_, i) => ({
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
  { key: "branch", label: "Chi nhánh", icon: "mapPin", kind: "single", clearValue: "all", options: [{ value: "all", label: "Tất cả" }, { value: "hcm", label: "Hồ Chí Minh" }, { value: "hn", label: "Hà Nội" }] },
  { key: "big", label: "Trên 1 triệu", icon: "banknote", kind: "switch" },
];

const COLUMNS: DataTableColumn<Order>[] = [
  { key: "id", header: "Mã đơn", sortable: true, cell: (o) => <span className="font-medium text-strong">{o.id}</span> },
  { key: "customer", header: "Khách hàng", sortable: true },
  { key: "status", header: "Trạng thái", priority: 2, value: (o) => STATUS[o.status][1], cell: (o) => <Badge tone={STATUS[o.status][0]} dot>{STATUS[o.status][1]}</Badge> },
  { key: "date", header: "Ngày", priority: 3, sortable: true },
  { key: "total", header: "Tổng", sortable: true, numeric: true, cell: (o) => `${o.total.toLocaleString("vi-VN")} ₫` },
];

export default function ListPage() {
  const f = useFilterParams(SPECS);
  const detail = useDetailParam();
  const sel = useListSelection();
  const [panel, setPanel] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [mode, setMode] = useState<"list" | "grid">("list");
  const q = f.params.get("q") ?? "";
  const view = (VIEWS.find((v) => v.key === f.params.get("view"))?.key ?? "open") as View;
  const setView = (v: View) => f.setParams({ view: v === "open" ? null : v });

  const sortDef: SortDef = {
    value: sortBy,
    onChange: setSortBy,
    options: [
      { value: "newest", label: "Mới nhất" },
      { value: "total-desc", label: "Giá trị cao" },
      { value: "customer", label: "Tên khách" },
    ],
  };

  const selection: ListSelection = {
    active: sel.active,
    selected: sel.selected,
    onEnter: sel.enter,
    onExit: sel.exit,
    primaryAction: {
      label: "Xuất CSV",
      icon: "download",
      onClick: (ids) => {
        toast.success(`Đã xuất ${ids.length} đơn`);
        sel.exit();
      },
    },
    moreActions: (ids) => [
      { label: "Đánh dấu đã xử lý", icon: "check", onSelect: () => toast({ title: `Cập nhật ${ids.length} đơn` }) },
      { label: "Xoá đã chọn", icon: "trash", danger: true, onSelect: () => toast({ title: `Xoá ${ids.length} đơn`, tone: "danger" }) },
    ],
  };

  const rows = useMemo(() => {
    const needle = q.toLocaleLowerCase("vi");
    const branch = f.values.branch[0] ?? "all";
    const list = ORDERS.filter(
      (o) =>
        IN_VIEW[view](o) &&
        (!needle || `${o.id} ${o.customer}`.toLocaleLowerCase("vi").includes(needle)) &&
        (!f.values.channel.length || f.values.channel.includes(o.channel)) &&
        (branch === "all" || o.branch === branch) &&
        (!f.values.big.length || o.total > 1_000_000),
    );
    return [...list].sort((a, b) =>
      sortBy === "total-desc" ? b.total - a.total : sortBy === "customer" ? a.customer.localeCompare(b.customer, "vi") : b.date.localeCompare(a.date),
    );
  }, [q, view, f.values, sortBy]);

  const openIndex = detail.openId ? rows.findIndex((r) => r.id === detail.openId) : -1;
  const openOrder = openIndex >= 0 ? rows[openIndex] : null;

  return (
    <Page
      layout="work"
      title="Đơn hàng"
      actions={
        <>
          <RefreshButton onRefresh={() => new Promise((r) => setTimeout(r, 600))} />
          <Button variant="inverse" icon="plus" onClick={() => toast({ title: "Tạo đơn mới" })}>
            Tạo đơn
          </Button>
        </>
      }
      toolbar={
        <StickyContextBar label="Tìm và lọc đơn hàng">
          <SearchPill value={q} onChange={(v) => f.setParams({ q: v || null }, "replace")} label="Tìm đơn hàng" placeholder="Tìm mã đơn, khách hàng…" focusKey="/" />
          <FilterChipRow
            className="max-md:hidden"
            leading={<SegmentedControl label="Trạng thái đơn" value={view} onChange={setView} options={VIEWS} />}
            filters={f.filters}
            onChange={f.onChange}
            onClear={f.onClear}
            sort={sortDef}
            selection={selection}
            trailing={<ViewSwitch view={mode} onViewChange={setMode} />}
          />
          <PhoneFilterBar
            className="md:hidden"
            typeLabel={VIEWS.find((v) => v.key === view)?.label}
            typeItems={VIEWS.map((v) => ({ label: v.label, radio: true, checked: v.key === view, onSelect: () => setView(v.key) }))}
            activeCount={f.activeCount}
            onOpenFilters={() => setPanel(true)}
            filtersOpen={panel}
            sort={sortDef}
            selection={selection}
          />
        </StickyContextBar>
      }
    >
      {/* Desktop: table or card grid, sharing the same filter-row selection state with zero vertical shift */}
      <div className="max-md:hidden">
        {mode === "list" ? (
          <DataTable
            label="Đơn hàng"
            rows={rows}
            columns={COLUMNS}
            getRowId={(o) => o.id}
            selectable
            selected={sel.selected}
            onSelectedChange={sel.setSelected}
            activeRowId={detail.openId}
            onRowClick={(o) => detail.open(o.id)}
            pageSize={10}
          />
        ) : (
          <PageGrid columns={3}>
            {rows.slice(0, 9).map((o) => (
              <Card
                key={o.id}
                selectable={sel.active}
                checked={sel.isChecked(o.id)}
                onCheckedChange={(on) => sel.toggle(o.id, on)}
                selected={detail.openId === o.id}
                label={`${o.id} · ${o.customer}`}
                onClick={() => detail.open(o.id)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lead font-medium text-strong">{o.id}</span>
                  <Badge tone={STATUS[o.status][0]} dot>{STATUS[o.status][1]}</Badge>
                </div>
                <span className="text-ui text-body">{o.customer}</span>
                <span className="text-chrome text-muted tabular-nums">{o.total.toLocaleString("vi-VN")} ₫ · {o.date}</span>
              </Card>
            ))}
          </PageGrid>
        )}
      </div>

      {/* Phones: Item rows sharing the exact same non-nested selection model */}
      <ItemGroup label="Danh sách đơn hàng" className="md:hidden">
        {rows.slice(0, 10).map((o) => (
          <Item
            key={o.id}
            title={o.id}
            description={o.customer}
            meta={`${o.total.toLocaleString("vi-VN")} ₫`}
            selectable={sel.active}
            checked={sel.isChecked(o.id)}
            onCheckedChange={(on) => sel.toggle(o.id, on)}
            selected={detail.openId === o.id}
            onClick={() => detail.open(o.id)}
          />
        ))}
      </ItemGroup>

      <FilterPanel open={panel} onClose={() => setPanel(false)} filters={f.filters} onChange={f.onChange} onClear={f.onClear} sort={sortDef} resultCount={rows.length} />

      <DetailOverlay
        open={openOrder !== null}
        onClose={detail.close}
        title={openOrder ? `${openOrder.id} · ${openOrder.customer}` : ""}
        subtitle={openOrder ? `${STATUS[openOrder.status][1]} · ${openOrder.date}` : undefined}
        index={openIndex >= 0 ? openIndex : undefined}
        total={rows.length}
        onPrev={openIndex > 0 ? () => detail.show(rows[openIndex - 1].id) : undefined}
        onNext={openIndex >= 0 && openIndex < rows.length - 1 ? () => detail.show(rows[openIndex + 1].id) : undefined}
      >
        {openOrder && (
          <p className="text-ui text-body tabular-nums">
            Tổng giá trị: <span className="font-medium text-strong">{openOrder.total.toLocaleString("vi-VN")} ₫</span>
          </p>
        )}
      </DetailOverlay>
    </Page>
  );
}
