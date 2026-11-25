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
