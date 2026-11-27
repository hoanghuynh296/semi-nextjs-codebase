"use client";

import { useState } from "react";
import { AppShell, type MenuItem, type ShellNavSection } from "@semi/ui";

// An app that owns its theme (a cookie the server reads, so the first HTML already has the right data-theme) and does
// not render Semi's ThemeProvider. `theme: false` keeps AccountMenu off Semi's theme, and the app puts its own
// Light / Dark / System radios in `items`. ThemeToggle, ThemeSwitcher and useThemeUtility still need ThemeProvider.
type Mode = "light" | "dark" | "system";

/** Stands in for the app's own theme hook (next-themes, a cookie, the host product's setting). */
function useAppTheme() {
  const [mode, setMode] = useState<Mode>("system");
  const choose = (next: Mode) => {
    setMode(next);
    document.cookie = `theme=${next}; path=/; max-age=31536000`;
    const dark = next === "dark" || (next === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  };
  return { mode, choose };
}

const SECTIONS: ShellNavSection[] = [
  {
    items: [
      { id: "courses", label: "Khoá học", icon: "fileText", href: "/courses" },
      { id: "students", label: "Học viên", icon: "users", href: "/students" },
    ],
  },
];

export default function OwnThemeShell({ children }: { children?: React.ReactNode }) {
  const { mode, choose } = useAppTheme();
  const themeItems: MenuItem[] = [
    { label: "Sáng", icon: "sun", radio: true, checked: mode === "light", group: "Giao diện", onSelect: () => choose("light") },
    { label: "Tối", icon: "moon", radio: true, checked: mode === "dark", group: "Giao diện", onSelect: () => choose("dark") },
    { label: "Hệ thống", icon: "monitor", radio: true, checked: mode === "system", group: "Giao diện", onSelect: () => choose("system") },
  ];
  return (
    <AppShell
      productName="Lớp học"
      logoIcon="award"
      sections={SECTIONS}
      activeId="courses"
      header={{
        account: {
          name: "Minh Trần",
          detail: "Giáo viên",
          theme: false,
          items: [...themeItems, { label: "Tài khoản", icon: "user", href: "/account", separator: true }],
          onSignOut: () => {},
        },
      }}
    >
      {children}
    </AppShell>
  );
}
