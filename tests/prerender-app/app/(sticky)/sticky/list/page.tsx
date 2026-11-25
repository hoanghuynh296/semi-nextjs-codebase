"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "../../../../../../src/Badge";
import { Button } from "../../../../../../src/Button";
import { DataTable, type DataTableColumn } from "../../../../../../src/DataTable";
import { FilterChipRow, useFilterParams, useListSelection, type ListSelection } from "../../../../../../src/FilterChipRow";
import { FilterPanel, PhoneFilterBar } from "../../../../../../src/FilterPanel";
import { Item, ItemGroup } from "../../../../../../src/Item";
import { Page } from "../../../../../../src/Page";
import { BarActions, SearchPill, StickyContextBar, type BarAction } from "../../../../../../src/SearchPill";
import { ViewSwitch } from "../../../../../../src/ViewSwitch";
import { useDetailParam } from "../../../../../../src/DetailOverlay";
import { replaceFilters } from "../../../../../../src/urlState";
import type { FilterSpec } from "../../../../../../src/filterParams";

type Row = { id: string; customer: string; status: "open" | "done"; box: "sales" | "billing"; total: number };
const ALL_ROWS: Row[] = Array.from({ length: 40 }, (_, i) => ({
  id: `SO-${1001 + i}`,
  customer: ["Nguyễn An", "Trần Bình", "Lê Chi", "Phạm Dũng", "Hoàng Em"][i % 5] + ` #${i + 1}`,
  status: i % 2 === 0 ? "open" : "done",
  box: i % 3 === 0 ? "billing" : "sales",
  total: 250_000 + i * 75_000,
}));

const SPECS = [
  {
    key: "status",
    label: "Trạng thái",
    options: [
      { value: "open", label: "Đang xử lý" },
      { value: "done", label: "Đã xong" },
    ],
  },
  {
    key: "box",
    label: "Hộp thư",
    kind: "single" as const,
    clearValue: "all",
    options: [
      { value: "all", label: "Tất cả" },
      { value: "sales", label: "Bán hàng" },
      { value: "billing", label: "Kế toán" },
    ],
  },
  {
    key: "emptySingle",
    label: "Kho hàng",
    kind: "single" as const,
    options: [],
  },
] as const satisfies readonly FilterSpec[];

const SORT_OPTIONS = [
  { value: "id.asc", label: "Mã tăng dần" },
  { value: "total.desc", label: "Giá trị cao" },
  { value: "customer.asc", label: "Khách A-Z" },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: "id", header: "Mã đơn", sortable: true, cell: (r) => <span className="font-medium text-strong">{r.id}</span> },
  { key: "customer", header: "Khách hàng", sortable: true },
  {
    key: "status",
    header: "Trạng thái",
    priority: 2,
    cell: (r) => <Badge tone={r.status === "open" ? "amber" : "emerald"}>{r.status === "open" ? "Đang xử lý" : "Đã xong"}</Badge>,
  },
  { key: "total", header: "Tổng", sortable: true, numeric: true, cell: (r) => `${r.total.toLocaleString("vi-VN")} ₫` },
];

export default function StickyListPage() {
  const f = useFilterParams(SPECS, {
    legacy: { status: "status", old_q: "q" },
    sort: {
      defaultSort: { key: "id", dir: "asc" },
      options: SORT_OPTIONS,
      allowedKeys: ["id", "customer", "total"],
    },
  });
  const sel = useListSelection();
  const detail = useDetailParam();
  const [panel, setPanel] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");
  const [actionLog, setActionLog] = useState("");
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [resultsCalls, setResultsCalls] = useState(0);
  const q = f.params.get("q") ?? "";
  const isShort = f.params.get("short") === "1";

  const baseRows = useMemo(() => (isShort ? ALL_ROWS.slice(0, 2) : ALL_ROWS), [isShort]);

  const filtered = useMemo(
    () =>
      baseRows.filter(
        (r) =>
          (!f.values.status.length || f.values.status.includes(r.status)) &&
          (!f.values.box.length || f.values.box.includes(r.box)),
      ),
    [baseRows, f.values.status, f.values.box],
  );

  const barActions: BarAction[] = [
    { key: "refresh", label: "Làm mới", icon: "refresh", onSelect: () => setActionLog("refresh") },
    { key: "export", label: "Xuất CSV", icon: "download", onSelect: () => setActionLog("export") },
    { key: "create", label: "Tạo đơn", icon: "plus", primary: true, onSelect: () => setActionLog("create") },
  ];

  const selection: ListSelection = {
    active: sel.active,
    selected: sel.selected,
    onEnter: sel.enter,
    onExit: sel.exit,
    primaryAction: {
      label: "Xuất CSV",
      icon: "download",
      onClick: (ids) => setActionLog(`bulk:${ids.join(",")}`),
    },
    moreActions: (ids) => [{ label: "Xoá đã chọn", icon: "trash", danger: true, onSelect: () => setActionLog(`del:${ids.join(",")}`) }],
  };

  return (
    <Page
      layout="work"
      title="Đơn hàng"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" data-testid="patch-filters" onClick={() => f.patch({ status: ["done"], box: ["sales"] })}>
            Patch
          </Button>
          <Button variant="ghost" size="sm" data-testid="replace-ext" onClick={() => replaceFilters({ status: ["open"] }, SPECS)}>
            ReplaceExt
          </Button>
          <Button variant="ghost" size="sm" data-testid="open-panel" onClick={() => setPanel(true)}>
            OpenPanel
          </Button>
          <Button variant="inverse" icon="plus" onClick={() => setActionLog("create")}>
            Tạo đơn
          </Button>
        </div>
      }
      toolbar={
        <StickyContextBar label="Tìm và lọc đơn hàng">
          <SearchPill
            value={q}
            onChange={(v) => f.setParams({ q: v || null }, "replace")}
            label="Tìm đơn hàng"
            focusKey="/"
            debounce={0}
            trailing={<BarActions actions={barActions} />}
          />
          <FilterChipRow
            className="max-md:hidden"
            filters={f.filters}
            onChange={f.onChange}
            onClear={f.onClear}
            sort={f.sortDef}
            selection={selection}
            trailing={<ViewSwitch view={view} onViewChange={setView} />}
          />
          <PhoneFilterBar
            className="md:hidden"
            activeCount={f.activeCount}
            onOpenFilters={() => setPanel(true)}
            filtersOpen={panel}
            sort={f.sortDef}
            selection={selection}
          />
        </StickyContextBar>
      }
    >
      <output data-testid="action-log" className="sr-only">
        {actionLog}
      </output>
      <output data-testid="result-ids" className="sr-only">
        {orderedIds.slice(0, 5).join(",")}
      </output>
      <output data-testid="results-calls" className="sr-only">
        {resultsCalls}
      </output>
      <div className="max-md:hidden" data-testid="desktop-list">
        <DataTable
          label="Đơn hàng"
          rows={filtered.slice()}
          columns={[...COLUMNS]}
          getRowId={(r) => r.id}
          search={q}
          sort={f.sort}
          onSortChange={f.setSort}
          onResultsChange={(rows) => {
            setOrderedIds(rows.map((r) => r.id));
            setResultsCalls((c) => c + 1);
          }}
          selectable
          selected={sel.selected}
          onSelectedChange={sel.setSelected}
          activeRowId={detail.openId}
          onRowClick={(r) => detail.open(r.id)}
        />
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
      <FilterPanel
        open={panel}
        onClose={() => setPanel(false)}
        filters={f.filters}
        onChange={f.onChange}
        onClear={f.onClear}
        sort={f.sortDef}
        resultCount={filtered.length}
      />
    </Page>
  );
}
