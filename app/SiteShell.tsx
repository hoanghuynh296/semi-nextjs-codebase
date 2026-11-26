"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { type ShellNavSection } from "../src/AppShell";
import { ICONS } from "../src/Icon";
import { ThemeSwitcher } from "../src/ThemeProvider";
import { DocsShell } from "../site/DocsShell";
import pkg from "../package.json";
import { Badge } from "../src/Badge";
import { BrandPreviewHost } from "./BrandPreview";
import { LabHost } from "./LabPreview";
import { ComponentInspector } from "./inspector/Inspector";
import { InspectorToggle } from "./inspector/InspectorToggle";

/** Set by the Pages workflow when the site is built from a main commit that is not the tagged release yet. */
const UNRELEASED = process.env.NEXT_PUBLIC_SEMI_UNRELEASED === "1";

const ICON_COUNT = Object.keys(ICONS).length;

/** Semi's own docs: the shared DocsShell (site/) plus the Semi pages and the style / brand previews. */
const START: ShellNavSection[] = [
  {
    label: "Bắt đầu",
    items: [
      { id: "home", label: "Giới thiệu", shortLabel: "Home", icon: "sparkles", href: "/" },
      { id: "components", label: "Tất cả component", shortLabel: "UI", icon: "grid", href: "/components/" },
      { id: "foundations", label: "Foundations", shortLabel: "Tokens", icon: "palette", href: "/foundations/" },
      { id: "icons", label: "Icons", shortLabel: "Icons", icon: "shapes", href: "/icons/" },
      { id: "brand", label: "Brand preview", shortLabel: "Brand", icon: "palette", href: "/brand/" },
      { id: "lab", label: "Design Lab", shortLabel: "Lab", icon: "sliders", href: "/lab/" },
    ],
  },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  // /demo/*: an example that is a whole app shell itself (examples/app-shell/full.tsx) renders without the docs shell
  const pathname = usePathname();
  if (pathname?.startsWith("/demo/"))
    return (
      <>
        {children}
        <ComponentInspector />
      </>
    );
  return (
    <DocsShell
      productName="Semi Design"
      logoIcon="sparkles"
      sections={START}
      mainAction={{ label: "GitHub Repository", icon: "external", href: "https://github.com/hoanghuynh296/semi-nextjs-codebase", external: true }}
      // the route header's right side: the version, then the theme (Light / Dark / System, keeps "system")
      actions={
        <>
          <span className="hidden sm:inline-flex items-center gap-2 mr-2 text-chrome text-muted tabular-nums" title={UNRELEASED ? "Build từ main: có thay đổi chưa phát hành" : undefined}>
            @semi/ui v{pkg.version}
            {UNRELEASED && " · main"}
            <Badge size="sm">{ICON_COUNT} icon</Badge>
          </span>
          <InspectorToggle />
          <ThemeSwitcher variant="menu" />
        </>
      }
    >
      {children}
      {/* What is previewed on every page: a brand (Brand preview) and a draft of core values (Design Lab) */}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-toast flex flex-col items-end gap-2">
        <LabHost />
        <BrandPreviewHost />
      </div>
      {/* Hover a piece of an example: its component name, description and page (#194) */}
      <ComponentInspector />
    </DocsShell>
  );
}
