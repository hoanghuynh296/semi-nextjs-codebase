"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppShell, type AppShellProps, type ShellNavSection } from "../src/AppShell";
import type { IconName } from "../src/Icon";
import { DOCS, GROUPS } from "../examples/registry.generated";

/** Icon of each component group in the menu (on the group heading only: its items have none, a repeated icon says nothing). */
const GROUP_ICON: Record<string, IconName> = {
  Actions: "zap",
  Forms: "edit",
  Overlays: "layers",
  "Navigation & layout": "sidebar",
  "Data display": "grid",
  Feedback: "bell",
  AI: "sparkles",
  Blocks: "shapes",
  Setup: "settings",
};

/** Menu sections of every component doc, by group (hrefs with a trailing slash: static export + GitHub Pages). */
export function componentSections(): ShellNavSection[] {
  return GROUPS.flatMap((group) => {
    const docs = DOCS.filter((d) => d.group === group);
    return docs.length
      ? [{ label: group, icon: GROUP_ICON[group], items: docs.map((d) => ({ id: d.id, label: d.title, href: `/components/${d.id}/` })) }]
      : [];
  });
}

/** Which menu item the current path is (/components/button/ → "button", / → "home"). */
export function activeFromPath(pathname: string | null): string {
  const p = (pathname ?? "/").replace(/\/+$/, "");
  const doc = p.match(/^\/components\/([\w-]+)$/);
  if (doc) return doc[1];
  return p === "" ? "home" : p.slice(1);
}

/**
 * The docs frame shared by the Semi docs and every brand preview: AppShell with the caller's own sections first
 * (home, foundations, brand…) and then one section per component group. The active item follows the URL.
 */
export function DocsShell({
  productName,
  logoIcon = "sparkles",
  sections = [],
  account,
  utilities,
  footer,
  primaryCta,
  children,
}: {
  productName: string;
  logoIcon?: IconName;
  /** Sections shown above the component groups (e.g. Introduction, Foundations). */
  sections?: ShellNavSection[];
  /** Bottom of the menu (theme and style switches, version): AppShell `account`. */
  account?: AppShellProps["account"];
  /** Utilities above the account: AppShell `utilities`. */
  utilities?: AppShellProps["utilities"];
  /** @deprecated Since 0.36: use `account` (AppShell `footer` was split into `utilities` + `account`). */
  footer?: (state: { collapsed: boolean }) => React.ReactNode;
  /** @deprecated Since 0.36: phones use AppShell's drawer; ignored. */
  mobileTabIds?: string[];
  primaryCta?: AppShellProps["primaryCta"];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AppShell
      productName={productName}
      logoIcon={logoIcon}
      sections={[...sections, ...componentSections()]}
      activeId={activeFromPath(pathname)}
      account={account ?? footer}
      utilities={utilities}
      primaryCta={primaryCta}
    >
      {/* w-full: an auto-margin flex item would size to its widest demo and push the page past a phone screen */}
      <div className="@container w-full min-w-0 space-y-8">{children}</div>
    </AppShell>
  );
}
