"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell, type ShellNavSection } from "../src/AppShell";
import { ICONS } from "../src/Icon";
import { ThemeSwitcher, ThemeToggle } from "../src/ThemeProvider";
import pkg from "../package.json";

const ICON_COUNT = Object.keys(ICONS).length;

export function StorybookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Normalize active route
  const activeId = ["components", "primitives", "patterns", "chat"].find((p) => pathname.includes(`/${p}`)) ?? "foundations";

  const sections: ShellNavSection[] = [
    {
      label: "Storybook & Catalog",
      items: [
        {
          id: "foundations",
          label: "Foundations & Icons",
          shortLabel: "Tokens",
          icon: "palette",
          href: "./foundations",
        },
        {
          id: "components",
          label: "Components Showcase",
          shortLabel: "UI",
          icon: "sliders",
          href: "./components",
        },
        {
          id: "primitives",
          label: "Primitives & Forms",
          shortLabel: "Forms",
          icon: "zap",
          href: "./primitives",
        },
        {
          id: "patterns",
          label: "Layout Patterns",
          shortLabel: "Layout",
          icon: "grid",
          href: "./patterns",
        },
        {
          id: "chat",
          label: "AI Chat",
          shortLabel: "Chat",
          icon: "sparkles",
          href: "./chat",
        },
      ],
    },
    {
      label: "Documentation & Source",
      items: [
        {
          id: "icons-doc",
          label: "Icon Semantic Guide",
          shortLabel: "ICONS.md",
          icon: "file",
          href: "https://github.com/hoanghuynh296/semi-nextjs-codebase/blob/main/docs/ICONS.md",
          external: true,
        },
        {
          id: "design-doc",
          label: "Design System Rules",
          shortLabel: "DESIGN.md",
          icon: "code",
          href: "https://github.com/hoanghuynh296/semi-nextjs-codebase/blob/main/docs/DESIGN_SYSTEM.md",
          external: true,
        },
      ],
    },
  ];

  return (
    <AppShell
      productName="Semi Design"
      logoIcon="sparkles"
      sections={sections}
      activeId={activeId}
      primaryCta={{
        label: "GitHub Repository",
        icon: "external",
        href: "https://github.com/hoanghuynh296/semi-nextjs-codebase",
        external: true,
      }}
      footer={({ collapsed }) =>
        collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <ThemeSwitcher fullWidth />
            <div className="flex items-center justify-between text-caption text-muted px-1">
              <span className="tabular-nums">@semi/ui v{pkg.version}</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-success-fg font-medium tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {ICON_COUNT} icons
              </span>
            </div>
          </div>
        )
      }
    >
      {/* w-full: an auto-margin flex item would size to its widest demo and push the page past a phone screen */}
      <div className="w-full min-w-0 space-y-8">
        {children}
      </div>
    </AppShell>
  );
}
