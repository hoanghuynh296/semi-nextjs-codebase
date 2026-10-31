"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell, type ShellNavSection } from "../src/AppShell";
import { Icon } from "../src/Icon";
import { BTN_SECONDARY } from "../styles/buttons";

export function StorybookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  // Normalize active route
  const activeId = pathname.includes("/components") ? "components" : "foundations";

  const sections: ShellNavSection[] = [
    {
      label: "Storybook & Catalog",
      items: [
        {
          id: "foundations",
          label: "Foundations & Icons",
          shortLabel: "Foundations",
          icon: "palette",
          href: "./foundations",
        },
        {
          id: "components",
          label: "Components Showcase",
          shortLabel: "Components",
          icon: "sliders",
          href: "./components",
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

  const handleCopyInstall = () => {
    navigator.clipboard.writeText("npx semi-lint");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      footer={
        <div className="p-2 border-t border-line/60">
          <div className="flex items-center justify-between text-[11px] text-muted px-1 py-1">
            <span>Semi UI v0.3.0</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              166 Icons
            </span>
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
        {children}
      </div>
    </AppShell>
  );
}
