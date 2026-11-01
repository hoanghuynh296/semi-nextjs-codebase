"use client";

import { useState } from "react";
import { SidePanel, SidePanelToggle, Skeleton } from "@semi/ui";

export default function SidePanelCanvas() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="h-64 flex rounded-card border border-line overflow-hidden bg-canvas">
      <SidePanel collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)}>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label font-medium text-muted">Cài đặt lát cắt</span>
            <SidePanelToggle onClick={() => setCollapsed(true)} />
          </div>
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </SidePanel>
      <div className="flex-1 flex items-center justify-center text-label text-muted">Canvas / 3D view</div>
    </div>
  );
}
