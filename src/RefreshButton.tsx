"use client";

// Icon-only "Làm mới" page action: reloads the page's
// data; the icon spins while the reload runs (a button running its own action may show a spinner, §13b).
import React, { useState } from "react";
import { Icon } from "./Icon";
import { BTN_ICON, BTN_SECONDARY } from "../styles/buttons";

export function RefreshButton({ onRefresh, className = "", label = "Làm mới" }: { onRefresh: () => unknown; className?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          // Spin at least one turn so a fast LAN reload still shows that something happened.
          await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 600))]);
        } finally {
          setBusy(false);
        }
      }}
      aria-label={label}
      title={label}
      aria-busy={busy}
      className={`${BTN_SECONDARY} ${BTN_ICON} ${className}`}
    >
      <Icon name="refresh" className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
    </button>
  );
}
