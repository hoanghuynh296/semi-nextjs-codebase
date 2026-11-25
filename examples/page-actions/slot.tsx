"use client";

import { useState } from "react";
import { Button, PageActions, PageActionsProvider, PageActionsSlot, TextTabs } from "@semi/ui";

export default function PageActionsSlotExample() {
  const [view, setView] = useState<"printers" | "jobs">("printers");
  return (
    <PageActionsProvider>
      <div className="flex items-end gap-3">
        <TextTabs
          label="Chế độ xem"
          value={view}
          onChange={setView}
          items={[
            { key: "printers", label: "Máy in" },
            { key: "jobs", label: "Job in" },
          ]}
        />
        <PageActionsSlot className="ml-auto" />
      </div>
      {/* Declared by the page content, shown in the slot above */}
      <PageActions>
        <Button variant="inverse" iconOnly icon="plus" aria-label={view === "printers" ? "Thêm máy in" : "Tạo job"} />
      </PageActions>
    </PageActionsProvider>
  );
}
