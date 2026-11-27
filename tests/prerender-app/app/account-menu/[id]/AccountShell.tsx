"use client";

import React, { useState } from "react";
import { AppShell } from "../../../../../src/AppShell";
import { ThemeContext } from "../../../../../src/ThemeProvider";
import type { MenuItem } from "../../../../../src/Overlay";

type Mode = "light" | "dark" | "system";

// ds#215: an app that owns its theme renders AppShell with no Semi ThemeProvider (the root layout's provider is cleared
// here). "own": theme: false and the app's own radios in items; "missing": theme left on, so no choices and no crash.
export function AccountShell({ id }: { id: string }) {
  const [mode, setMode] = useState<Mode>("system");
  const own: MenuItem[] = (["light", "dark", "system"] as const).map((m) => ({
    label: { light: "Sáng (app)", dark: "Tối (app)", system: "Hệ thống (app)" }[m],
    icon: ({ light: "sun", dark: "moon", system: "monitor" } as const)[m],
    radio: true,
    checked: mode === m,
    group: "Giao diện",
    onSelect: () => setMode(m),
  }));
  return (
    <ThemeContext.Provider value={undefined}>
      <AppShell
        productName="Semi Account"
        sections={[{ items: [{ id: "home", label: "Trang chủ", icon: "home", href: `/account-menu/${id}` }] }]}
        activeId="home"
        header={{
          account:
            id === "own"
              ? { name: "An Nguyễn", detail: "Giáo viên", theme: false, items: [...own, { label: "Hồ sơ", icon: "user", onSelect: () => {}, separator: true }], onSignOut: () => {} }
              : { name: "Bình Lê", detail: "Học viên", onSignOut: () => {} },
        }}
      >
        <p className="text-ui text-body" data-app-mode={mode}>
          Chế độ của app: {mode}
        </p>
      </AppShell>
    </ThemeContext.Provider>
  );
}
