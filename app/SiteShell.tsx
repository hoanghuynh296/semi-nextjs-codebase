"use client";

import React from "react";
import { type ShellNavSection } from "../src/AppShell";
import { ICONS } from "../src/Icon";
import { ThemeSwitcher, ThemeToggle } from "../src/ThemeProvider";
import { DocsShell } from "../site/DocsShell";
import pkg from "../package.json";
import { Badge } from "../src/Badge";
import { StyleSwitcher } from "./StyleSwitcher";
import { BrandPreviewHost } from "./BrandPreview";

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
    ],
  },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <DocsShell
      productName="Semi Design"
      logoIcon="sparkles"
      sections={START}
      mobileTabIds={["home", "components", "foundations", "brand"]}
      primaryCta={{ label: "GitHub Repository", icon: "external", href: "https://github.com/hoanghuynh296/semi-nextjs-codebase", external: true }}
      footer={({ collapsed }) =>
        collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
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
        )
      }
    >
      {children}
      <BrandPreviewHost />
    </DocsShell>
  );
}
