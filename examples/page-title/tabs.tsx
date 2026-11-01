"use client";

import { useState } from "react";
import { PageTabsTitle } from "@semi/ui";

export default function PageTabsTitleBasic() {
  const [view, setView] = useState<"printers" | "jobs">("printers");
  return (
    <PageTabsTitle
      value={view}
      onChange={setView}
      tabs={[
        { key: "printers", label: "Máy in" },
        { key: "jobs", label: "Job in" },
      ]}
    />
  );
}
