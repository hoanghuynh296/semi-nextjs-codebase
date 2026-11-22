"use client";

// PREVIEW (#94 L5-L8, L18): the collapsible shell of the Magnific study on the C-030 panel scale.
// - lg+: sidebar with labels <-> icon rail (toggle by the logo); accent Create on top, main nav, divider, pinned items,
//   utilities at the bottom; active = tonal fill.
// - md (iPad): always the icon rail, no hamburger.
// - < md (phone): top bar with a menu button; a full-screen drawer with the same groups, drill-down rows (›) and the
//   utilities at the bottom.
// - A nav item with `mega` opens a flyout of columns by category (small uppercase headers, New badges, See all).
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "../Icon";
import { Menu, type MenuItem } from "../Overlay";
import { useDialog } from "../a11y";
import { cn } from "../../styles/utils";

export interface RailNavChild {
  id: string;
  label: string;
  href?: string;
  icon?: IconName;
}

export interface MegaColumn {
  title: string;
  items: { id: string; label: string; icon: IconName; href?: string; isNew?: boolean; hint?: string }[];
}

export interface RailNavItem {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  /** Sub-views: shown under the item when it is active (expanded sidebar) and as a drill-down on phones. */
  children?: RailNavChild[];
  /** Opens a mega menu flyout in place of navigating. */
  mega?: { columns: MegaColumn[]; seeAll?: { label: string; href: string } };
  /** A short count on the right (neutral). */
  badge?: string;
  /** Acts in place (theme, help) instead of navigating. */
  onClick?: () => void;
}

export interface RailShellProps {
  productName: string;
  logoIcon?: IconName;
  /** The accent Create button on top; its items open in a menu. */
  create?: { label: string; items: MenuItem[] };
  nav: RailNavItem[];
  /** Pinned items under a divider (saved views, frequent records). */
  pinned?: { label: string; items: RailNavItem[] };
  /** Utilities at the bottom (help, theme, more). */
  utilities?: RailNavItem[];
  activeId: string;
  /** Collapsed to the icon rail (lg+). Controlled when given. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Open the mega menu of this item id (controlled, for previews and deep links). */
  megaOpenId?: string | null;
  onMegaOpenChange?: (id: string | null) => void;
  /** Phone drawer open (controlled, optional). */
  drawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  /** Phone top bar: the search button (usually opens the CommandPalette). */
  onSearch?: () => void;
  /** Bottom of the sidebar (account). Receives `{ collapsed }`. */
  account?: (state: { collapsed: boolean }) => React.ReactNode;
  children: React.ReactNode;
}

const ROW =
  "flex items-center gap-2.5 h-9 rounded-control px-2.5 text-label font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-focus";
const ROW_IDLE = "text-body hover:text-contrast hover:bg-tint";
const ROW_ON = "bg-tint-hover text-contrast";
const ICON_BUTTON =
  "w-10 h-10 rounded-control flex items-center justify-center text-contrast hover:bg-tint outline-none focus-visible:ring-2 focus-visible:ring-focus";

export function RailShell({
  productName,
  logoIcon = "sparkles",
  create,
  nav,
  pinned,
  utilities = [],
  activeId,
  collapsed: collapsedProp,
  onCollapsedChange,
  megaOpenId: megaProp,
  onMegaOpenChange,
  drawerOpen: drawerProp,
  onDrawerOpenChange,
  onSearch,
  account,
  children,
}: RailShellProps) {
  const [collapsedState, setCollapsedState] = useState(false);
  const collapsed = collapsedProp ?? collapsedState;
  const setCollapsed = (v: boolean) => (onCollapsedChange ? onCollapsedChange(v) : setCollapsedState(v));
  const [megaState, setMegaState] = useState<string | null>(null);
  const megaId = megaProp !== undefined ? megaProp : megaState;
  const setMega = (v: string | null) => (onMegaOpenChange ? onMegaOpenChange(v) : setMegaState(v));
  const [drawerState, setDrawerState] = useState(false);
  const drawerOpen = drawerProp ?? drawerState;
  const setDrawer = (v: boolean) => (onDrawerOpenChange ? onDrawerOpenChange(v) : setDrawerState(v));

  const all = [...nav, ...(pinned?.items ?? [])];
  const megaItem = all.find((i) => i.id === megaId && i.mega);
  const isActive = (it: RailNavItem) => it.id === activeId || !!it.children?.some((c) => c.id === activeId);

  // The rail shows icons only: lg+ shows labels unless collapsed; md is always the rail.
  const label = collapsed ? "hidden" : "hidden lg:block";
  const rowLayout = collapsed
    ? "justify-center px-0 w-9 mx-auto"
    : "justify-center px-0 w-9 mx-auto lg:w-auto lg:mx-0 lg:justify-start lg:px-2.5";

  const renderItem = (it: RailNavItem) => {
    const active = isActive(it);
    const body = (
      <>
        <Icon name={it.icon} className="w-[18px] h-[18px] shrink-0" />
        <span className={cn(label, "flex-1 min-w-0 truncate text-left")}>{it.label}</span>
        {it.badge && <span className={cn(label, "text-caption text-muted tabular-nums")}>{it.badge}</span>}
        {it.mega && <Icon name="chevron" className={cn(label, "w-3.5 h-3.5 text-muted")} />}
      </>
    );
    const cls = cn(ROW, rowLayout, active || megaId === it.id ? ROW_ON : ROW_IDLE);
    const title = collapsed ? it.label : undefined;
    const node =
      it.mega || it.onClick || !it.href ? (
        <button
          type="button"
          className={cn(cls, "lg:w-full")}
          title={title}
          aria-label={it.label}
          aria-expanded={it.mega ? megaId === it.id : undefined}
          onClick={() => (it.mega ? setMega(megaId === it.id ? null : it.id) : it.onClick?.())}
        >
          {body}
        </button>
      ) : (
        <Link href={it.href} className={cls} title={title} aria-label={it.label} aria-current={active ? "page" : undefined}>
          {body}
        </Link>
      );
    return (
      <li key={it.id}>
        {node}
        {active && it.children && !collapsed && (
          <ul className="hidden lg:flex flex-col gap-0.5 mt-0.5 ml-4 pl-3 border-l border-divider">
            {it.children.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.href ?? "#"}
                  aria-current={c.id === activeId ? "page" : undefined}
                  className={cn(ROW, "h-8", c.id === activeId ? ROW_ON : "text-muted hover:text-contrast hover:bg-tint")}
                >
                  {c.icon && <Icon name={c.icon} className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-dvh md:h-dvh flex flex-col md:flex-row bg-panel-0 md:p-2 md:gap-2 text-body">
      {/* Sidebar (md+) */}
      <aside
        className={cn(
          "hidden md:flex relative flex-col shrink-0 bg-panel-4 rounded-panel py-3 px-2 gap-3 transition-[width] duration-200",
          collapsed ? "w-[60px]" : "w-[60px] lg:w-60",
        )}
        aria-label={productName}
      >
        <div className={cn("flex items-center gap-2 h-9", collapsed ? "justify-center" : "justify-center lg:justify-between lg:px-1")}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            className="flex items-center gap-2 min-w-0 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <span className="w-8 h-8 rounded-control bg-inverted text-on-inverted flex items-center justify-center shrink-0">
              <Icon name={logoIcon} className="w-4 h-4" />
            </span>
            <span className={cn(label, "text-ui font-semibold text-contrast font-title truncate")}>{productName}</span>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Thu gọn menu"
            title="Thu gọn menu"
            className={cn(collapsed ? "hidden" : "hidden lg:flex", "w-7 h-7 items-center justify-center rounded-control text-muted hover:text-contrast hover:bg-tint")}
          >
            <Icon name="sidebar" className="w-4 h-4" />
          </button>
        </div>

        {create && (
          <Menu
            align="left"
            items={create.items}
            label={create.label}
            trigger={
              <button
                type="button"
                aria-label={create.label}
                className={cn(
                  "flex items-center justify-center gap-2 h-9 rounded-control bg-accent text-on-accent hover:bg-accent-hover text-label font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  collapsed ? "w-9 mx-auto" : "w-9 mx-auto lg:w-full lg:mx-0",
                )}
              >
                <Icon name="plus" className="w-4 h-4" />
                <span className={label}>{create.label}</span>
              </button>
            }
          />
        )}

        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-3" aria-label="Menu chính">
          <ul className="flex flex-col gap-0.5">{nav.map(renderItem)}</ul>
          {pinned && pinned.items.length > 0 && (
            <div className="flex flex-col gap-1 pt-3 border-t border-divider">
              <div className={cn(label, "px-2.5 text-caption font-semibold uppercase tracking-wide text-muted")}>{pinned.label}</div>
              <ul className="flex flex-col gap-0.5">{pinned.items.map(renderItem)}</ul>
            </div>
          )}
        </nav>

        <ul className="flex flex-col gap-0.5 pt-2 border-t border-divider">{utilities.map(renderItem)}</ul>
        {account?.({ collapsed })}

        {megaItem?.mega && <MegaMenu item={megaItem} onClose={() => setMega(null)} />}
      </aside>

      {/* Phone top bar */}
      <div className="md:hidden sticky top-0 z-sticky flex items-center gap-2 h-14 px-2 bg-panel-2">
        <button type="button" onClick={() => setDrawer(true)} aria-label="Mở menu" className={ICON_BUTTON}>
          <Icon name="menu" className="w-5 h-5" />
        </button>
        <span className="w-7 h-7 rounded-control bg-inverted text-on-inverted flex items-center justify-center">
          <Icon name={logoIcon} className="w-3.5 h-3.5" />
        </span>
        <span className="text-ui font-semibold text-contrast font-title flex-1 truncate">{productName}</span>
        {onSearch && (
          <button type="button" onClick={onSearch} aria-label="Tìm hoặc tạo" className={ICON_BUTTON}>
            <Icon name="search" className="w-5 h-5" />
          </button>
        )}
      </div>

      <main className="flex-1 min-w-0 md:min-h-0 bg-panel-2 md:rounded-panel md:overflow-y-auto relative" id="main" data-scroll-root>
        {children}
      </main>

      {drawerOpen && (
        <PhoneDrawer
          productName={productName}
          logoIcon={logoIcon}
          create={create}
          nav={nav}
          pinned={pinned}
          utilities={utilities}
          activeId={activeId}
          onClose={() => setDrawer(false)}
        />
      )}
    </div>
  );
}

/** L8: the flyout of a mega menu item: columns by category, small uppercase headers, New badges, See all. */
export function MegaMenu({ item, onClose }: { item: RailNavItem; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("aside")) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);
  if (!item.mega) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={item.label}
      className="absolute left-full top-2 ml-2 z-popover w-[min(760px,calc(100vw-120px))] bg-panel-4 rounded-panel shadow-overlay border border-line p-5"
    >
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${item.mega.columns.length}, minmax(0, 1fr))` }}>
        {item.mega.columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-0.5 min-w-0">
            <div className="px-2 pb-1 text-caption font-semibold uppercase tracking-wide text-muted">{col.title}</div>
            {col.items.map((it) => (
              <Link
                key={it.id}
                href={it.href ?? "#"}
                onClick={onClose}
                className="flex items-start gap-2.5 rounded-control px-2 py-2 hover:bg-tint outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <Icon name={it.icon} className="w-4 h-4 mt-0.5 text-muted shrink-0" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-label font-medium text-contrast">
                    <span className="truncate">{it.label}</span>
                    {it.isNew && <span className="h-4 px-1.5 rounded-full bg-accent-subtle text-accent-fg text-caption font-semibold leading-4">Mới</span>}
                  </span>
                  {it.hint && <span className="block text-caption text-muted truncate">{it.hint}</span>}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
      {item.mega.seeAll && (
        <div className="mt-4 pt-3 border-t border-divider flex justify-end">
          <Link href={item.mega.seeAll.href} className="inline-flex items-center gap-1 text-label font-medium text-accent-fg hover:underline">
            {item.mega.seeAll.label}
            <Icon name="arrowRight" className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/** L7: phone full-screen drawer with drill-down rows and the utilities at the bottom. */
function PhoneDrawer({
  productName,
  logoIcon,
  create,
  nav,
  pinned,
  utilities,
  activeId,
  onClose,
}: Pick<RailShellProps, "productName" | "logoIcon" | "create" | "nav" | "pinned" | "utilities" | "activeId"> & { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState<RailNavItem | null>(null);
  useDialog(ref, true, onClose);
  const row =
    "w-full flex items-center gap-3 min-h-12 px-3 rounded-control text-ui font-medium text-contrast hover:bg-tint outline-none focus-visible:ring-2 focus-visible:ring-focus";
  const subOf = (it: RailNavItem): RailNavChild[] =>
    it.children ?? it.mega?.columns.flatMap((c) => c.items.map((i) => ({ id: i.id, label: i.label, href: i.href, icon: i.icon }))) ?? [];
  const renderRow = (it: RailNavItem) => (
    <li key={it.id}>
      {subOf(it).length > 0 ? (
        <button type="button" className={cn(row, isOn(it) && "bg-tint-hover")} onClick={() => setLevel(it)}>
          <Icon name={it.icon} className="w-5 h-5 text-muted" />
          <span className="flex-1 text-left">{it.label}</span>
          <Icon name="chevron" className="w-4 h-4 text-muted" />
        </button>
      ) : it.onClick || !it.href ? (
        <button type="button" className={row} onClick={it.onClick}>
          <Icon name={it.icon} className="w-5 h-5 text-muted" />
          <span className="flex-1 text-left">{it.label}</span>
        </button>
      ) : (
        <Link href={it.href} onClick={onClose} className={cn(row, isOn(it) && "bg-tint-hover")} aria-current={isOn(it) ? "page" : undefined}>
          <Icon name={it.icon} className="w-5 h-5 text-muted" />
          <span className="flex-1">{it.label}</span>
        </Link>
      )}
    </li>
  );
  function isOn(it: RailNavItem) {
    return it.id === activeId || !!it.children?.some((c) => c.id === activeId);
  }
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-drawer bg-panel-4 flex flex-col">
      <div className="flex items-center gap-2 h-14 px-2 shrink-0">
        {level ? (
          <button type="button" onClick={() => setLevel(null)} className="flex items-center gap-2 h-10 px-2 rounded-control text-ui font-semibold text-contrast hover:bg-tint">
            <Icon name="back" className="w-5 h-5" />
            {level.label}
          </button>
        ) : (
          <span className="flex items-center gap-2 px-2">
            <span className="w-7 h-7 rounded-control bg-inverted text-on-inverted flex items-center justify-center">
              <Icon name={logoIcon ?? "sparkles"} className="w-3.5 h-3.5" />
            </span>
            <span className="text-ui font-semibold text-contrast font-title">{productName}</span>
          </span>
        )}
        <button type="button" onClick={onClose} aria-label="Đóng menu" className={cn(ICON_BUTTON, "ml-auto")}>
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col gap-4">
        {level ? (
          <ul className="flex flex-col gap-0.5">
            {subOf(level).map((c) => (
              <li key={c.id}>
                <Link href={c.href ?? "#"} onClick={onClose} className={cn(row, c.id === activeId && "bg-tint-hover")}>
                  {c.icon && <Icon name={c.icon} className="w-5 h-5 text-muted" />}
                  <span className="flex-1">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <>
            {create && (
              <div className="grid grid-cols-2 gap-2 px-1">
                {create.items.slice(0, 4).map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onClose();
                      c.onSelect();
                    }}
                    className="flex items-center gap-2 h-11 px-3 rounded-control bg-tint text-label font-medium text-contrast hover:bg-tint-hover"
                  >
                    {c.icon && <Icon name={c.icon} className="w-4 h-4 text-muted" />}
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
            <ul className="flex flex-col gap-0.5">{nav.map(renderRow)}</ul>
            {pinned && pinned.items.length > 0 && (
              <div>
                <div className="px-3 pb-1 text-caption font-semibold uppercase tracking-wide text-muted">{pinned.label}</div>
                <ul className="flex flex-col gap-0.5">{pinned.items.map(renderRow)}</ul>
              </div>
            )}
          </>
        )}
      </div>
      {!level && utilities && utilities.length > 0 && (
        <ul className="shrink-0 grid grid-flow-col auto-cols-fr gap-1 p-2 border-t border-divider pb-[max(8px,env(safe-area-inset-bottom))]">
          {utilities.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={u.onClick}
                className="w-full flex flex-col items-center gap-1 py-2 rounded-control text-caption text-muted hover:text-contrast hover:bg-tint"
              >
                <Icon name={u.icon} className="w-5 h-5" />
                {u.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** L18: minimal page header. Breadcrumb (or title) left; one text link and one primary action right. */
export function MinimalHeader({
  left,
  link,
  primary,
  className,
}: {
  left: React.ReactNode;
  link?: React.ReactNode;
  primary?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center gap-3 min-h-12 px-4 sm:px-6 pt-3", className)}>
      <div className="flex-1 min-w-0">{left}</div>
      {link && <div className="hidden sm:block shrink-0 text-label font-medium">{link}</div>}
      {primary && <div className="shrink-0">{primary}</div>}
    </header>
  );
}

/** L19: large text tabs as the page heading: active bright, others dim, no tab chrome. */
export function TextTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: { key: T; label: string; href?: string }[];
  value: T;
  onChange?: (key: T) => void;
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
}) {
  return (
    <h1 className={cn("m-0", className)}>
      <span role="tablist" aria-label={label} className="flex items-baseline gap-x-5 gap-y-1 flex-wrap">
        {items.map((it) => {
          const on = it.key === value;
          const cls = cn(
            "text-title-lg sm:text-heading font-title font-semibold tracking-tight transition outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-control",
            on ? "text-contrast" : "text-muted hover:text-body",
          );
          return it.href ? (
            <Link key={it.key} href={it.href} role="tab" aria-selected={on} className={cls} onClick={() => onChange?.(it.key)}>
              {it.label}
            </Link>
          ) : (
            <button key={it.key} type="button" role="tab" aria-selected={on} className={cls} onClick={() => onChange?.(it.key)}>
              {it.label}
            </button>
          );
        })}
      </span>
    </h1>
  );
}
