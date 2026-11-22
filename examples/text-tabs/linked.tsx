"use client";

import { TextTabs } from "@semi/ui";

/** URL-driven: each tab is a link and the page reads the current one from the URL (here a fixed value). */
export default function TextTabsLinked() {
  const view = "suppliers"; // e.g. from useSearchParams().get("view") or the route
  return (
    <TextTabs
      label="Mua hàng"
      heading={false}
      value={view}
      items={[
        { key: "requests", label: "Yêu cầu", href: "?view=requests" },
        { key: "suppliers", label: "Nhà cung cấp", href: "?view=suppliers" },
      ]}
    />
  );
}
