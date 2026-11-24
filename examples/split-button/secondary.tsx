"use client";

import { useState } from "react";
import { SplitButton, toast } from "@semi/ui";

// A secondary SplitButton (a detail header that already has its primary), with a running main action.
export default function SplitButtonSecondary() {
  const [busy, setBusy] = useState(false);
  return (
    <SplitButton
      variant="subtle"
      label="Mở trong IDE"
      icon="code"
      loading={busy}
      onClick={() => {
        setBusy(true);
        setTimeout(() => setBusy(false), 1200);
      }}
      menuLabel="Mở bằng cách khác"
      items={[
        { label: "Mở Terminal", icon: "terminal", onSelect: () => toast({ title: "Mở Terminal" }) },
        { label: "Mở trong Finder", icon: "folder", onSelect: () => toast({ title: "Mở Finder" }) },
      ]}
    />
  );
}
