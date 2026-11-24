"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppShell, type AppShellProps, type ShellNavSection, type ShellSlot, type ShellSlotState } from "../src/AppShell";
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

const COMPACT: ShellSlotState = { collapsed: true, rail: true };

/**
 * The docs frame shared by the Semi docs and every brand preview: AppShell with the caller's own sections first
 * (home, foundations, brand…) and then one section per component group. The active item follows the URL; the route
 * header shows the group and the page, and `actions` (theme, version) on its right.
 */
export function DocsShell({
  productName,
  logoIcon = "sparkles",
  sections = [],
  actions,
  tools,
  account,
  footer,
  primaryCta,
  children,
}: {
  productName: string;
  logoIcon?: IconName;
  /** Sections shown above the component groups (e.g. Introduction, Foundations). */
  sections?: ShellNavSection[];
  /** The route header's right side (theme switch, version): AppShell `header.actions`. */
  actions?: ShellSlot;
  /** The nav's bottom row: AppShell `tools`. */
  tools?: AppShellProps["tools"];
  /**
   * @deprecated Since 1.0: the nav has no account block; use `actions`. Still rendered, in its compact form
   * (`{ collapsed: true, rail: true }`), on the right of the route header.
   */
  account?: ShellSlot;
  /** @deprecated Since 0.36: use `actions` (see `account`). */
  footer?: ShellSlot;
  /** @deprecated Since 0.36: phones use AppShell's drawer; ignored. */
  mobileTabIds?: string[];
  primaryCta?: AppShellProps["primaryCta"];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const legacy = account ?? footer;
  // 0.x took a node or a render function: an element is shown as it is, a function gets the compact state.
  const legacyActions: ShellSlot | undefined =
    legacy === undefined || legacy === null ? undefined : typeof legacy === "function" ? () => legacy(COMPACT) : legacy;
  return (
    <AppShell
      productName={productName}
      logoIcon={logoIcon}
      sections={[...sections, ...componentSections()]}
      activeId={activeFromPath(pathname)}
      tools={tools}
      primaryCta={primaryCta}
      header={{ actions: actions ?? legacyActions }}
    >
      {/* w-full: an auto-margin flex item would size to its widest demo and push the page past a phone screen */}
      <div className="@container w-full min-w-0 space-y-8">{children}</div>
    </AppShell>
  );
}
