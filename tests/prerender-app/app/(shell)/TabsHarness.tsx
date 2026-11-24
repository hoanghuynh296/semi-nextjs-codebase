"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PillTabs } from "../../../../src/PillTabs";
import { SegmentedControl } from "../../../../src/SegmentedControl";
import { TextTabs } from "../../../../src/TextTabs";
import { useTabParam } from "../../../../src/useTabParam";

const SECTIONS = [
  { key: "mail", label: "Mail", icon: "mail" },
  { key: "groups", label: "Groups", icon: "layers" },
  { key: "sources", label: "Sources", icon: "filter" },
] as const;

const STATUSES = [
  { key: "all", label: "All", count: 12 },
  { key: "open", label: "Open", count: 5 },
  { key: "done", label: "Done", count: 7 },
] as const;

export function TabsSearchProbe() {
  const sp = useSearchParams();
  return (
    <div>
      <span data-testid="next-tab">{sp.get("tab") ?? "default"}</span>
      <span data-testid="next-status">{sp.get("status") ?? "default"}</span>
      <span data-testid="next-view">{sp.get("view") ?? "discover"}</span>
    </div>
  );
}

export function TabsHarness() {
  const [tab, setTab] = useTabParam("mail", { values: ["mail", "groups", "sources"] as const });
  const [status, setStatus] = useTabParam("all", { param: "status", values: ["all", "open", "done"] as const });
  const [blockAsync, setBlockAsync] = useState(false);
  const [refusedCount, setRefusedCount] = useState(0);

  const asyncGuard = async () => {
    await new Promise((r) => setTimeout(r, 15));
    if (blockAsync) {
      setRefusedCount((n) => n + 1);
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <label className="inline-flex items-center gap-2 text-ui">
        <input type="checkbox" checked={blockAsync} onChange={(e) => setBlockAsync(e.target.checked)} />
        Block async guard
      </label>
      <span data-testid="refused-count">{refusedCount}</span>
      <span data-testid="hook-tab">{tab}</span>
      <span data-testid="hook-status">{status}</span>

      <PillTabs label="Settings sections" value={tab} onChange={setTab} onBeforeChange={asyncGuard} items={[...SECTIONS]}>
        <p data-testid="pill-panel">Section: {tab}</p>
      </PillTabs>

      <SegmentedControl label="Order status" value={status} onChange={setStatus} onBeforeChange={asyncGuard} options={[...STATUSES]} />

      <TextTabs
        label="Explore views"
        heading={false}
        value="discover"
        onBeforeChange={asyncGuard}
        items={[
          { key: "discover", label: "Discover", href: "/tabs/a?view=discover" },
          { key: "templates", label: "Templates", href: "/tabs/a?view=templates" },
        ]}
      >
        <p>Explore panel</p>
      </TextTabs>
    </div>
  );
}
