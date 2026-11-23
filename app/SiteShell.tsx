"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { type ShellNavSection } from "../src/AppShell";
import { ICONS } from "../src/Icon";
import { ThemeSwitcher } from "../src/ThemeProvider";
import { DocsShell } from "../site/DocsShell";
import pkg from "../package.json";
import { Badge } from "../src/Badge";
import { StyleSwitcher } from "./StyleSwitcher";
import { BrandPreviewHost } from "./BrandPreview";
import { LabHost } from "./LabPreview";

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
      { id: "foundations", label: "Foundations & icon", shortLabel: "Tokens", icon: "palette", href: "/foundations/" },
      { id: "brand", label: "Brand preview", shortLabel: "Brand", icon: "palette", href: "/brand/" },
      { id: "lab", label: "Design Lab", shortLabel: "Lab", icon: "sliders", href: "/lab/" },
    ],
  },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  // /demo/*: an example that is a whole app shell itself (examples/app-shell/full.tsx) renders without the docs shell
  const pathname = usePathname();
  if (pathname?.startsWith("/demo/")) return <>{children}</>;
  return (
    <DocsShell
      productName="Semi Design"
      logoIcon="sparkles"
      sections={START}
      primaryCta={{ label: "GitHub Repository", icon: "external", href: "https://github.com/hoanghuynh296/semi-nextjs-codebase", external: true }}
      // The rail (collapsed, or md) has 44px: the theme as one icon button that keeps "system" (#113, #114). Chosen by
      // the same CSS as the nav labels, not by `rail`: the width is only known after mount, and the server HTML must
      // already show the right block at lg (no swap after hydration)
      account={({ collapsed }) => (
        <>
          <div className={collapsed ? "flex justify-center" : "flex justify-center lg:hidden"}>
            <ThemeSwitcher variant="menu" />
          </div>
          <div className={collapsed ? "hidden" : "hidden lg:flex flex-col gap-2"}>
            <ThemeSwitcher fullWidth />
            <StyleSwitcher />
            <div className="flex items-center justify-between text-caption text-muted px-1">
              <span className="tabular-nums" title={UNRELEASED ? "Build từ main: có thay đổi chưa phát hành" : undefined}>
                @semi/ui v{pkg.version}
                {UNRELEASED && " · main"}
              </span>
              <Badge size="sm">{ICON_COUNT} icon</Badge>
            </div>
          </div>
        </>
      )}
    >
      {children}
      {/* What is previewed on every page: a brand (Brand preview) and a draft of core values (Design Lab) */}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-toast flex flex-col items-end gap-2">
        <LabHost />
        <BrandPreviewHost />
      </div>
    </DocsShell>
  );
}
