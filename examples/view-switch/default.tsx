"use client";

import { useState } from "react";
import { ViewSwitch, type ViewDensity, type ViewMode } from "@semi/ui";

export default function ViewSwitchDefault() {
  const [view, setView] = useState<ViewMode>("grid");
  const [density, setDensity] = useState<ViewDensity>("comfortable");
  return (
    <div className="flex items-center gap-4">
      <ViewSwitch view={view} onViewChange={setView} density={density} onDensityChange={setDensity} />
      <span className="text-label text-muted">
        {view === "grid" ? "Lưới" : "Danh sách"} · {density === "compact" ? "Gọn" : "Thoáng"}
      </span>
    </div>
  );
}
