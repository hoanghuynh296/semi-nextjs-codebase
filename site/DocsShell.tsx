"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, useAppShell, type AppShellProps, type ShellNavSection, type ShellSlot, type ShellSlotState } from "../src/AppShell";
import { CommandDialog, useHotkey, type CommandItem } from "../src/Command";
import { Icon, type IconName } from "../src/Icon";
import { ICON_CATALOG } from "../src/iconCatalog";
import { Kbd } from "../src/Kbd";
import { Tooltip } from "../src/Overlay";
import { DOCS, GROUPS } from "../examples/registry.generated";
import { cn, FOCUS_RING } from "../styles/utils";

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

const PAGE_KEYWORDS: Record<string, string[]> = {
  home: ["giới thiệu", "introduction", "home", "cài đặt", "install", "agent"],
  components: ["component", "tất cả", "gallery", "all", "danh sách"],
  foundations: ["foundations", "tokens", "surfaces", "bề mặt", "typography", "thang chữ", "shape", "hình khối", "màu"],
  icons: ["icons", "icon", "svg", "biểu tượng", "catalog", "registry", "lucide"],
  brand: ["brand", "thương hiệu", "preview", "kit"],
  lab: ["lab", "design lab", "thử nghiệm", "tune"],
};

/** Menu sections of every component doc, by group (hrefs with a trailing slash: static export + GitHub Pages). */
export function componentSections(): ShellNavSection[] {
  return GROUPS.flatMap((group) => {
    const docs = DOCS.filter((d) => d.group === group);
    return docs.length
      ? [{ label: group, icon: GROUP_ICON[group], collapsible: true, defaultOpen: false, items: docs.map((d) => ({ id: d.id, label: d.title, href: `/components/${d.id}/` })) }]
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

/** Sticky bottom trigger in the nav panel (adapts to the 72px rail and phone drawer). */
function NavCommandTrigger({ onOpen, hotkeyEnabled }: { onOpen: () => void; hotkeyEnabled: boolean }) {
  const { rail } = useAppShell();
  return (
    <Tooltip content={rail ? "Tìm nhanh (⌘K)" : null} side="right">
      <button
        type="button"
        onClick={onOpen}
        aria-keyshortcuts={hotkeyEnabled ? "Meta+K Control+K" : undefined}
        className={cn(
          "w-full h-9 md:h-8 px-2.5 md:px-2 rounded-control bg-field border border-field-line text-muted hover:text-strong hover:bg-item-hover flex items-center gap-2 text-chrome font-medium transition-hover cursor-pointer",
          FOCUS_RING,
          "@max-[120px]/nav:w-8 @max-[120px]/nav:px-0 @max-[120px]/nav:justify-center",
        )}
      >
        <Icon name="search" className="w-4 h-4 shrink-0" />
        <span className="flex-1 min-w-0 truncate text-left @max-[120px]/nav:sr-only">Tìm nhanh</span>
        <span aria-hidden className="max-md:hidden @max-[120px]/nav:hidden shrink-0">
          <Kbd>⌘K</Kbd>
        </span>
      </button>
    </Tooltip>
  );
}

const COMPACT: ShellSlotState = { collapsed: true, rail: true };

/**
 * The docs frame shared by the Semi docs and every brand preview: AppShell with the caller's own sections first
 * (home, foundations, brand…) and then one section per component group. The active item follows the URL; the route
 * header shows the group and the page, and `actions` (theme, version) on its right. Global search opens a
 * `CommandDialog` from the pinned bottom trigger in the nav bar (or ⌘K / Ctrl+K).
 */
export function DocsShell({
  productName,
  logoIcon = "sparkles",
  sections = [],
  actions,
  tools,
  account,
  footer,
  mainAction,
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
  /** The nav's one main action (brand primary fill): AppShell `mainAction`. */
  mainAction?: AppShellProps["mainAction"];
  primaryCta?: AppShellProps["primaryCta"];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = activeFromPath(pathname);
  // Let /components/command/'s own CommandPalette demo keep ⌘K; the bottom nav trigger still opens DocsShell search.
  const onCommandDoc = activeId === "command";
  const [searchOpen, setSearchOpen] = useState(false);

  useHotkey(() => {
    if (!onCommandDoc) setSearchOpen((v) => !v);
  }, onCommandDoc ? "\u0000" : "k");

  const searchItems = useMemo<CommandItem[]>(() => {
    const hasIconsPage = sections.some((s) => s.items.some((i) => i.href === "/icons/" || i.id === "icons"));

    const pages: CommandItem[] = sections.flatMap((s) =>
      s.items
        .filter((i): i is typeof i & { href: string } => Boolean(i.href))
        .map((i) => ({
          id: `page:${i.id}`,
          label: i.label,
          group: "Trang",
          icon: i.icon ?? "file",
          href: i.href,
          keywords: [i.id, i.shortLabel ?? "", ...(PAGE_KEYWORDS[i.id] ?? [])].filter(Boolean),
          onSelect: () => router.push(i.href),
        })),
    );

    const components: CommandItem[] = DOCS.map((d) => ({
      id: `doc:${d.id}`,
      label: d.title,
      hint: d.group,
      group: "Component",
      icon: GROUP_ICON[d.group] ?? "box",
      href: `/components/${d.id}/`,
      keywords: [d.id, d.group, ...d.components, d.description].filter(Boolean),
      onSelect: () => router.push(`/components/${d.id}/`),
    }));

    const icons: CommandItem[] = hasIconsPage
      ? Object.entries(ICON_CATALOG).map(([name, meta]) => ({
          id: `icon:${name}`,
          label: name,
          hint: meta.purpose,
          group: "Icons",
          icon: name as IconName,
          href: `/icons/?q=${encodeURIComponent(name)}`,
          keywords: [
            meta.purpose,
            ...(meta.lucideEquivalent ? [meta.lucideEquivalent] : []),
            ...meta.keywords,
            ...(meta.intents ?? []),
          ].filter(Boolean),
          onSelect: () => router.push(`/icons/?q=${encodeURIComponent(name)}`),
        }))
      : [];

    return [...pages, ...components, ...icons];
  }, [sections, router]);

  const legacy = account ?? footer;
  // 0.x took a node or a render function: an element is shown as it is, a function gets the compact state.
  const legacyActions: ShellSlot | undefined =
    legacy === undefined || legacy === null ? undefined : typeof legacy === "function" ? () => legacy(COMPACT) : legacy;

  return (
    <>
      <AppShell
        productName={productName}
        logoIcon={logoIcon}
        sections={[...sections, ...componentSections()]}
        activeId={activeId}
        tools={tools}
        mainAction={mainAction}
        primaryCta={primaryCta}
        navFooter={<NavCommandTrigger onOpen={() => setSearchOpen(true)} hotkeyEnabled={!onCommandDoc} />}
        header={{ actions: actions ?? legacyActions }}
      >
        {/* w-full: an auto-margin flex item would size to its widest demo and push the page past a phone screen */}
        <div className="@container w-full min-w-0 space-y-8">{children}</div>
      </AppShell>
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={searchItems}
        placeholder="Tìm trang, component, icon…"
      />
    </>
  );
}
