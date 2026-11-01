"use client";

import { useState } from "react";
import { Calendar, type DayRange } from "@semi/ui";

export default function CalendarRange() {
  const [range, setRange] = useState<DayRange>({ start: "2026-11-03", end: "2026-11-09" });
  return (
    <div className="space-y-2">
      <Calendar mode="range" value={range} onChange={setRange} />
      <p className="text-label text-muted tabular-nums">
        {range.start ?? "…"} → {range.end ?? "…"}
      </p>
    </div>
  );
}
