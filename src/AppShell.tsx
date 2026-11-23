"use client";

// 2-panel floating Bento shell of the Semi Design System (docs/DESIGN_SYSTEM.md §4), after the #94 study (C-031/C-032):
// - Outer bg-canvas frame with md:p-2 md:gap-2; the sidebar (bg-panel) and the content panel (bg-app) separate by tone
// - Sidebar from top to bottom: brand + collapse toggle, the accent Create action, the main nav (sections), a pinned
//   group (text-overline label), then the utilities and the account at the bottom
// - lg+: labels (w-60) or the icon rail (w-[60px], remembered in localStorage); md (iPad): always the rail. Rail items
//   show their name in a Tooltip on the right
// - A nav item with `mega` opens a MegaMenu flyout beside the sidebar
// - Phones (< md): a top bar with the menu button opens a full-screen drawer with the same groups, drill-down rows (›)
//   for sub-items and mega menus, and the utilities at the bottom. `mobileNav="tabs"` keeps the MobileTabBar
//   (`mobileTabIds` picks its items)
// - Sub-items (`children`) open under their parent only while the parent or one of them is active
import React, { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSemiLocale } from "./locale";
import { Icon, type IconName } from "./Icon";
import { MegaMenu, type MegaMenuContent } from "./MegaMenu";
import { MobileTabBar, TAB_BAR_PAD, type MobileTabItem } from "./MobileTabBar";
import { Menu, Tooltip, type MenuItem } from "./Overlay";
import { PageActionsProvider, PageActionsSlot } from "./PageActions";
import { useDialog } from "./a11y";
import { SHELL_ASIDE, SHELL_CONTAINER, SHELL_MAIN, SHELL_OUTER } from "../styles/surfaces";
import { cn, FOCUS_RING } from "../styles/utils";

/** A sub-item under a nav item (a mailbox folder, a saved view). Neutral like the menu: no colour, no count (§4). */
export interface ShellNavChild {
  id: string;
  label: string;
  href?: string;
  /** Optional grey icon before the label (`w-3.5 h-3.5`); give all sub-items of a parent one, or none. */
  icon?: IconName;
}

export interface ShellNavItem {
  id: string;
  label: string;
  /** Short name for the rail when the item has no icon (MobileTabBar too). */
  shortLabel?: string;
  icon?: IconName;
  href?: string;
  external?: boolean;
  /** Small trailing content in the expanded sidebar (a count, a button). */
  right?: React.ReactNode;
  /**
   * Sub-items. Closed by default; they open under the item while the item or one of them is the `activeId`, and
   * close again when another item is chosen. Never shown in the rail; on phones the drawer shows them as a drill-down
   * (›). Read `useAppShell()` and give the page its own way to reach them where the sidebar cannot show them.
   */
  children?: ShellNavChild[];
  /** Opens a MegaMenu flyout (category columns, New badges, See all) instead of navigating; a drill-down on phones. */
  mega?: MegaMenuContent;
  /** Acts in place (theme, help, sign out) instead of navigating: the usual kind of `utilities` item. */
  onClick?: () => void;
  /**
   * Opens a Menu of choices in place (theme, language, help links) instead of navigating: a `utilities` item with
   * options, like `useThemeUtility()`. In the rail the name stays in the Tooltip; on phones the drawer opens the items
   * as a level. `checked` items show the current choice.
   */
  menu?: MenuItem[];
}

/** The accent Create action at the top of the sidebar: a menu of things to create (`items`), or one link / action. */
export interface ShellCreate {
  label: string;
  icon?: IconName;
  /** What can be created; the button opens them in a Menu. On phones the drawer shows one Create row that opens the items as a level. */
  items?: MenuItem[];
  href?: string;
  onClick?: () => void;
}

/** A group under the main nav (saved views, frequent records), headed by a `text-overline` label. */
export interface ShellPinned {
  label: string;
  items: ShellNavItem[];
}

/** `collapsed`: the person collapsed the sidebar. `rail`: it shows icons only (collapsed, or the md width) — hide text
 * by this one. Both are false in the phone drawer. */
export interface ShellSlotState {
  collapsed: boolean;
  rail: boolean;
}

type ShellSlot = React.ReactNode | ((state: ShellSlotState) => React.ReactNode);

interface AppShellState {
  /** True when the sidebar shows sub-items (expanded sidebar, `lg` and up). False in the rail, below `lg` and on phones. */
  submenuVisible: boolean;
}

const AppShellContext = createContext<AppShellState>({ submenuVisible: false });

/** Inside `AppShell`: whether the sidebar is showing sub-items, so a page can offer its own navigation when not. */
export function useAppShell(): AppShellState {
  return useContext(AppShellContext);
}

const LG_QUERY = "(min-width: 1024px)";
const MD_QUERY = "(min-width: 768px)";

export interface ShellNavSection {
  label?: string;
  hideLabel?: boolean;
  icon?: IconName;
  right?: React.ReactNode;
  items: ShellNavItem[];
  loading?: boolean;
  loadingCount?: number;
}

export interface AppShellProps {
  /** Product title shown in the sidebar header (e.g. "3D Noobs Studio", "Auton"). */
  productName: string;
  /** Icon inside the default brand tile. */
  logoIcon?: IconName;
  /** Optional custom logo element replacing the default brand tile. */
  logo?: React.ReactNode;
  /** Navigation groups separated by thin dividers in the left panel. */
  sections: ShellNavSection[];
  /** Currently active item id (or route path). */
  activeId: string;
  /**
   * Called with the item id when an item is clicked. Items with `href` stay `next/link` links either way, so use it to
   * react to a click (close a sheet, track), not to route: give page items an `href` (`shell-nav-href`).
   */
  onSelect?: (id: string) => void;
  /** The accent Create action on top (one per app): a menu of things to create, or one link / action. */
  create?: ShellCreate;
  /** Optional highlighted launcher under Create (another app, a docs link). */
  primaryCta?: {
    label: string;
    icon: IconName;
    href?: string;
    external?: boolean;
    onClick?: () => void;
  };
  /** A group under the main nav (saved views, frequent records) with a `text-overline` label. */
  pinned?: ShellPinned;
  /** Utilities at the bottom of the sidebar (help, theme, notifications): usually items with `onClick`. */
  utilities?: ShellNavItem[];
  /** The account at the very bottom (avatar, workspace switcher). Receives `{ collapsed, rail }`: hide text when `rail`. */
  account?: ShellSlot;
  /** @deprecated Since 0.36: split into `utilities` (actions) and `account`. Rendered like `account`. */
  footer?: ShellSlot;
  /**
   * Phone navigation: `drawer` (a full-screen menu from the top bar) or `tabs` (MobileTabBar, the items in
   * `mobileTabIds`). Default: `tabs` when `mobileTabIds` is set (as before 0.36), else `drawer`.
   */
  mobileNav?: "drawer" | "tabs";
  /**
   * With `mobileNav="tabs"`: the ids of the items on the tab bar (up to 5; the rest go in its More sheet). Without
   * it, tabs mode shows the first items. Set `mobileNav` too: `mobileTabIds` alone still keeps the tab bar (as before
   * 0.36) but warns in development.
   */
  mobileTabIds?: string[];
  /** localStorage key for persisting sidebar collapsed state. */
  storageKey?: string;
  children: React.ReactNode;
  containerClassName?: string;
}

/** "Chat model picker" → "CMP", "Button" → "Bu": the initials of the words, or the first letters of a single word. */
const abbreviate = (label: string) => {
  const words = label.trim().split(/\s+/);
  return words.length > 1 ? words.map((w) => w[0]).join("").slice(0, 3).toUpperCase() : label.slice(0, 2);
};

const slot = (s: ShellSlot | undefined, state: ShellSlotState) => (typeof s === "function" ? s(state) : s);

let warned = false;

export function AppShell({
  productName,
  logoIcon = "sparkles",
  logo,
  sections,
  activeId,
  onSelect,
  create,
  primaryCta,
  pinned,
  utilities = [],
  account: accountProp,
  footer,
  mobileNav,
  mobileTabIds,
  storageKey = "semi_sidebar_collapsed",
  children,
  containerClassName = "",
}: AppShellProps) {
  const t = useSemiLocale();
  const account = accountProp ?? footer;
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaId, setMegaId] = useState<string | null>(null);
  const [wide, setWide] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const megaTrigger = useRef<HTMLElement | null>(null);
  const asideId = useId();

  useEffect(() => {
    if (warned || process.env.NODE_ENV === "production") return;
    // mobileTabIds with mobileNav="tabs" is the supported way to pick the tabs (#113): only the implicit case warns
    if (footer !== undefined || (mobileTabIds && mobileNav !== "tabs")) {
      warned = true;
      console.warn(
        "[@semi/ui] AppShell: " +
          [
            footer !== undefined && "`footer` is deprecated: use `utilities` (actions) and `account`.",
            mobileTabIds &&
              (mobileNav === "drawer"
                ? '`mobileTabIds` is ignored with mobileNav="drawer": remove it.'
                : '`mobileTabIds` without `mobileNav`: add mobileNav="tabs" to keep the tab bar on purpose, or remove mobileTabIds for the phone drawer.'),
          ]
            .filter(Boolean)
            .join(" "),
      );
    }
  }, [footer, mobileTabIds, mobileNav]);

  useEffect(() => {
    const lg = window.matchMedia(LG_QUERY);
    const md = window.matchMedia(MD_QUERY);
    const update = () => {
      setWide(lg.matches);
      // the drawer belongs to phones: close it when the window grows past md
      if (md.matches) setDrawerOpen(false);
    };
    update();
    lg.addEventListener("change", update);
    md.addEventListener("change", update);
    return () => {
      lg.removeEventListener("change", update);
      md.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggleCollapsed = () => {
    setMegaId(null);
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const navItems = sections.flatMap((s) => s.items);
  const allItems = [...navItems, ...(pinned?.items ?? [])];
  const firstItem = navItems[0];
  // The top-level item that owns the active id (itself, or the parent of an active sub-item).
  const activeTopId = allItems.find((i) => i.id === activeId || i.children?.some((c) => c.id === activeId))?.id ?? activeId;
  const submenuVisible = !collapsed && wide;
  // The rail: icons only, names in tooltips (collapsed on lg+, always on md).
  const rail = collapsed || !wide;
  const megaItem = allItems.find((i) => i.id === megaId && i.mega);

  const labelHidden = collapsed ? "hidden" : "hidden lg:block";
  const rowLayout = collapsed ? "justify-center" : "justify-center lg:justify-start lg:gap-2.5 lg:px-2.5";
  const navItemClass = cn(
    "w-full h-9 flex items-center rounded-control text-label font-medium transition whitespace-nowrap cursor-pointer",
    FOCUS_RING,
    rowLayout,
  );
  const navLabelClass = cn(labelHidden, "flex-1 min-w-0 truncate text-left");
  // the narrow rail (collapsed, or below lg) shows a short name in place of the label when an item has no icon
  const navShortClass = `${collapsed ? "block" : "block lg:hidden"} text-caption font-semibold leading-none truncate max-w-full`;

  const withTip = (label: string, node: React.ReactElement, key: string) =>
    rail ? (
      <Tooltip key={key} content={label} side="right">
        {node}
      </Tooltip>
    ) : (
      node
    );

  const renderNavEntry = (item: ShellNavItem) => {
    const hasChildren = Boolean(item.children?.length);
    const open = hasChildren && activeTopId === item.id;
    // A parent whose sub-item is active reads as current but keeps the fill for the sub-item (rail: the parent is all there is).
    const active = activeId === item.id || (open && !submenuVisible) || megaId === item.id;
    const stateClass = active
      ? "bg-tint-hover text-contrast"
      : open
        ? "text-contrast hover:bg-tint"
        : "text-body hover:text-contrast hover:bg-tint";
    const expanded = hasChildren ? { "aria-expanded": open && submenuVisible } : {};
    const title = rail ? undefined : item.label;
    const inner = (
      <>
        {item.icon ? (
          <Icon name={item.icon} className="w-[18px] h-[18px] shrink-0" />
        ) : (
          <span className={navShortClass} aria-hidden>
            {item.shortLabel ?? abbreviate(item.label)}
          </span>
        )}
        <span className={navLabelClass}>{item.label}</span>
        {(hasChildren || item.mega) && !item.right && (
          <Icon name={open ? "chevronDown" : "chevron"} className={`${labelHidden} w-3.5 h-3.5 shrink-0 text-muted`} />
        )}
      </>
    );

    if (item.mega) {
      return withTip(
        item.label,
        <button
          key={item.id}
          type="button"
          aria-label={item.label}
          aria-haspopup="dialog"
          aria-expanded={megaId === item.id}
          onClick={(e) => {
            megaTrigger.current = e.currentTarget;
            setMegaId(megaId === item.id ? null : item.id);
          }}
          title={title}
          className={cn(navItemClass, stateClass)}
        >
          {inner}
        </button>,
        item.id,
      );
    }

    if (item.menu) {
      const button = (
        <button type="button" aria-label={item.label} title={title} className={cn(navItemClass, stateClass)}>
          {inner}
        </button>
      );
      return (
        <Menu
          key={item.id}
          align="left"
          label={item.label}
          items={item.menu}
          trigger={
            rail ? (
              <Tooltip content={item.label} side="right">
                {button}
              </Tooltip>
            ) : (
              button
            )
          }
        />
      );
    }

    if (item.href) {
      return withTip(
        item.label,
        <Link
          key={item.id}
          href={item.href}
          onClick={() => onSelect?.(item.id)}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          aria-current={activeId === item.id || open ? "page" : undefined}
          aria-label={rail ? item.label : undefined}
          {...expanded}
          title={title}
          className={cn(navItemClass, stateClass, "group", Boolean(item.right) && !rail && "lg:!pr-1.5")}
        >
          {inner}
          {item.right && !rail && <span className="hidden lg:flex items-center shrink-0 ml-auto">{item.right}</span>}
        </Link>,
        item.id,
      );
    }

    const onClick = () => (item.onClick ? item.onClick() : onSelect?.(item.id));

    if (item.right && !rail) {
      return (
        <div key={item.id} className={cn(navItemClass, stateClass, "group relative lg:!pr-1.5")} title={title}>
          <button
            type="button"
            onClick={onClick}
            aria-current={item.onClick ? undefined : active ? "page" : undefined}
            aria-label={rail ? item.label : undefined}
            {...expanded}
            className="flex-1 min-w-0 h-full flex items-center justify-center lg:justify-start lg:gap-2.5 text-left cursor-pointer overflow-hidden focus:outline-none"
          >
            {inner}
          </button>
          <div className="hidden lg:flex items-center shrink-0 ml-auto z-10">{item.right}</div>
        </div>
      );
    }

    return withTip(
      item.label,
      <button
        key={item.id}
        type="button"
        onClick={onClick}
        aria-current={item.onClick ? undefined : active ? "page" : undefined}
        aria-label={rail ? item.label : undefined}
        {...expanded}
        title={title}
        className={cn(navItemClass, stateClass)}
      >
        {inner}
      </button>,
      item.id,
    );
  };

  const renderChildren = (item: ShellNavItem) => {
    if (!item.children?.length || activeTopId !== item.id || !submenuVisible) return null;
    return (
      <ul aria-label={item.label} className="flex flex-col gap-0.5 ml-4 pl-2 border-l border-divider">
        {item.children.map((child) => {
          const active = activeId === child.id;
          const cls = cn(
            "w-full h-8 flex items-center gap-2 px-2.5 rounded-control text-label transition whitespace-nowrap cursor-pointer",
            FOCUS_RING,
            active ? "bg-tint-hover text-contrast font-medium" : "text-muted hover:text-contrast hover:bg-tint",
          );
          return (
            <li key={child.id}>
              {child.href ? (
                <Link href={child.href} onClick={() => onSelect?.(child.id)} aria-current={active ? "page" : undefined} title={child.label} className={cls}>
                  {child.icon && <Icon name={child.icon} className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{child.label}</span>
                </Link>
              ) : (
                <button type="button" onClick={() => onSelect?.(child.id)} aria-current={active ? "page" : undefined} title={child.label} className={cls}>
                  {child.icon && <Icon name={child.icon} className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{child.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderItems = (items: ShellNavItem[]) =>
    items.map((item) => (
      <React.Fragment key={item.id}>
        {renderNavEntry(item)}
        {renderChildren(item)}
      </React.Fragment>
    ));

  const logoTile = logo ?? (
    <span className="w-8 h-8 rounded-control bg-inverted text-on-inverted flex items-center justify-center shrink-0">
      <Icon name={logoIcon} className="w-4 h-4" />
    </span>
  );
  const brandNode = (
    <>
      {logoTile}
      <span className="hidden lg:block truncate text-ui font-semibold text-contrast tracking-tight">{productName}</span>
    </>
  );
  const brandClass = cn("min-w-0 flex items-center gap-2 text-left rounded-control", FOCUS_RING);

  const createClass = cn(
    "shrink-0 h-9 rounded-control bg-accent text-on-accent hover:bg-accent-hover flex items-center justify-center gap-2 text-label font-semibold transition active:scale-[0.99] cursor-pointer",
    FOCUS_RING,
    collapsed ? "w-9 mx-auto" : "w-9 mx-auto lg:w-full lg:mx-0",
  );
  const createInner = create && (
    <>
      <Icon name={create.icon ?? "plus"} className="w-4 h-4 shrink-0" />
      <span className={labelHidden}>{create.label}</span>
    </>
  );
  const createNode =
    create &&
    (create.items?.length ? (
      <Menu
        align="left"
        items={create.items}
        label={create.label}
        trigger={
          rail ? (
            <Tooltip content={create.label} side="right">
              <button type="button" aria-label={create.label} className={createClass}>
                {createInner}
              </button>
            </Tooltip>
          ) : (
            <button type="button" aria-label={create.label} className={createClass}>
              {createInner}
            </button>
          )
        }
      />
    ) : create.href ? (
      withTip(
        create.label,
        <Link href={create.href} aria-label={create.label} className={createClass}>
          {createInner}
        </Link>,
        "create",
      )
    ) : (
      withTip(
        create.label,
        <button type="button" onClick={create.onClick} aria-label={create.label} className={createClass}>
          {createInner}
        </button>,
        "create",
      )
    ));

  const ctaClass = cn(
    "shrink-0 w-full h-9 rounded-control bg-accent-subtle hover:bg-accent-subtle-hover border border-accent-line hover:border-accent-line text-contrast flex items-center text-label font-semibold transition active:scale-[0.99] cursor-pointer",
    FOCUS_RING,
    collapsed ? "justify-center" : "justify-center lg:justify-start lg:gap-2 lg:px-2.5",
  );
  const ctaInner = primaryCta && (
    <>
      <span className="w-5 h-5 rounded-chip bg-accent text-on-accent flex items-center justify-center shrink-0">
        <Icon name={primaryCta.icon} className="w-3.5 h-3.5" />
      </span>
      <span className={navLabelClass}>{primaryCta.label}</span>
    </>
  );

  // backward compatible: an app that set mobileTabIds keeps its tab bar; the drawer is the default only when neither is set
  const tabs = mobileNav ? mobileNav === "tabs" : Boolean(mobileTabIds);
  const pinnedItems = tabs
    ? mobileTabIds
      ? mobileTabIds.map((id) => navItems.find((i) => i.id === id)).filter((x): x is ShellNavItem => Boolean(x))
      : navItems.slice(0, navItems.length > 6 ? 5 : 6)
    : [];
  const hasMoreSheet = tabs && navItems.length > pinnedItems.length;
  const mobileTabs: MobileTabItem[] = pinnedItems.map((i) => ({ id: i.id, icon: i.icon ?? "box", title: i.label, shortTitle: i.shortLabel, href: i.href }));

  return (
    <AppShellContext.Provider value={{ submenuVisible }}>
      <PageActionsProvider>
        <div className={SHELL_OUTER}>
          {/* Left floating Bento sidebar (md+) */}
          <aside ref={asideRef} id={asideId} aria-label={productName} className={cn(SHELL_ASIDE, collapsed ? "w-[60px]" : "w-[60px] lg:w-60")}>
            <div className="shrink-0 p-2 pb-0 flex flex-col gap-2.5">
              {/* Brand + collapse toggle (the logo expands the rail) */}
              <div className={cn("h-9 flex items-center gap-2 shrink-0", collapsed ? "justify-center" : "justify-center lg:justify-between lg:pl-1")}>
                {collapsed && wide ? (
                  <Tooltip content={t.expandMenu} side="right">
                    <button type="button" onClick={toggleCollapsed} aria-label={t.expandMenu} aria-expanded={false} aria-controls={asideId} className={cn(brandClass, "cursor-pointer")}>
                      {logoTile}
                    </button>
                  </Tooltip>
                ) : firstItem?.href ? (
                  <Link href={firstItem.href} onClick={() => onSelect?.(firstItem.id)} className={brandClass} aria-label={productName}>
                    {brandNode}
                  </Link>
                ) : (
                  <button type="button" onClick={() => firstItem && onSelect?.(firstItem.id)} className={cn(brandClass, "cursor-pointer")} aria-label={productName}>
                    {brandNode}
                  </button>
                )}
                {!collapsed && (
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={t.collapseMenu}
                    aria-expanded
                    aria-controls={asideId}
                    title={t.collapseMenu}
                    className={cn("hidden lg:flex w-7 h-7 rounded-control items-center justify-center text-muted hover:text-contrast hover:bg-tint transition shrink-0 cursor-pointer", FOCUS_RING)}
                  >
                    <Icon name="sidebar" className="w-4 h-4" />
                  </button>
                )}
              </div>

              {createNode}

              {primaryCta &&
                withTip(
                  primaryCta.label,
                  primaryCta.href ? (
                    <Link
                      href={primaryCta.href}
                      target={primaryCta.external ? "_blank" : undefined}
                      rel={primaryCta.external ? "noopener noreferrer" : undefined}
                      title={rail ? undefined : primaryCta.label}
                      aria-label={rail ? primaryCta.label : undefined}
                      className={ctaClass}
                    >
                      {ctaInner}
                    </Link>
                  ) : (
                    <button type="button" onClick={primaryCta.onClick} title={rail ? undefined : primaryCta.label} aria-label={rail ? primaryCta.label : undefined} className={ctaClass}>
                      {ctaInner}
                    </button>
                  ),
                  "cta",
                )}
            </div>

            {/* Scrollable navigation: sections, then the pinned group */}
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden p-2 pt-2.5 gap-1">
              {sections.map((section, idx) => {
                if (!section.loading && (!section.items || section.items.length === 0)) return null;
                return (
                  <React.Fragment key={section.label ?? idx}>
                    {idx > 0 && <div className="my-1 mx-1.5 border-t border-divider" />}
                    {section.label && !section.hideLabel && (
                      <div className={cn(collapsed ? "hidden" : "hidden lg:flex", "group shrink-0 items-center justify-between gap-1.5 px-2.5 py-0.5 text-caption font-medium text-muted select-none")}>
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          {section.icon && <Icon name={section.icon} className="w-3.5 h-3.5 text-muted shrink-0" />}
                          <span className="truncate leading-normal">{section.label}</span>
                        </div>
                        {section.right && <div className="flex items-center shrink-0 ml-auto">{section.right}</div>}
                      </div>
                    )}
                    <nav aria-label={section.label ?? (idx === 0 ? t.mainMenu : `Menu ${idx + 1}`)} className="flex flex-col gap-0.5">
                      {section.loading
                        ? Array.from({ length: section.loadingCount ?? 5 }, (_, i) => (
                            <div key={i} className={cn("w-full h-9 flex items-center rounded-control", rowLayout)} aria-hidden>
                              <div className="w-4 h-4 rounded-chip shimmer shrink-0" />
                              <div className={cn(labelHidden, "h-3 rounded-chip shimmer")} style={{ width: `${55 + ((i * 19) % 35)}%` }} />
                            </div>
                          ))
                        : renderItems(section.items)}
                    </nav>
                  </React.Fragment>
                );
              })}
              {pinned && pinned.items.length > 0 && (
                <>
                  <div className="my-1 mx-1.5 border-t border-divider" />
                  <div className={cn(labelHidden, "shrink-0 px-2.5 pt-1 pb-0.5 text-overline text-muted select-none")}>{pinned.label}</div>
                  <nav aria-label={pinned.label} className="flex flex-col gap-0.5">
                    {renderItems(pinned.items)}
                  </nav>
                </>
              )}
            </div>

            {/* Bottom: utilities, then the account */}
            {(utilities.length > 0 || account) && (
              <div className="shrink-0 p-2 border-t border-divider flex flex-col gap-1">
                {utilities.length > 0 && <div className="flex flex-col gap-0.5">{renderItems(utilities)}</div>}
                {account && <div>{slot(account, { collapsed, rail })}</div>}
              </div>
            )}
          </aside>

          {/* Phone top bar: menu button + brand (drawer mode) */}
          {!tabs && (
            <div className="md:hidden shrink-0 flex items-center gap-2 h-14 px-2 pt-[env(safe-area-inset-top)] box-content bg-app">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label={t.openMenu}
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
                className={cn("w-11 h-11 rounded-control flex items-center justify-center text-contrast hover:bg-tint transition cursor-pointer", FOCUS_RING)}
              >
                <Icon name="menu" className="w-5 h-5" />
              </button>
              {logoTile}
              <span className="flex-1 min-w-0 truncate text-ui font-semibold text-contrast tracking-tight">{productName}</span>
            </div>
          )}

          {/* Right floating Bento content panel */}
          {/* tabs mode: --semi-bottom-bar is the tab bar's height below md, so sticky bottom bars inside (WorkspaceLayout's
              main action) sit above it, and --semi-bottom-pad drops their own safe-area padding (the tab bar already covers it);
              TAB_BAR_PAD only pads the end of the scroll */}
          <main id="main" className={cn(SHELL_MAIN, tabs && TAB_BAR_PAD, tabs && "max-md:[--semi-bottom-bar:calc(4rem+env(safe-area-inset-bottom))] max-md:[--semi-bottom-pad:1rem]")}>
            <div className={cn(SHELL_CONTAINER, !tabs && "max-sm:pt-2", containerClassName)}>
              <PageActionsSlot className="empty:hidden ml-auto mb-2 sticky top-0 max-md:top-[env(safe-area-inset-top)] z-sticky" />
              {children}
            </div>
          </main>

          {megaItem?.mega && (
            <MegaMenu
              open
              onClose={() => setMegaId(null)}
              anchorRef={asideRef}
              triggerRef={megaTrigger}
              label={megaItem.label}
              columns={megaItem.mega.columns}
              seeAll={megaItem.mega.seeAll}
              onNavigate={onSelect}
            />
          )}

          {drawerOpen && (
            <PhoneDrawer
              productName={productName}
              logoTile={logoTile}
              create={create}
              sections={sections}
              pinned={pinned}
              utilities={utilities}
              account={account}
              activeId={activeId}
              activeTopId={activeTopId}
              onSelect={onSelect}
              onClose={() => setDrawerOpen(false)}
            />
          )}

          {/* tabs mode: the bottom sheet when the app has more routes than fit on MobileTabBar */}
          {hasMoreSheet && moreOpen && (
            <div className="md:hidden fixed inset-0 z-sticky bg-overlay backdrop-blur-sm flex flex-col justify-end pb-16" role="presentation" onClick={() => setMoreOpen(false)}>
              <div className="bg-panel border-t border-line rounded-t-panel p-4 max-h-[75dvh] overflow-y-auto space-y-3" role="presentation" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-1">
                  <span className="font-display text-title font-semibold text-contrast">{productName}</span>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    aria-label={t.close}
                    className="w-8 h-8 rounded-full bg-tint hover:bg-tint-hover flex items-center justify-center text-muted hover:text-contrast transition"
                  >
                    <Icon name="close" className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {navItems.map((item) => {
                    const cls = cn(
                      "flex items-center gap-2.5 h-10 px-3 rounded-card text-label font-medium transition",
                      activeTopId === item.id ? "bg-tint-hover text-contrast" : "bg-tint text-body hover:bg-tint-hover hover:text-contrast",
                    );
                    const pick = () => {
                      onSelect?.(item.id);
                      setMoreOpen(false);
                    };
                    return item.href ? (
                      <Link key={item.id} href={item.href} onClick={pick} className={cls}>
                        {item.icon && <Icon name={item.icon} className="w-4 h-4 text-muted shrink-0" />}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ) : (
                      <button key={item.id} type="button" onClick={pick} className={cls}>
                        {item.icon && <Icon name={item.icon} className="w-4 h-4 text-muted shrink-0" />}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {account && <div className="pt-2 border-t border-divider">{slot(account, { collapsed: false, rail: false })}</div>}
              </div>
            </div>
          )}

          {tabs && (
            <MobileTabBar
              tabs={mobileTabs}
              active={activeTopId}
              onSelect={onSelect}
              moreOpen={moreOpen}
              onToggleMore={hasMoreSheet ? () => setMoreOpen((v) => !v) : undefined}
            />
          )}
        </div>
      </PageActionsProvider>
    </AppShellContext.Provider>
  );
}

type DrillRow = { id: string; label: React.ReactNode; href?: string; icon?: IconName; external?: boolean; onSelect?: () => void; disabled?: boolean; checked?: boolean };

/** A `menu` as drawer rows (hidden items left out). */
const menuRows = (id: string, items: MenuItem[], icon?: IconName): DrillRow[] =>
  items
    .filter((c) => !c.hidden)
    .map((c, i) => ({ id: `${id}-${i}`, label: c.label, href: c.href, icon: c.icon ?? icon, onSelect: c.onSelect, disabled: Boolean(c.disabled), checked: c.checked }));
type DrillLevel = { id: string; label: string; rows: DrillRow[]; seeAll?: { href: string; label?: string } };

/** Phones: the full-screen menu. Same groups as the sidebar; sub-items and mega menus open as a level with a back row. */
function PhoneDrawer({
  productName,
  logoTile,
  create,
  sections,
  pinned,
  utilities,
  account,
  activeId,
  activeTopId,
  onSelect,
  onClose,
}: {
  productName: string;
  logoTile: React.ReactNode;
  create?: ShellCreate;
  sections: ShellNavSection[];
  pinned?: ShellPinned;
  utilities: ShellNavItem[];
  account?: ShellSlot;
  activeId: string;
  activeTopId: string;
  onSelect?: (id: string) => void;
  onClose: () => void;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState<DrillLevel | null>(null);
  // the row that opened the level: focus returns to it on the way back
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const back = () => setLevel(null);
  const { titleId } = useDialog(ref, true, () => (level ? back() : onClose()));
  // a new level gets focus on its first row, so a screen reader hears where it went; back at the root, the row that
  // opened it gets focus again
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // the level's first enabled row, or its back button when every row is disabled (focus never drops to the body)
    const target = level
      ? (root.querySelector<HTMLElement>("[data-drawer-row-level]:not(:disabled)") ?? root.querySelector<HTMLElement>("[data-drawer-back]"))
      : returnTo ? root.querySelector<HTMLElement>(`[data-drawer-row="${CSS.escape(returnTo)}"]`) : null;
    target?.focus({ preventScroll: true });
  }, [level, returnTo]);
  const open = (l: DrillLevel) => {
    setReturnTo(l.id);
    setLevel(l);
  };

  const row = cn(
    "w-full flex items-center gap-3 min-h-12 px-3 rounded-control text-ui font-medium text-contrast hover:bg-tint transition cursor-pointer",
    FOCUS_RING,
  );
  // A parent with its own page keeps it reachable: "Tất cả <label>" is the first row of its level.
  const levelOf = (it: ShellNavItem): DrillLevel | null => {
    const rows: DrillRow[] | null = it.children?.length ? it.children : it.mega ? it.mega.columns.flatMap((c) => c.items) : it.menu ? menuRows(it.id, it.menu) : null;
    if (!rows) return null;
    const self: DrillRow[] = it.href ? [{ id: it.id, label: t.allOf(it.label), href: it.href, external: it.external }] : [];
    return { id: it.id, label: it.label, rows: [...self, ...rows], seeAll: it.mega?.seeAll };
  };
  const go = (id: string) => {
    onSelect?.(id);
    onClose();
  };

  const renderRow = (it: ShellNavItem) => {
    const on = activeTopId === it.id;
    const drill = levelOf(it);
    const icon = it.icon && <Icon name={it.icon} className="w-5 h-5 text-muted shrink-0" />;
    return (
      <li key={it.id}>
        {drill ? (
          <button type="button" data-drawer-row={it.id} className={cn(row, on && "bg-tint-hover")} onClick={() => open(drill)} aria-current={on ? "page" : undefined}>
            {icon}
            <span className="flex-1 min-w-0 truncate text-left">{it.label}</span>
            <Icon name="chevron" className="w-4 h-4 text-muted shrink-0" />
          </button>
        ) : it.href ? (
          <Link
            href={it.href}
            target={it.external ? "_blank" : undefined}
            rel={it.external ? "noopener noreferrer" : undefined}
            onClick={() => go(it.id)}
            className={cn(row, on && "bg-tint-hover")}
            aria-current={on ? "page" : undefined}
          >
            {icon}
            <span className="flex-1 min-w-0 truncate">{it.label}</span>
          </Link>
        ) : (
          <button
            type="button"
            className={cn(row, on && !it.onClick && "bg-tint-hover")}
            onClick={() => (it.onClick ? it.onClick() : go(it.id))}
            aria-current={on && !it.onClick ? "page" : undefined}
          >
            {icon}
            <span className="flex-1 min-w-0 truncate text-left">{it.label}</span>
          </button>
        )}
      </li>
    );
  };

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className="md:hidden fixed inset-0 z-drawer bg-panel flex flex-col pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 h-14 px-2 shrink-0">
        {level ? (
          <button type="button" data-drawer-back="" onClick={back} className={cn("flex items-center gap-2 h-11 px-2 rounded-control text-ui font-semibold text-contrast hover:bg-tint cursor-pointer min-w-0", FOCUS_RING)}>
            <Icon name="back" className="w-5 h-5 shrink-0" />
            <span id={titleId} className="truncate">
              {level.label}
            </span>
            <span className="sr-only">, {t.back}</span>
          </button>
        ) : (
          <span className="flex items-center gap-2 px-2 min-w-0">
            {logoTile}
            <span id={titleId} className="truncate text-ui font-semibold text-contrast tracking-tight">
              {productName}
            </span>
          </span>
        )}
        <button type="button" onClick={onClose} aria-label={t.closeMenu} className={cn("ml-auto w-11 h-11 shrink-0 rounded-control flex items-center justify-center text-contrast hover:bg-tint cursor-pointer", FOCUS_RING)}>
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-3 flex flex-col gap-4">
        {level ? (
          <ul className="flex flex-col gap-0.5">
            {level.rows.map((c) => {
              const on = !c.onSelect && c.id === activeId;
              const props = {
                "data-drawer-row-level": "",
                "aria-current": on ? ("page" as const) : undefined,
                className: cn(row, on && "bg-tint-hover", "disabled:opacity-40"),
              };
              const body = (
                <>
                  {c.icon && <Icon name={c.icon} className="w-5 h-5 text-muted shrink-0" />}
                  <span className="flex-1 min-w-0 truncate text-left">{c.label}</span>
                  {c.checked && <Icon name="check" className="w-4 h-4 text-contrast shrink-0" />}
                </>
              );
              return (
                <li key={c.id}>
                  {c.href ? (
                    <Link href={c.href} target={c.external ? "_blank" : undefined} rel={c.external ? "noopener noreferrer" : undefined} onClick={() => go(c.id)} {...props}>
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={c.disabled}
                      aria-pressed={c.checked}
                      onClick={() => {
                        if (!c.onSelect) return go(c.id);
                        onClose();
                        c.onSelect();
                      }}
                      {...props}
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
            {level.seeAll && (
              <li>
                <Link href={level.seeAll.href} onClick={onClose} className={cn(row, "text-accent-fg")}>
                  <span className="flex-1">{level.seeAll.label ?? t.seeAll}</span>
                  <Icon name="arrowRight" className="w-4 h-4 shrink-0" />
                </Link>
              </li>
            )}
          </ul>
        ) : (
          <>
            {create &&
              (create.items?.length ? (
                // one accent row that opens what can be created as a level (tiles repeated the nav's own names)
                <button
                  type="button"
                  data-drawer-row="__create"
                  onClick={() =>
                    open({
                      id: "__create",
                      label: create.label,
                      rows: menuRows("__create", create.items!, "plus"),
                    })
                  }
                  className={cn("mx-1 flex items-center gap-2 h-11 px-3 rounded-control bg-accent text-on-accent hover:bg-accent-hover text-ui font-semibold cursor-pointer", FOCUS_RING)}
                >
                  <Icon name={create.icon ?? "plus"} className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{create.label}</span>
                  <Icon name="chevron" className="w-4 h-4 shrink-0" />
                </button>
              ) : create.href ? (
                <Link href={create.href} onClick={onClose} className={cn("mx-1 flex items-center justify-center gap-2 h-11 rounded-control bg-accent text-on-accent hover:bg-accent-hover text-ui font-semibold", FOCUS_RING)}>
                  <Icon name={create.icon ?? "plus"} className="w-4 h-4" />
                  {create.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    create.onClick?.();
                  }}
                  className={cn("mx-1 flex items-center justify-center gap-2 h-11 rounded-control bg-accent text-on-accent hover:bg-accent-hover text-ui font-semibold cursor-pointer", FOCUS_RING)}
                >
                  <Icon name={create.icon ?? "plus"} className="w-4 h-4" />
                  {create.label}
                </button>
              ))}
            {sections.map((s, idx) =>
              s.items?.length ? (
                <nav key={s.label ?? idx} aria-label={s.label ?? (idx === 0 ? t.mainMenu : `Menu ${idx + 1}`)}>
                  {s.label && !s.hideLabel && idx > 0 && <div className="px-3 pb-1 text-caption font-medium text-muted">{s.label}</div>}
                  <ul className="flex flex-col gap-0.5">{s.items.map(renderRow)}</ul>
                </nav>
              ) : null,
            )}
            {pinned && pinned.items.length > 0 && (
              <nav aria-label={pinned.label}>
                <div className="px-3 pb-1 text-overline text-muted">{pinned.label}</div>
                <ul className="flex flex-col gap-0.5">{pinned.items.map(renderRow)}</ul>
              </nav>
            )}
          </>
        )}
      </div>

      {!level && (utilities.length > 0 || account) && (
        <div className="shrink-0 border-t border-divider p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
          {utilities.length > 0 && (
            <ul className="grid grid-flow-col auto-cols-fr gap-1">
              {utilities.map((u) => {
                const cls = cn("w-full flex flex-col items-center gap-1 py-2 rounded-control text-caption text-muted hover:text-contrast hover:bg-tint transition cursor-pointer", FOCUS_RING);
                const body = (
                  <>
                    <Icon name={u.icon ?? "box"} className="w-5 h-5" />
                    <span className="truncate max-w-full">{u.label}</span>
                  </>
                );
                return (
                  <li key={u.id} className="min-w-0">
                    {u.href ? (
                      <Link href={u.href} onClick={() => go(u.id)} className={cls}>
                        {body}
                      </Link>
                    ) : u.menu ? (
                      <button
                        type="button"
                        data-drawer-row={u.id}
                        onClick={() => open({ id: u.id, label: u.label, rows: menuRows(u.id, u.menu!) })}
                        className={cls}
                      >
                        {body}
                      </button>
                    ) : (
                      <button type="button" onClick={() => (u.onClick ? u.onClick() : go(u.id))} className={cls}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {account && <div>{slot(account, { collapsed: false, rail: false })}</div>}
        </div>
      )}
    </div>
  );
}
