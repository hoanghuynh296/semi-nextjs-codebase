"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "../../../../../../src/Badge";
import { Button } from "../../../../../../src/Button";
import { Card } from "../../../../../../src/Card";
import { DataTable, type DataTableColumn } from "../../../../../../src/DataTable";
import { FilterChipRow, useFilterParams, useListSelection, type ListSelection } from "../../../../../../src/FilterChipRow";
import { FilterPanel, PhoneFilterBar } from "../../../../../../src/FilterPanel";
import { Item, ItemGroup } from "../../../../../../src/Item";
import { Page, PageGrid } from "../../../../../../src/Page";
import { SearchPill, StickyContextBar, type SortDef } from "../../../../../../src/SearchPill";
import { ViewSwitch } from "../../../../../../src/ViewSwitch";
import { useDetailParam } from "../../../../../../src/DetailOverlay";
import type { FilterSpec } from "../../../../../../src/filterParams";

type Row = { id: string; customer: string; status: "open" | "done"; total: number };
const ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: `SO-${1001 + i}`,
  customer: ["Nguyễn An", "Trần Bình", "Lê Chi", "Phạm Dũng"][i % 4],
  status: i % 2 === 0 ? "open" : "done",
  total: 250_000 + i * 110_000,
}));

const SPECS: (FilterSpec & { key: "status" })[] = [
  { key: "status", label: "Trạng thái", options: [{ value: "open", label: "Đang xử lý" }, { value: "done", label: "Đã xong" }] },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: "id", header: "Mã đơn", sortable: true, cell: (r) => <span className="font-medium text-strong">{r.id}</span> },
  { key: "customer", header: "Khách hàng", sortable: true },
  { key: "status", header: "Trạng thái", priority: 2, cell: (r) => <Badge tone={r.status === "open" ? "amber" : "emerald"}>{r.status === "open" ? "Đang xử lý" : "Đã xong"}</Badge> },
  { key: "total", header: "Tổng", numeric: true, cell: (r) => `${r.total.toLocaleString("vi-VN")} ₫` },
];

export default function WorkLayoutPage() {
  const f = useFilterParams(SPECS);
  const sel = useListSelection();
  const detail = useDetailParam();
  const [panel, setPanel] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState<"list" | "grid">("list");
  const [bulkLog, setBulkLog] = useState("");
  const q = f.params.get("q") ?? "";

  const sortDef: SortDef = {
    value: sortBy,
    onChange: setSortBy,
    options: [
      { value: "newest", label: "Mới nhất" },
      { value: "total", label: "Giá trị cao" },
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
      onClick: (ids) => setBulkLog(`exported:${ids.join(",")}`),
    },
    moreActions: (ids) => [
      { label: "Xoá đã chọn", icon: "trash", danger: true, onSelect: () => setBulkLog(`deleted:${ids.join(",")}`) },
    ],
  };

  const filtered = useMemo(
    () =>
      ROWS.filter(
        (r) =>
          (!q || `${r.id} ${r.customer}`.toLocaleLowerCase("vi").includes(q.toLocaleLowerCase("vi"))) &&
          (!f.values.status.length || f.values.status.includes(r.status)),
      ),
    [q, f.values.status],
  );

  return (
    <Page
      layout="work"
      title="Đơn hàng"
      actions={
        <Button variant="inverse" icon="plus" onClick={() => setBulkLog("create")}>
          Tạo đơn
        </Button>
      }
      toolbar={
        <StickyContextBar label="Tìm và lọc đơn hàng">
          <SearchPill value={q} onChange={(v) => f.setParams({ q: v || null }, "replace")} label="Tìm đơn hàng" focusKey="/" />
          <FilterChipRow
            className="max-md:hidden"
            filters={f.filters}
            onChange={f.onChange}
            onClear={f.onClear}
            sort={sortDef}
            selection={selection}
            trailing={<ViewSwitch view={view} onViewChange={setView} />}
          />
          <PhoneFilterBar
            className="md:hidden"
            activeCount={f.activeCount}
            onOpenFilters={() => setPanel(true)}
            filtersOpen={panel}
            sort={sortDef}
            selection={selection}
          />
        </StickyContextBar>
      }
    >
      {bulkLog && <span data-testid="bulk-log" className="sr-only">{bulkLog}</span>}
      <div className="max-md:hidden" data-testid="desktop-list">
        {view === "list" ? (
          <DataTable
            label="Đơn hàng"
            rows={filtered}
            columns={COLUMNS}
            getRowId={(r) => r.id}
            selectable
            selected={sel.selected}
            onSelectedChange={sel.setSelected}
            activeRowId={detail.openId}
            onRowClick={(r) => detail.open(r.id)}
          />
        ) : (
          <PageGrid columns={3}>
            {filtered.map((r) => (
              <Card
                key={r.id}
                selectable={sel.active}
                checked={sel.isChecked(r.id)}
                onCheckedChange={(on) => sel.toggle(r.id, on)}
                selected={detail.openId === r.id}
                label={r.id}
                onClick={() => detail.open(r.id)}
                className="flex flex-col gap-2"
              >
                <span className="text-lead font-medium text-strong">{r.id}</span>
                <span className="text-ui text-muted">{r.customer}</span>
              </Card>
            ))}
          </PageGrid>
        )}
      </div>
      <ItemGroup label="Danh sách đơn hàng" className="md:hidden">
        {filtered.map((r) => (
          <Item
            key={r.id}
            title={r.id}
            description={r.customer}
            meta={`${r.total.toLocaleString("vi-VN")} ₫`}
            selectable={sel.active}
            checked={sel.isChecked(r.id)}
            onCheckedChange={(on) => sel.toggle(r.id, on)}
            selected={detail.openId === r.id}
            onClick={() => detail.open(r.id)}
          />
        ))}
      </ItemGroup>
      <FilterPanel open={panel} onClose={() => setPanel(false)} filters={f.filters} onChange={f.onChange} onClear={f.onClear} sort={sortDef} resultCount={filtered.length} />
    </Page>
  );
}
