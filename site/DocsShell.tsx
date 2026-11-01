"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppShell, type ShellNavSection } from "../src/AppShell";
import type { IconName } from "../src/Icon";
import { DOCS, GROUPS } from "../examples/registry.generated";

/** Icon of each component group in the menu. */
const GROUP_ICON: Record<string, IconName> = {
  Actions: "zap",
  Forms: "edit",
  Overlays: "layers",
  "Navigation & layout": "sidebar",
  "Data display": "grid",
  Feedback: "bell",
  AI: "sparkles",
  Setup: "settings",
};

/** Menu sections of every component doc, by group (hrefs with a trailing slash: static export + GitHub Pages). */
export function componentSections(): ShellNavSection[] {
  return GROUPS.flatMap((group) => {
    const docs = DOCS.filter((d) => d.group === group);
    return docs.length
      ? [{ label: group, icon: GROUP_ICON[group], items: docs.map((d) => ({ id: d.id, label: d.title, icon: GROUP_ICON[group] ?? "box", href: `/components/${d.id}/` })) }]
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
  footer,
  mobileTabIds,
  primaryCta,
  children,
}: {
  productName: string;
  logoIcon?: IconName;
  /** Sections shown above the component groups (e.g. Introduction, Foundations). */
  sections?: ShellNavSection[];
  footer?: (state: { collapsed: boolean }) => React.ReactNode;
  mobileTabIds?: string[];
  primaryCta?: React.ComponentProps<typeof AppShell>["primaryCta"];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AppShell
      productName={productName}
      logoIcon={logoIcon}
      sections={[...sections, ...componentSections()]}
      activeId={activeFromPath(pathname)}
      footer={footer}
      mobileTabIds={mobileTabIds}
      primaryCta={primaryCta}
    >
      {/* w-full: an auto-margin flex item would size to its widest demo and push the page past a phone screen */}
      <div className="@container w-full min-w-0 space-y-8">{children}</div>
    </AppShell>
  );
}
