"use client";

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, type AppShellProps, type ShellNavSection, type ShellSlot, type ShellSlotState } from "../src/AppShell";
import { Button } from "../src/Button";
import { Input } from "../src/Field";
import { Icon, type IconName } from "../src/Icon";
import { ICON_CATALOG } from "../src/iconCatalog";
import { DOCS, GROUPS } from "../examples/registry.generated";
import { cn } from "../styles/utils";

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

interface SearchHit {
  id: string;
  label: string;
  meta: string;
  href: string;
  icon: IconName;
  score: number;
}

function NavQuickSearch({ sections }: { sections: ShellNavSection[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const listId = useId();

  const hasIconsPage = useMemo(
    () => sections.some((s) => s.items.some((i) => i.href === "/icons/" || i.id === "icons")),
    [sections],
  );

  const pageEntries = useMemo(
    () =>
      sections.flatMap((s) =>
        s.items
          .filter((i): i is typeof i & { href: string } => Boolean(i.href))
          .map((i) => ({
            id: `page:${i.id}`,
            label: i.label,
            meta: s.label ?? "Trang",
            href: i.href,
            icon: i.icon ?? "file",
            haystack: [i.id, i.label, i.shortLabel ?? "", ...(PAGE_KEYWORDS[i.id] ?? [])].join(" ").toLowerCase(),
          })),
      ),
    [sections],
  );

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchHit[] = [];

    for (const p of pageEntries) {
      const labelLow = p.label.toLowerCase();
      if (labelLow === q) {
        matches.push({ id: p.id, label: p.label, meta: p.meta, href: p.href, icon: p.icon, score: 120 });
      } else if (labelLow.startsWith(q)) {
        matches.push({ id: p.id, label: p.label, meta: p.meta, href: p.href, icon: p.icon, score: 105 });
      } else if (p.haystack.includes(q)) {
        matches.push({ id: p.id, label: p.label, meta: p.meta, href: p.href, icon: p.icon, score: 85 });
      }
    }

    for (const d of DOCS) {
      const titleLow = d.title.toLowerCase();
      const idLow = d.id.toLowerCase();
      const compsLow = d.components.map((c) => c.toLowerCase());
      let score = 0;
      if (titleLow === q || idLow === q || compsLow.includes(q)) score = 115;
      else if (titleLow.startsWith(q) || idLow.startsWith(q) || compsLow.some((c) => c.startsWith(q))) score = 100;
      else if (titleLow.includes(q) || idLow.includes(q) || compsLow.some((c) => c.includes(q))) score = 80;
      else if (d.group.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) score = 60;
      if (score > 0) {
        matches.push({
          id: `doc:${d.id}`,
          label: d.title,
          meta: d.group,
          href: `/components/${d.id}/`,
          icon: GROUP_ICON[d.group] ?? "box",
          score,
        });
      }
    }

    if (hasIconsPage) {
      for (const [name, meta] of Object.entries(ICON_CATALOG)) {
        const nameLow = name.toLowerCase();
        const lucideLow = meta.lucideEquivalent?.toLowerCase() ?? "";
        let score = 0;
        if (nameLow === q || lucideLow === q) score = 95;
        else if (nameLow.startsWith(q) || lucideLow.startsWith(q)) score = 75;
        else if (
          nameLow.includes(q) ||
          lucideLow.includes(q) ||
          meta.purpose.toLowerCase().includes(q) ||
          meta.keywords.some((k) => k.toLowerCase().includes(q)) ||
          meta.intents?.some((i) => i.toLowerCase().includes(q))
        ) {
          score = 50;
        }
        if (score > 0) {
          matches.push({
            id: `icon:${name}`,
            label: name,
            meta: "Icon",
            href: `/icons/?q=${encodeURIComponent(name)}`,
            icon: name as IconName,
            score,
          });
        }
      }
    }

    return matches.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, 10);
  }, [query, pageEntries, hasIconsPage]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const showDropdown = open && query.trim().length > 0;

  useLayoutEffect(() => {
    if (!showDropdown) {
      setDropdownRect(null);
      return;
    }
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showDropdown]);
  const clampedIndex = hits.length > 0 ? Math.min(activeIndex, hits.length - 1) : -1;
  const activeOptionId = showDropdown && clampedIndex >= 0 ? `${listId}-opt-${clampedIndex}` : undefined;

  const selectHit = (hit: SearchHit) => {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Escape") {
      if (showDropdown) {
        e.preventDefault();
        setOpen(false);
      } else if (query) {
        e.preventDefault();
        setQuery("");
      }
      return;
    }
    if (!showDropdown || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter" && clampedIndex >= 0) {
      e.preventDefault();
      const opt = activeOptionId ? document.getElementById(activeOptionId) : null;
      if (opt instanceof HTMLElement) {
        opt.click();
      } else {
        selectHit(hits[clampedIndex]);
      }
    }
  };

  const dropdown =
    showDropdown && dropdownRect && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Kết quả tìm kiếm"
            style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
            className="fixed z-popover rounded-card bg-panel border border-line shadow-card max-h-72 overflow-y-auto p-1"
          >
            {hits.length === 0 ? (
              <div className="px-2 py-2 text-chrome text-muted">Không tìm thấy kết quả</div>
            ) : (
              hits.map((hit, idx) => {
                const active = idx === clampedIndex;
                return (
                  <Link
                    key={hit.id}
                    id={`${listId}-opt-${idx}`}
                    href={hit.href}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full min-h-8 flex items-center gap-2 px-2 py-1.5 rounded-control text-left text-chrome transition-hover",
                      active ? "bg-item-selected text-strong" : "text-body hover:bg-item-hover hover:text-strong",
                    )}
                  >
                    <Icon name={hit.icon} className="w-3.5 h-3.5 shrink-0 text-muted" />
                    <span className="flex-1 min-w-0 truncate font-medium">{hit.label}</span>
                    <span className="shrink-0 text-muted">{hit.meta}</span>
                  </Link>
                );
              })
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative w-72 lg:w-80 max-w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          icon="search"
          type="text"
          role="combobox"
          aria-label="Tìm nhanh tài liệu"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Tìm nhanh..."
          className="h-8 py-1 pr-7 text-chrome"
        />
        {query && (
          <Button
            iconOnly
            icon="close"
            size="sm"
            variant="ghost"
            aria-label="Xoá từ khoá"
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-7 h-7 px-0"
          />
        )}
      </div>

      {dropdown}
    </div>
  );
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
      mainAction={mainAction}
      primaryCta={primaryCta}
      header={{ middle: <NavQuickSearch sections={sections} />, actions: actions ?? legacyActions }}
    >
      {/* w-full: an auto-margin flex item would size to its widest demo and push the page past a phone screen */}
      <div className="@container w-full min-w-0 space-y-8">{children}</div>
    </AppShell>
  );
}
