"use client";

import { useState } from "react";
import { StickyContextBar, SearchPill } from "../../../../src/SearchPill";
import { FilterChipRow, useFilterParams } from "../../../../src/FilterChipRow";
import { FilterPanel, PhoneFilterBar } from "../../../../src/FilterPanel";
import { ViewSwitch, type ViewMode } from "../../../../src/ViewSwitch";
import { SubpageToolbar } from "../../../../src/SubpageToolbar";

// The search and filter bar as products mount it (#99): rendered OUTSIDE the page's Suspense, so a window access in
// render or a router hook that suspends fails `next build` here (CLIENT_HOOK_DYNAMIC, the ToastHost lesson, #82).
export function FiltersBar() {
  const f = useFilterParams([
    { key: "status", label: "Status", options: [{ value: "new", label: "New" }, { value: "done", label: "Done" }] },
    { key: "paid", label: "Paid", kind: "switch" },
  ]);
  const [view, setView] = useState<ViewMode>("list");
  const [open, setOpen] = useState(false);
  const q = f.params.get("q") ?? "";
  return (
    <>
      <SubpageToolbar title="Orders" filters={{ filters: f.filters, onChange: f.onChange, onClear: f.onClear }} secondaryActions={[{ label: "Export", onSelect: () => {} }]} />
      <StickyContextBar label="Search orders">
        {/* a long debounce, so a test clicks a chip surely inside it (#128) */}
        <SearchPill value={q} onChange={(v) => f.setParams({ q: v }, "replace")} label="Search orders" focusKey="/" debounce={2000} />
        <FilterChipRow filters={f.filters} onChange={f.onChange} onClear={f.onClear} trailing={<ViewSwitch view={view} onViewChange={setView} />} />
        <PhoneFilterBar activeCount={f.activeCount} onOpenFilters={() => setOpen(true)} />
      </StickyContextBar>
      <output data-testid="hook-status">{f.values.status.join(",") || "none"}</output>
      <FilterPanel open={open} onClose={() => setOpen(false)} filters={f.filters} onChange={f.onChange} onClear={f.onClear} resultCount={3} />
    </>
  );
}
