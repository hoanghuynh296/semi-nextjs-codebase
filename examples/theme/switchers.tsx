"use client";

import { ThemeSwitcher, ThemeToggle, useTheme } from "@semi/ui";

export default function ThemeSwitchers() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ThemeSwitcher showLabels />
      <ThemeSwitcher />
      <ThemeSwitcher variant="menu" />
      <ThemeToggle />
      <span className="text-ui text-muted tabular-nums">
        theme = {theme} · resolved = {resolvedTheme}
      </span>
    </div>
  );
}
