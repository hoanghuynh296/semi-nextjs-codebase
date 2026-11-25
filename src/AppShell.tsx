"use client";

// The 1.0 frame of a multi-page app (#144, docs/DESIGN_SYSTEM.md §4):
// - A `canvas` frame (8px padding and gap from sm, none on phones) holding the nav panel and the content column.
// - Nav panel (`panel`, radius 16, padding 16 / 20): logo + collapse button, the one main action, the groups (24px
//   spacer with a line, faint 10px labels), a bottom row of 32×32 icon tools and a ••• menu. 224px, or the 72px rail.
// - Content column (`app`, radius 16): the RouteHeader (crumbs, middle, action icons, account avatar menu), then the
//   content card (`panel`, radius 16, flush, 4px above the bottom). `page="fixed"`: the card does not scroll, its panels do.
// - Responsive priority: the rail first (always md–lg; by default lg–1280, `railBelow`; the user's toggle is one stored
//   value), then (below md) a page's sub-nav stacks (T7), then the phone drawer and no frame padding.
// - The rail is CSS: the panel width comes from media queries + the stored choice (set on <html> before paint), and
//   what the rail hides is a container query on the panel. The server HTML is exact, and nothing remounts when the
//   width crosses a breakpoint or the nav collapses: every slot is rendered once, in one place.
// - ⌥ / Alt + 1…9 opens the nth nav item (navShortcuts.ts); holding the modifier shows the numbers.
import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSemiLocale } from "./locale";
import { Icon, type IconName } from "./Icon";
import { MegaMenu, type MegaMenuContent } from "./MegaMenu";
import { MobileTabBar, TAB_BAR_PAD, type MobileTabItem } from "./MobileTabBar";
import { Menu, Tooltip, type MenuItem } from "./Overlay";
import { PageActionsProvider, PageActionsSlot } from "./PageActions";
import { RecordCrumbContext, RouteHeader, type RouteCrumb, type ShellAccount } from "./RouteHeader";
import { useDialog } from "./a11y";
import { navShortcutKeys, shortcutText, useNavShortcuts } from "./navShortcuts";

export { navShortcutKeys };
import { BTN_PRIMARY } from "../styles/buttons";
import { SHELL_CARD, SHELL_COLUMN, SHELL_CONTAINER, SHELL_NAV, SHELL_OUTER } from "../styles/surfaces";
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
  /**
   * Keep the icon's place but hide it (`opacity-0`): for an icon that shows a value only known after mount, so it
   * does not swap after hydration (`useThemeUtility()` sets it until the stored theme is read).
   */
  iconHidden?: boolean;
  href?: string;
  external?: boolean;
  /** Small trailing content in the expanded nav (a count, a button). Hidden in the rail. */
  right?: React.ReactNode;
  /**
   * Sub-items. Closed by default; they open under the item while the item or one of them is the `activeId`, and
   * close again when another item is chosen. Never shown in the rail; on phones the drawer shows them as a drill-down
   * (›). Read `useAppShell()` and give the page its own way to reach them where the nav cannot show them.
   */
  children?: ShellNavChild[];
  /** Opens a MegaMenu flyout (category columns, New badges, See all) instead of navigating; a drill-down on phones. */
  mega?: MegaMenuContent;
  /** Acts in place instead of navigating. */
  onClick?: () => void;
  /** Opens a Menu of choices in place instead of navigating; a level of the phone drawer. `checked` marks the current one. */
  menu?: MenuItem[];
}

/**
 * The nav's one main action as data: an ordinary primary button with the app's label and icon (an icon with a Tooltip
 * in the rail). A menu of things when it has `items`, else one link or action.
 */
export interface ShellAction {
  label: string;
  icon?: IconName;
  /** The choices; the button opens them in a Menu. On phones the drawer shows one row that opens them as a level. */
  items?: MenuItem[];
  href?: string;
  /** Open `href` in a new tab (`target="_blank" rel="noopener noreferrer"`). */
  external?: boolean;
  onClick?: () => void;
}

/** @deprecated Since 1.0: the nav's main action is `ShellAction` (AppShell `mainAction`). */
export type ShellCreate = ShellAction;

/** A 32×32 icon button of the nav's bottom row: a Tooltip with its label and an optional count badge ("99+" cap). */
export interface ShellTool {
  id: string;
  label: string;
  icon?: IconName;
  /** See ShellNavItem.iconHidden. */
  iconHidden?: boolean;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  /** Opens a Menu of choices (a level of the phone drawer). */
  menu?: MenuItem[];
  /** Attention count (unread, waiting): a brand-filled badge on the corner, "99+" above 99, none at 0. */
  count?: number;
}

/** A group under the main nav (saved views, frequent records), headed by a faint label like the sections. */
export interface ShellPinned {
  label: string;
  items: ShellNavItem[];
}

/**
 * `rail`: the nav shows icons only (the user collapsed it, or the width chose the rail). `collapsed`: the rail at a width
 * where the user can expand it (lg and up). Both are false on phones and before mount (the server does not know the
 * width): style what the rail hides with CSS, or read them only for what may change after mount.
 */
export interface ShellSlotState {
  collapsed: boolean;
  rail: boolean;
}

/**
 * A slot of the shell (main action, header middle, actions, account): an element, or a function of the slot state.
 * A function is rendered as the body of one stable component, so it may call hooks; the slot keeps one instance (and
 * its state) across a collapse toggle, a resize over any breakpoint and a route change.
 */
export type ShellSlot = React.ReactNode | ((state: ShellSlotState) => React.ReactNode);

/** The route header on top of the content column. */
export interface ShellHeader {
  /**
   * The trail. Default: the active item's group (a link to `section.href`, else its first item), the item, its
   * sub-item, then the record a detail page names with `useRecordCrumb`.
   */
  crumbs?: RouteCrumb[];
  /** Optional middle (a search field on a search page, a small info banner); hidden below md, in its own Suspense. */
  middle?: ShellSlot;
  /** Action icon buttons (32×32, ghost or outline), before the account. In its own Suspense. */
  actions?: ShellSlot;
  /** The account avatar menu: who is signed in (theme, the app's items and sign-out in its Menu), or your own slot. */
  account?: ShellAccount | ShellSlot;
}

interface AppShellState {
  /** True when the nav shows sub-items (expanded nav at lg and up). False in the rail, below lg, on phones and before mount. */
  submenuVisible: boolean;
  /** The nav is the rail (exact after mount). */
  rail: boolean;
  /**
   * The nav item shortcuts by item id (["⌥", "2"], ["Alt", "2"]), ready for a CommandPalette item's `shortcut`. Empty
   * before mount or when shortcuts are off. Outside the shell, `navShortcutKeys(n)` gives the keys of the nth item.
   */
  shortcuts: Record<string, string[]>;
}

const AppShellContext = createContext<AppShellState>({ submenuVisible: false, rail: false, shortcuts: {} });

/** Inside `AppShell`: whether the nav shows sub-items, whether it is the rail, and the nav shortcuts by item id. */
export function useAppShell(): AppShellState {
  return useContext(AppShellContext);
}

export interface ShellNavSection {
  label?: string;
  hideLabel?: boolean;
  icon?: IconName;
  /** Small icon actions at the right of the group label (16px, muted), e.g. + to create an item in the group. */
  right?: React.ReactNode;
  /** Where the group's crumb links (default: its first item with an href). */
  href?: string;
  /** Let the user collapse and expand this group by clicking its heading (expanded nav and phone drawer; the rail still shows its items). */
  collapsible?: boolean;
  /** Initial open state when `collapsible` is true (default `true`). Automatically opens when `activeId` is inside the group. */
  defaultOpen?: boolean;
  items: ShellNavItem[];
  loading?: boolean;
  loadingCount?: number;
}

export interface AppShellProps {
  /** Product title shown next to the logo (e.g. "3D Noobs Studio", "Auton"). */
  productName: string;
  /** Icon inside the default brand tile. */
  logoIcon?: IconName;
  /** Optional custom logo element replacing the default brand tile (32px tall). */
  logo?: React.ReactNode;
  /** Nav groups, separated by a 24px spacer with a line. */
  sections: ShellNavSection[];
  /** Currently active item id (or route path). */
  activeId: string;
  /**
   * Called with the item id when an item is clicked. Items with `href` stay `next/link` links either way, so use it to
   * react to a click (close a sheet, track), not to route: give page items an `href` (`shell-nav-href`).
   */
  onSelect?: (id: string) => void;
  /**
   * The nav's one main action, the only brand-filled control in the nav: data (label + icon, a menu, a link or an
   * action) drawn as an ordinary primary button, or your own slot. In the rail: the icon with a Tooltip. The phone
   * drawer shows the data form as a row; a slot keeps its one instance in the nav, so give phones its action elsewhere.
   */
  mainAction?: ShellAction | ShellSlot;
  /** Optional quiet launcher under the main action (another app, a docs link). */
  primaryCta?: {
    label: string;
    icon: IconName;
    href?: string;
    external?: boolean;
    onClick?: () => void;
  };
  /** Optional quick-search field rendered above the nav sections in the expanded sidebar and phone drawer (hidden in the rail). */
  navSearch?: React.ReactNode;
  /** A group under the main nav (saved views, frequent records). */
  pinned?: ShellPinned;
  /** The bottom row of the nav: 32×32 ghost icon buttons (help, notifications), stacked in the rail. */
  tools?: ShellTool[];
  /** The rest of the bottom row, in a ••• Menu after the tools. */
  toolsMenu?: MenuItem[];
  /** The route header (crumbs, middle, actions, account). Default: shown with the default crumbs. `false`: none. */
  header?: ShellHeader | false;
  /**
   * `scroll` (default): the content card scrolls. `fixed`: the card fills the column and does not scroll; the page's
   * panels scroll inside it (list + reader, a pinned bar). Give the page `h-full min-h-0 flex flex-col`.
   */
  page?: "scroll" | "fixed";
  /** No centred max-width container and no padding around the page: the page layout decides (T7). */
  flush?: boolean;
  /**
   * Below this width (px, at least 1024) the nav starts as the rail while the user has not chosen; from it, expanded.
   * Between md and lg it is always the rail. Default 1280.
   */
  railBelow?: number;
  /** Width of the rail in px (default 72; the icons stay 32px, centred). */
  railWidth?: number;
  /** ⌥ / Alt + 1…9 opens the nth nav item (⌘ / Ctrl + digit in an installed app). Default true. */
  shortcuts?: boolean;
  /**
   * Phone navigation: `drawer` (a full-screen menu from the header's menu button) or `tabs` (MobileTabBar, the items in
   * `mobileTabIds`). Default: `tabs` when `mobileTabIds` is set, else `drawer`.
   */
  mobileNav?: "drawer" | "tabs";
  /** With `mobileNav="tabs"`: the ids of the items on the tab bar (up to 5; the rest go in its More sheet). */
  mobileTabIds?: string[];
  /**
   * localStorage key of the user's collapse choice ("rail" / "full"; one value for every width). A 0.x value ("1" /
   * "0", in this key or in the old default key `semi_sidebar_collapsed`) is upgraded once on load.
   */
  storageKey?: string;
  children: React.ReactNode;
  /** Classes added to the page container inside the content card. */
  containerClassName?: string;
}

/** "Chat model picker" → "CMP", "Button" → "Bu": the initials of the words, or the first letters of a single word. */
const abbreviate = (label: string) => {
  const words = label.trim().split(/\s+/);
  return words.length > 1 ? words.map((w) => w[0]).join("").slice(0, 3).toUpperCase() : label.slice(0, 2);
};

export const NAV_WIDTH = 224;
const MD = 768;
const LG = 1024;

const isAction = (a: unknown): a is ShellAction => !!a && typeof a === "object" && !React.isValidElement(a) && typeof (a as ShellAction).label === "string";
const isAccount = (a: unknown): a is ShellAccount => !!a && typeof a === "object" && !React.isValidElement(a) && typeof (a as ShellAccount).name === "string";

/** Renders a slot as the body of one stable component, so a function slot may call hooks and keeps its state. */
function SlotHost({ slot, state }: { slot: ShellSlot; state: ShellSlotState }) {
  return <>{typeof slot === "function" ? slot(state) : slot}</>;
}

/** The 0.x default key of the collapse choice ("1" collapsed, "0" expanded), moved once to the new key. */
const LEGACY_NAV_KEY = "semi_sidebar_collapsed";

/**
 * Reads the stored nav choice, upgrading a 0.x value once: "1" → "rail", "0" → "full", whether it sits in the key
 * itself (an app's own `storageKey`) or, when the key is empty, in the 0.x default key `semi_sidebar_collapsed`, which
 * is then deleted. So an upgrade keeps the person's choice.
 */
function readNavChoice(storageKey: string): "rail" | "full" | null {
  const s = localStorage;
  let v = s.getItem(storageKey);
  if (v === null && storageKey !== LEGACY_NAV_KEY) {
    v = s.getItem(LEGACY_NAV_KEY);
    if (v !== null) s.removeItem(LEGACY_NAV_KEY);
  }
  if (v === "1" || v === "0") {
    v = v === "1" ? "rail" : "full";
    s.setItem(storageKey, v);
  }
  return v === "rail" || v === "full" ? v : null;
}

/** Sets the stored nav choice on <html> before the first paint, so the server HTML's width is the user's (the rules of `readNavChoice`). */
export function navScript(storageKey: string) {
  return `(function(k,o){try{var s=localStorage,v=s.getItem(k);if(v===null&&k!==o){v=s.getItem(o);if(v!==null)s.removeItem(o)}if(v==="1"||v==="0"){v=v==="1"?"rail":"full";s.setItem(k,v)}if(v==="rail"||v==="full")document.documentElement.setAttribute("data-semi-nav",v)}catch(e){}})(${JSON.stringify(storageKey)},${JSON.stringify(LEGACY_NAV_KEY)})`;
}

/** The nav width rules: the rail from md, expanded from `railBelow` unless the user chose the rail, from lg if they chose expanded. */
function navWidthCss(railBelow: number, railWidth: number) {
  const full = `${NAV_WIDTH}px`;
  return (
    `[data-semi-nav-panel]{width:${railWidth}px}` +
    `@media (min-width:${railBelow}px){:root:not([data-semi-nav=rail]) [data-semi-nav-panel]{width:${full}}}` +
    `@media (min-width:${LG}px){:root[data-semi-nav=full] [data-semi-nav-panel]{width:${full}}}`
  );
}

export function AppShell({
  productName,
  logoIcon = "sparkles",
  logo,
  sections,
  activeId,
  onSelect,
  mainAction,
  primaryCta,
  navSearch,
  pinned,
  tools = [],
  toolsMenu = [],
  header,
  page = "scroll",
  flush = false,
  railBelow: railBelowProp = 1280,
  railWidth = 72,
  shortcuts: shortcutsOn = true,
  mobileNav,
  mobileTabIds,
  storageKey = "semi-nav",
  children,
  containerClassName = "",
}: AppShellProps) {
  const t = useSemiLocale();
  const railBelow = Math.max(LG, railBelowProp);
  const [choice, setChoice] = useState<"rail" | "full" | null>(null);
  const [width, setWidth] = useState<"phone" | "md" | "lg" | "wide" | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaId, setMegaId] = useState<string | null>(null);
  const [keysShown, setKeysShown] = useState(false);
  // Per-section manual expand/collapse overrides for collapsible sections (keyed by label or index).
  const [sectionToggles, setSectionToggles] = useState<Record<string, boolean>>({});
  // false on the server and in the first client render: the platform (⌥ or Alt) is known after mount
  const [mounted, setMounted] = useState(false);
  const [record, setRecord] = useState<string | null>(null);
  const recordValue = useMemo(() => ({ label: record, set: setRecord }), [record]);
  const asideRef = useRef<HTMLElement>(null);
  const megaTrigger = useRef<HTMLElement | null>(null);
  const asideId = useId();

  // the width range (after mount): only for what JS needs (tooltips, the expand button, the slot state); the layout is CSS
  useEffect(() => {
    const queries = [MD, LG, railBelow].map((w) => window.matchMedia(`(min-width: ${w}px)`));
    const update = () => {
      const [md, lg, wide] = queries.map((q) => q.matches);
      setWidth(wide ? "wide" : lg ? "lg" : md ? "md" : "phone");
      // the drawer belongs to phones: close it when the window grows past md
      if (md) setDrawerOpen(false);
    };
    update();
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, [railBelow]);

  useEffect(() => {
    let value: "rail" | "full" | null = null;
    try {
      value = readNavChoice(storageKey);
    } catch {
      // storage blocked: the default for the width
    }
    setChoice(value);
    const root = document.documentElement;
    if (value) root.setAttribute("data-semi-nav", value);
    else root.removeAttribute("data-semi-nav");
    setMounted(true);
    return () => root.removeAttribute("data-semi-nav");
  }, [storageKey]);

  const canToggle = width === "lg" || width === "wide";
  const rail = width === "md" || (canToggle && (choice ? choice === "rail" : width === "lg"));
  const slotState: ShellSlotState = { collapsed: rail && canToggle, rail };

  const toggleCollapsed = () => {
    setMegaId(null);
    const next = rail ? "full" : "rail";
    setChoice(next);
    document.documentElement.setAttribute("data-semi-nav", next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // ignore
    }
  };

  const navItems = sections.flatMap((s) => s.items);
  const allItems = [...navItems, ...(pinned?.items ?? [])];
  const firstItem = navItems.find((i) => i.href) ?? navItems[0];
  // The top-level item that owns the active id (itself, or the parent of an active sub-item).
  const activeTopId = allItems.find((i) => i.id === activeId || i.children?.some((c) => c.id === activeId))?.id ?? activeId;
  const submenuVisible = width !== null && !rail && width !== "phone";
  const megaItem = allItems.find((i) => i.id === megaId && i.mega);

  // Collapsible nav sections: start closed when defaultOpen is false, auto-open when activeId is inside the group.
  const sectionKey = (section: ShellNavSection, idx: number) => section.label ?? String(idx);
  const sectionHasActive = (section: ShellNavSection) =>
    section.items.some((i) => i.id === activeId || i.id === activeTopId);
  const isSectionOpen = (section: ShellNavSection, idx: number) => {
    if (!section.collapsible) return true;
    const key = sectionKey(section, idx);
    if (key in sectionToggles) return sectionToggles[key];
    if (sectionHasActive(section)) return true;
    return section.defaultOpen ?? true;
  };
  const toggleSection = (section: ShellNavSection, idx: number) => {
    if (!section.collapsible) return;
    const key = sectionKey(section, idx);
    const currentlyOpen = isSectionOpen(section, idx);
    setSectionToggles((prev) => ({ ...prev, [key]: !currentlyOpen }));
  };

  // When activeId changes to an item in another section, auto-open that section (clearing any prior manual collapse)
  // and close the phone drawer if it was open.
  const prevActiveIdRef = useRef(activeId);
  useEffect(() => {
    if (prevActiveIdRef.current === activeId) return;
    prevActiveIdRef.current = activeId;
    setDrawerOpen(false);
    const activeSecIdx = sections.findIndex((s) => s.items.some((i) => i.id === activeId || i.id === activeTopId));
    if (activeSecIdx >= 0) {
      const key = sectionKey(sections[activeSecIdx], activeSecIdx);
      setSectionToggles((prev) => {
        if (prev[key] !== false) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [activeId, activeTopId, sections]);

  // ─── Shortcuts: the first nine items in visual order ─────────────────────────────────────────────────────────
  // only what is drawn: a section still loading or collapsed (in expanded mode) is skipped
  const numbered = [
    ...sections
      .filter((sec, idx) => !sec.loading && (rail || isSectionOpen(sec, idx)))
      .flatMap((sec) => sec.items),
    ...(pinned?.items ?? []),
  ].slice(0, 9);
  const numberOf = (id: string) => {
    const i = numbered.findIndex((it) => it.id === id);
    return i < 0 ? 0 : i + 1;
  };
  const shortcutMap = useMemo<Record<string, string[]>>(
    () => (shortcutsOn && mounted ? Object.fromEntries(numbered.map((it, i) => [it.id, navShortcutKeys(i + 1)])) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shortcutsOn, mounted, numbered.map((i) => i.id).join(",")],
  );
  const activate = useCallback((n: number) => {
    const el = asideRef.current?.querySelector<HTMLElement>(`[data-nav-index="${n}"]`);
    if (!el) return false;
    el.click();
    return true;
  }, []);
  useNavShortcuts({ enabled: shortcutsOn, count: numbered.length, activate, onShow: setKeysShown });

  // ─── Crumbs ─────────────────────────────────────────────────────────────────────────────────────────────────
  const headerOn = header !== false;
  const crumbs = useMemo<RouteCrumb[]>(() => {
    if (header && header.crumbs) return record ? [...header.crumbs, { label: record }] : header.crumbs;
    const out: RouteCrumb[] = [];
    const groups: { label?: string; href?: string; items: ShellNavItem[] }[] = [...sections, ...(pinned ? [pinned] : [])];
    for (const g of groups) {
      const item = g.items.find((i) => i.id === activeTopId);
      if (!item) continue;
      if (g.label) out.push({ label: g.label, href: g.href ?? g.items.find((i) => i.href)?.href });
      out.push({ label: item.label, href: item.href });
      const child = item.children?.find((c) => c.id === activeId);
      if (child) out.push({ label: child.label, href: child.href });
      break;
    }
    if (record) out.push({ label: record });
    return out;
  }, [header, sections, pinned, activeTopId, activeId, record]);

  // ─── Nav pieces ─────────────────────────────────────────────────────────────────────────────────────────────
  const tip = (label: string, id?: string) => {
    if (!rail) return null;
    const keys = id && shortcutMap[id];
    return keys ? (
      <span className="inline-flex items-center gap-2">
        {label}
        <span className="text-muted tabular-nums">{shortcutText(keys)}</span>
      </span>
    ) : (
      label
    );
  };
  const titleOf = (label: string, id: string) => (rail ? undefined : shortcutMap[id] ? `${label} (${shortcutText(shortcutMap[id])})` : label);

  const navItemClass = cn("relative w-full h-8 flex items-center gap-2 px-2 rounded-control text-chrome font-medium whitespace-nowrap cursor-pointer transition-nav", FOCUS_RING);
  const navLabelClass = cn("flex-1 min-w-0 truncate text-left", `@max-[120px]/nav:sr-only`);
  const badge = (id: string) => {
    const n = numberOf(id);
    if (!keysShown || !n) return null;
    return (
      <span
        aria-hidden
        data-nav-num={n}
        className={cn(
          "shrink-0 ml-auto min-w-4 h-4 px-1 rounded-chip bg-raised text-chrome leading-4 text-strong tabular-nums text-center",
          `@max-[120px]/nav:absolute @max-[120px]/nav:-top-1 @max-[120px]/nav:-right-1 @max-[120px]/nav:ml-0`,
        )}
      >
        {n}
      </span>
    );
  };

  const renderNavEntry = (item: ShellNavItem) => {
    const hasChildren = Boolean(item.children?.length);
    const open = hasChildren && activeTopId === item.id;
    // A parent whose sub-item is active reads as current but keeps the fill for the sub-item (rail: the parent is all there is).
    const active = activeId === item.id || (open && !submenuVisible) || megaId === item.id;
    const stateClass = active ? "bg-item-selected text-strong" : open ? "text-strong hover:bg-item-hover" : "text-muted hover:text-strong hover:bg-item-hover";
    const expanded = hasChildren ? { "aria-expanded": open && submenuVisible } : {};
    const n = numberOf(item.id);
    const index = n ? { "data-nav-index": n } : {};
    const title = titleOf(item.label, item.id);
    const inner = (
      <>
        {item.icon ? (
          <Icon name={item.icon} className={cn("w-4 h-4 shrink-0", item.iconHidden && "opacity-0")} />
        ) : (
          <span className={cn("hidden w-full text-center text-chrome font-semibold leading-none truncate", `@max-[120px]/nav:block`)} aria-hidden>
            {item.shortLabel ?? abbreviate(item.label)}
          </span>
        )}
        <span className={navLabelClass}>{item.label}</span>
        {(hasChildren || item.mega) && !item.right && (
          <Icon name={open ? "chevronDown" : "chevron"} className={cn("w-3.5 h-3.5 shrink-0 text-muted", `@max-[120px]/nav:hidden`)} />
        )}
        {badge(item.id)}
      </>
    );

    if (item.mega) {
      return (
        <Tooltip key={item.id} content={tip(item.label, item.id)} side="right">
          <button
            type="button"
            {...index}
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
          </button>
        </Tooltip>
      );
    }

    if (item.menu) {
      return (
        <Menu
          key={item.id}
          align="left"
          label={item.label}
          items={item.menu}
          trigger={
            <Tooltip content={tip(item.label, item.id)} side="right">
              <button type="button" {...index} title={title} className={cn(navItemClass, stateClass)}>
                {inner}
              </button>
            </Tooltip>
          }
        />
      );
    }

    if (item.href) {
      return (
        <Tooltip key={item.id} content={tip(item.label, item.id)} side="right">
          <Link
            href={item.href}
            {...index}
            onClick={() => onSelect?.(item.id)}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            aria-current={activeId === item.id || open ? "page" : undefined}
            {...expanded}
            title={title}
            className={cn(navItemClass, stateClass, "group", Boolean(item.right) && "pr-1.5 @max-[120px]/nav:pr-2")}
          >
            {inner}
            {item.right && <span className={cn("flex items-center shrink-0 ml-auto", `@max-[120px]/nav:hidden`)}>{item.right}</span>}
          </Link>
        </Tooltip>
      );
    }

    const onClick = () => (item.onClick ? item.onClick() : onSelect?.(item.id));
    const button = (
      <button
        type="button"
        {...index}
        onClick={onClick}
        aria-current={item.onClick ? undefined : active ? "page" : undefined}
        {...expanded}
        title={title}
        className={item.right ? "flex-1 min-w-0 h-full flex items-center gap-2 text-left cursor-pointer overflow-hidden focus:outline-none" : cn(navItemClass, stateClass)}
      >
        {inner}
      </button>
    );
    // a trailing control next to a button can not sit inside it: the row is a div with both (the same in the rail)
    return item.right ? (
      <div key={item.id} className={cn(navItemClass, stateClass, "group pr-1.5 @max-[120px]/nav:pr-2 focus-within:ring-2 focus-within:ring-focus")}>
        <Tooltip content={tip(item.label, item.id)} side="right">
          {button}
        </Tooltip>
        <div className={cn("flex items-center shrink-0 ml-auto z-10", `@max-[120px]/nav:hidden`)}>{item.right}</div>
      </div>
    ) : (
      <Tooltip key={item.id} content={tip(item.label, item.id)} side="right">
        {button}
      </Tooltip>
    );
  };

  const renderChildren = (item: ShellNavItem) => {
    if (!item.children?.length || activeTopId !== item.id) return null;
    // rendered whenever the parent is open; the rail hides it with CSS (exact in the server HTML)
    return (
      <ul aria-label={item.label} className={cn("flex flex-col gap-1 ml-4 pl-2 border-l border-divider", `@max-[120px]/nav:hidden`)}>
        {item.children.map((child) => {
          const active = activeId === child.id;
          const cls = cn(
            "w-full h-8 flex items-center gap-2 px-2 rounded-control text-chrome transition-nav whitespace-nowrap cursor-pointer",
            FOCUS_RING,
            active ? "bg-item-selected text-strong font-medium" : "text-muted hover:text-strong hover:bg-item-hover",
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

  const groupSpacer = <div aria-hidden className="shrink-0 h-6 flex items-center px-2"><div className="h-px flex-1 bg-raised" /></div>;
  // the group label: `text-nav-label` (10px / 500, uppercase, normal tracking, faint), one class of its own
  const groupLabel = (
    label: string,
    icon?: IconName,
    right?: React.ReactNode,
    collapse?: { open: boolean; controlsId: string; onToggle: () => void },
  ) =>
    collapse ? (
      <div className={cn("shrink-0 h-8 flex items-center justify-between gap-1 select-none", `@max-[120px]/nav:hidden`)}>
        <button
          type="button"
          aria-expanded={collapse.open}
          aria-controls={collapse.controlsId}
          onClick={collapse.onToggle}
          className={cn(
            "flex-1 min-w-0 h-8 flex items-center justify-between gap-2 px-2 rounded-control text-nav-label hover:text-strong hover:bg-item-hover transition-hover cursor-pointer",
            FOCUS_RING,
          )}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {icon && <Icon name={icon} className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{label}</span>
          </span>
          <Icon name={collapse.open ? "chevronDown" : "chevron"} className="w-3.5 h-3.5 shrink-0" />
        </button>
        {right && <span className="flex items-center gap-1 shrink-0 pr-1 text-muted">{right}</span>}
      </div>
    ) : (
      <div className={cn("shrink-0 h-8 flex items-center justify-between gap-2 px-2 py-1.5 select-none", `@max-[120px]/nav:hidden`)}>
        <span className="flex items-center gap-1.5 min-w-0 text-nav-label">
          {icon && <Icon name={icon} className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{label}</span>
        </span>
        {right && <span className="flex items-center gap-1 shrink-0 text-muted">{right}</span>}
      </div>
    );

  const logoTile = logo ?? (
    <span className="w-8 h-8 rounded-control bg-inverted text-on-inverted flex items-center justify-center shrink-0">
      <Icon name={logoIcon} className="w-4 h-4" />
    </span>
  );
  const brandClass = cn("min-w-0 flex items-center gap-2 text-left rounded-control", FOCUS_RING);
  const brandName = <span className={cn("truncate text-chrome font-semibold text-strong tracking-tight", `@max-[120px]/nav:hidden`)}>{productName}</span>;

  // the main action: data drawn as a primary button, or the app's own slot (one instance)
  const action = isAction(mainAction) ? mainAction : null;
  const actionClass = cn(BTN_PRIMARY, "w-full", `@max-[120px]/nav:px-0 @max-[120px]/nav:h-8`);
  const actionInner = action && (
    <>
      <Icon name={action.icon ?? "plus"} className="w-4 h-4 shrink-0" />
      <span className={cn("truncate", `@max-[120px]/nav:sr-only`)}>{action.label}</span>
    </>
  );
  const actionNode = action ? (
    action.items?.length ? (
      <Menu
        align="left"
        items={action.items}
        label={action.label}
        trigger={
          <Tooltip content={tip(action.label)} side="right">
            <button type="button" className={actionClass}>
              {actionInner}
            </button>
          </Tooltip>
        }
      />
    ) : action.href ? (
      <Tooltip content={tip(action.label)} side="right">
        <Link
          href={action.href}
          target={action.external ? "_blank" : undefined}
          rel={action.external ? "noopener noreferrer" : undefined}
          className={actionClass}
        >
          {actionInner}
        </Link>
      </Tooltip>
    ) : (
      <Tooltip content={tip(action.label)} side="right">
        <button type="button" onClick={action.onClick} className={actionClass}>
          {actionInner}
        </button>
      </Tooltip>
    )
  ) : mainAction !== undefined && mainAction !== null ? (
    <SlotHost slot={mainAction as ShellSlot} state={slotState} />
  ) : null;

  const ctaClass = cn(
    "shrink-0 w-full h-8 px-2 rounded-control bg-subtle-button hover:bg-item-hover border border-outline-line text-strong flex items-center gap-2 text-chrome font-medium transition-hover cursor-pointer",
    FOCUS_RING,
    `@max-[120px]/nav:px-0 @max-[120px]/nav:justify-center`,
  );
  const ctaInner = primaryCta && (
    <>
      <Icon name={primaryCta.icon} className="w-4 h-4 shrink-0" />
      <span className={navLabelClass}>{primaryCta.label}</span>
    </>
  );

  // ─── Bottom row ─────────────────────────────────────────────────────────────────────────────────────────────
  const toolSide = rail ? "right" : "top";
  const toolClass = cn("relative w-8 h-8 shrink-0 rounded-control flex items-center justify-center text-muted hover:text-strong hover:bg-item-hover transition-hover cursor-pointer", FOCUS_RING);
  const countBadge = (count?: number) =>
    count ? (
      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-on-primary text-badge leading-4 tabular-nums text-center">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;
  const renderTool = (tool: ShellTool) => {
    // the name is the label, then the visible count (axe label-content-name-mismatch): "Thông báo 12"
    const inner = (
      <>
        <Icon name={tool.icon ?? "box"} className={cn("w-4 h-4", tool.iconHidden && "opacity-0")} />
        <span className="sr-only">{tool.label} </span>
        {countBadge(tool.count)}
      </>
    );
    if (tool.menu) {
      return (
        <Menu
          key={tool.id}
          align="left"
          label={tool.label}
          items={tool.menu}
          trigger={
            <Tooltip content={tool.label} side={toolSide}>
              <button type="button" className={toolClass}>
                {inner}
              </button>
            </Tooltip>
          }
        />
      );
    }
    return (
      <Tooltip key={tool.id} content={tool.label} side={toolSide}>
        {tool.href ? (
          <Link
            href={tool.href}
            target={tool.external ? "_blank" : undefined}
            rel={tool.external ? "noopener noreferrer" : undefined}
            onClick={() => onSelect?.(tool.id)}
            className={toolClass}
          >
            {inner}
          </Link>
        ) : (
          <button type="button" onClick={() => (tool.onClick ? tool.onClick() : onSelect?.(tool.id))} className={toolClass}>
            {inner}
          </button>
        )}
      </Tooltip>
    );
  };

  // backward compatible: an app that set mobileTabIds keeps its tab bar; the drawer is the default only when neither is set
  const tabs = mobileNav ? mobileNav === "tabs" : Boolean(mobileTabIds);
  const pinnedItems = tabs
    ? mobileTabIds
      ? mobileTabIds.map((id) => navItems.find((i) => i.id === id)).filter((x): x is ShellNavItem => Boolean(x))
      : navItems.slice(0, navItems.length > 6 ? 5 : 6)
    : [];
  const hasMoreSheet = tabs && navItems.length > pinnedItems.length;
  const mobileTabs: MobileTabItem[] = pinnedItems.map((i) => ({ id: i.id, icon: i.icon ?? "box", title: i.label, shortTitle: i.shortLabel, href: i.href }));

  const headerConf = header || {};
  const accountSlot = headerConf.account;

  return (
    <AppShellContext.Provider value={{ submenuVisible, rail, shortcuts: shortcutMap }}>
      <RecordCrumbContext.Provider value={recordValue}>
        <PageActionsProvider>
          <script dangerouslySetInnerHTML={{ __html: navScript(storageKey) }} />
          <style dangerouslySetInnerHTML={{ __html: navWidthCss(railBelow, railWidth) }} />
          <div className={SHELL_OUTER}>
            {/* The nav panel (md+): its width is CSS (above), what the rail hides is a container query on it */}
            <aside
              ref={asideRef}
              id={asideId}
              aria-label={productName}
              data-semi-nav-panel=""
              style={{ ["--semi-nav-pad" as string]: `${(railWidth - 32) / 2}px` }}
              className={SHELL_NAV}
            >
              <div className="shrink-0 px-(--semi-nav-pad) pt-4 flex flex-col gap-4">
                {/* Logo + collapse toggle (in the rail at lg+ the logo expands it) */}
                <div className="h-8 flex items-center justify-between gap-2 shrink-0">
                  {rail && canToggle ? (
                    <Tooltip content={t.expandMenu} side="right">
                      <button type="button" onClick={toggleCollapsed} aria-label={t.expandMenu} aria-expanded={false} aria-controls={asideId} className={cn(brandClass, "cursor-pointer")}>
                        {logoTile}
                      </button>
                    </Tooltip>
                  ) : firstItem?.href ? (
                    <Link href={firstItem.href} onClick={() => onSelect?.(firstItem.id)} className={brandClass} aria-label={productName}>
                      {logoTile}
                      {brandName}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => firstItem && onSelect?.(firstItem.id)} className={cn(brandClass, "cursor-pointer")} aria-label={productName}>
                      {logoTile}
                      {brandName}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={t.collapseMenu}
                    aria-expanded
                    aria-controls={asideId}
                    title={t.collapseMenu}
                    className={cn(
                      "w-8 h-8 rounded-control flex items-center justify-center text-muted hover:text-strong hover:bg-item-hover transition-hover shrink-0 cursor-pointer",
                      FOCUS_RING,
                      `@max-[120px]/nav:hidden`,
                    )}
                  >
                    <Icon name="sidebar" className="w-4 h-4" />
                  </button>
                </div>

                {(actionNode || primaryCta) && (
                  <div className="flex flex-col gap-2">
                    {actionNode}
                    {primaryCta && (
                      <Tooltip content={tip(primaryCta.label)} side="right">
                        {primaryCta.href ? (
                          <Link
                            href={primaryCta.href}
                            target={primaryCta.external ? "_blank" : undefined}
                            rel={primaryCta.external ? "noopener noreferrer" : undefined}
                            title={rail ? undefined : primaryCta.label}
                            className={ctaClass}
                          >
                            {ctaInner}
                          </Link>
                        ) : (
                          <button type="button" onClick={primaryCta.onClick} title={rail ? undefined : primaryCta.label} className={ctaClass}>
                            {ctaInner}
                          </button>
                        )}
                      </Tooltip>
                    )}
                  </div>
                )}

                {navSearch && <div className={cn("relative", `@max-[120px]/nav:hidden`)}>{navSearch}</div>}
              </div>

              {/* Scrollable nav: sections, then the pinned group; the padding keeps the rail's corner badges visible */}
              <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden px-(--semi-nav-pad) py-4">
                {sections.map((section, idx) => {
                  if (!section.loading && (!section.items || section.items.length === 0)) return null;
                  const open = isSectionOpen(section, idx);
                  const navId = `${asideId}-sec-${idx}`;
                  return (
                    <React.Fragment key={section.label ?? idx}>
                      {idx > 0 && groupSpacer}
                      {section.label &&
                        !section.hideLabel &&
                        groupLabel(
                          section.label,
                          section.icon,
                          section.right,
                          section.collapsible ? { open, controlsId: navId, onToggle: () => toggleSection(section, idx) } : undefined,
                        )}
                      <nav
                        id={section.collapsible ? navId : undefined}
                        aria-label={section.label ?? (idx === 0 ? t.mainMenu : `Menu ${idx + 1}`)}
                        className={cn("flex-col gap-1", open ? "flex" : "hidden @max-[120px]/nav:flex")}
                      >
                        {section.loading
                          ? Array.from({ length: section.loadingCount ?? 5 }, (_, i) => (
                              <div key={i} className="w-full h-8 flex items-center gap-2 px-2 rounded-control" aria-hidden>
                                <div className="w-4 h-4 rounded-chip shimmer shrink-0" />
                                <div className={cn("h-3 rounded-chip shimmer", `@max-[120px]/nav:hidden`)} style={{ width: `${55 + ((i * 19) % 35)}%` }} />
                              </div>
                            ))
                          : renderItems(section.items)}
                      </nav>
                    </React.Fragment>
                  );
                })}
                {pinned && pinned.items.length > 0 && (
                  <>
                    {groupSpacer}
                    {groupLabel(pinned.label)}
                    <nav aria-label={pinned.label} className="flex flex-col gap-1">
                      {renderItems(pinned.items)}
                    </nav>
                  </>
                )}
              </div>

              {/* Bottom row: the tools and the ••• menu, stacked in the rail */}
              {(tools.length > 0 || toolsMenu.length > 0) && (
                <div className={cn("shrink-0 px-(--semi-nav-pad) pb-4 flex flex-row flex-wrap items-center gap-1", `@max-[120px]/nav:flex-col`)}>
                  {tools.map(renderTool)}
                  {toolsMenu.length > 0 && (
                    <Menu
                      label={t.moreTools}
                      align="left"
                      items={toolsMenu}
                      trigger={
                        <Tooltip content={t.moreTools} side={toolSide}>
                          <button type="button" aria-label={t.moreTools} className={toolClass}>
                            <Icon name="more" className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      }
                    />
                  )}
                </div>
              )}
            </aside>

            {/* Phone top bar without a route header: menu button + brand (drawer mode) */}
            {!headerOn && !tabs && (
              <div className="md:hidden shrink-0 flex items-center gap-2 h-14 px-2 pt-[env(safe-area-inset-top)] box-content bg-app">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label={t.openMenu}
                  aria-haspopup="dialog"
                  aria-expanded={drawerOpen}
                  className={cn("w-11 h-11 rounded-control flex items-center justify-center text-strong hover:bg-item-hover transition-hover cursor-pointer", FOCUS_RING)}
                >
                  <Icon name="menu" className="w-5 h-5" />
                </button>
                {logoTile}
                <span className="flex-1 min-w-0 truncate text-ui font-semibold text-strong tracking-tight">{productName}</span>
              </div>
            )}

            {/* The content column: the route header, then the content card */}
            {/* data-density-view: the column is the screen, so the density audit counts the content card as the page
                panel (page panel › card › tile), not as a frame inside the column */}
            <div data-density-view="" className={cn(SHELL_COLUMN, !headerOn && "max-sm:pt-2")}>
              {headerOn && (
                <RouteHeader
                  crumbs={crumbs}
                  className="max-md:pt-[env(safe-area-inset-top)] max-md:box-content"
                  onMenu={tabs ? undefined : () => setDrawerOpen(true)}
                  menuExpanded={drawerOpen}
                  middle={headerConf.middle !== undefined && headerConf.middle !== null ? <SlotHost slot={headerConf.middle} state={slotState} /> : undefined}
                  actions={headerConf.actions !== undefined && headerConf.actions !== null ? <SlotHost slot={headerConf.actions} state={slotState} /> : undefined}
                  account={
                    accountSlot === undefined || accountSlot === null
                      ? undefined
                      : isAccount(accountSlot)
                        ? accountSlot
                        : <SlotHost slot={accountSlot as ShellSlot} state={slotState} />
                  }
                />
              )}
              {/* tabs mode: --semi-bottom-bar is the tab bar's height below md, so sticky bottom bars inside (WorkspaceLayout's
                  main action) sit above it, and --semi-bottom-pad drops their own safe-area padding (the tab bar already covers it);
                  TAB_BAR_PAD only pads the end of the scroll */}
              <main
                id="main"
                data-shell-card=""
                data-page={page}
                className={cn(
                  SHELL_CARD,
                  page === "fixed" ? "overflow-hidden" : "overflow-y-auto",
                  tabs && TAB_BAR_PAD,
                  tabs && "max-md:[--semi-bottom-bar:calc(4rem+env(safe-area-inset-bottom))] max-md:[--semi-bottom-pad:1rem]",
                )}
              >
                <div data-shell-container="" className={cn(flush ? "flex-1 min-w-0 min-h-0 w-full flex flex-col" : SHELL_CONTAINER, page === "fixed" && "min-h-0", containerClassName)}>
                  <PageActionsSlot className="empty:hidden ml-auto mb-2 sticky top-0 z-sticky" />
                  {children}
                </div>
              </main>
            </div>

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
                action={action}
                navSearch={navSearch}
                sections={sections}
                isSectionOpen={isSectionOpen}
                onToggleSection={toggleSection}
                pinned={pinned}
                tools={tools}
                toolsMenu={toolsMenu}
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
                    <span className="font-display text-lead font-semibold text-strong">{productName}</span>
                    <button
                      type="button"
                      onClick={() => setMoreOpen(false)}
                      aria-label={t.close}
                      className="w-8 h-8 rounded-full bg-tint hover:bg-tint-hover flex items-center justify-center text-muted hover:text-strong transition"
                    >
                      <Icon name="close" className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {navItems.map((item) => {
                      const cls = cn(
                        "flex items-center gap-2.5 h-10 px-3 rounded-card text-ui font-medium transition",
                        activeTopId === item.id ? "bg-item-selected text-strong" : "bg-tint text-body hover:bg-tint-hover hover:text-strong",
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
      </RecordCrumbContext.Provider>
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
  action: create,
  navSearch,
  sections,
  isSectionOpen,
  onToggleSection,
  pinned,
  tools: utilities,
  toolsMenu,
  activeId,
  activeTopId,
  onSelect,
  onClose,
}: {
  productName: string;
  logoTile: React.ReactNode;
  action: ShellAction | null;
  navSearch?: React.ReactNode;
  sections: ShellNavSection[];
  isSectionOpen: (section: ShellNavSection, idx: number) => boolean;
  onToggleSection: (section: ShellNavSection, idx: number) => void;
  pinned?: ShellPinned;
  tools: ShellTool[];
  toolsMenu: MenuItem[];
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
    "w-full flex items-center gap-3 min-h-12 px-3 rounded-control text-ui font-medium text-strong hover:bg-item-hover transition-hover cursor-pointer",
    FOCUS_RING,
  );
  // A parent with its own page keeps it reachable: "Tất cả <label>" is the first row of its level.
  const levelOf = (it: ShellNavItem | ShellTool): DrillLevel | null => {
    if (!("children" in it || "mega" in it || it.menu)) return null;
    const nav = it as ShellNavItem;
    const rows: DrillRow[] | null = nav.children?.length ? nav.children : nav.mega ? nav.mega.columns.flatMap((c) => c.items) : it.menu ? menuRows(it.id, it.menu) : null;
    if (!rows) return null;
    const self: DrillRow[] = it.href ? [{ id: it.id, label: t.allOf(it.label), href: it.href, external: it.external }] : [];
    return { id: it.id, label: it.label, rows: [...self, ...rows], seeAll: nav.mega?.seeAll };
  };
  const go = (id: string) => {
    onSelect?.(id);
    onClose();
  };

  const renderRow = (it: ShellNavItem) => {
    const on = activeTopId === it.id;
    const drill = levelOf(it);
    const icon = it.icon && <Icon name={it.icon} className={cn("w-5 h-5 text-muted shrink-0", it.iconHidden && "opacity-0")} />;
    return (
      <li key={it.id}>
        {drill ? (
          <button type="button" data-drawer-row={it.id} className={cn(row, on && "bg-item-selected")} onClick={() => open(drill)} aria-current={on ? "page" : undefined}>
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
            className={cn(row, on && "bg-item-selected")}
            aria-current={on ? "page" : undefined}
          >
            {icon}
            <span className="flex-1 min-w-0 truncate">{it.label}</span>
          </Link>
        ) : (
          <button
            type="button"
            className={cn(row, on && !it.onClick && "bg-item-selected")}
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
          <button type="button" data-drawer-back="" onClick={back} className={cn("flex items-center gap-2 h-11 px-2 rounded-control text-ui font-semibold text-strong hover:bg-tint cursor-pointer min-w-0", FOCUS_RING)}>
            <Icon name="back" className="w-5 h-5 shrink-0" />
            <span id={titleId} className="truncate">
              {level.label}
            </span>
            <span className="sr-only">, {t.back}</span>
          </button>
        ) : (
          <span className="flex items-center gap-2 px-2 min-w-0">
            {logoTile}
            <span id={titleId} className="truncate text-ui font-semibold text-strong tracking-tight">
              {productName}
            </span>
          </span>
        )}
        <button type="button" onClick={onClose} aria-label={t.closeMenu} className={cn("ml-auto w-11 h-11 shrink-0 rounded-control flex items-center justify-center text-strong hover:bg-tint cursor-pointer", FOCUS_RING)}>
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
                className: cn(row, on && "bg-item-selected", "disabled:opacity-40"),
              };
              const body = (
                <>
                  {c.icon && <Icon name={c.icon} className="w-5 h-5 text-muted shrink-0" />}
                  <span className="flex-1 min-w-0 truncate text-left">{c.label}</span>
                  {c.checked && <Icon name="check" className="w-4 h-4 text-strong shrink-0" />}
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
                <Link href={level.seeAll.href} onClick={onClose} className={cn(row, "text-strong")}>
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
                  className={cn("mx-1 flex items-center gap-2 h-11 px-3 rounded-control bg-primary text-on-primary hover:bg-primary-hover text-ui font-semibold cursor-pointer", FOCUS_RING)}
                >
                  <Icon name={create.icon ?? "plus"} className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{create.label}</span>
                  <Icon name="chevron" className="w-4 h-4 shrink-0" />
                </button>
              ) : create.href ? (
                <Link
                  href={create.href}
                  target={create.external ? "_blank" : undefined}
                  rel={create.external ? "noopener noreferrer" : undefined}
                  onClick={onClose}
                  className={cn("mx-1 flex items-center justify-center gap-2 h-11 rounded-control bg-primary text-on-primary hover:bg-primary-hover text-ui font-semibold", FOCUS_RING)}
                >
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
                  className={cn("mx-1 flex items-center justify-center gap-2 h-11 rounded-control bg-primary text-on-primary hover:bg-primary-hover text-ui font-semibold cursor-pointer", FOCUS_RING)}
                >
                  <Icon name={create.icon ?? "plus"} className="w-4 h-4" />
                  {create.label}
                </button>
              ))}
            {navSearch && <div className="relative px-1">{navSearch}</div>}
            {sections.map((s, idx) => {
              if (!s.items?.length) return null;
              const open = isSectionOpen(s, idx);
              const listId = `drawer-sec-${idx}`;
              return (
                <nav key={s.label ?? idx} aria-label={s.label ?? (idx === 0 ? t.mainMenu : `Menu ${idx + 1}`)}>
                  {s.label && !s.hideLabel && (s.collapsible ? (
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={listId}
                      onClick={() => onToggleSection(s, idx)}
                      className={cn("w-full flex items-center justify-between gap-2 px-3 py-2 rounded-control text-chrome font-medium text-muted hover:text-strong hover:bg-item-hover transition-hover cursor-pointer", FOCUS_RING)}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {s.icon && <Icon name={s.icon} className="w-4 h-4 shrink-0" />}
                        <span className="truncate">{s.label}</span>
                      </span>
                      <Icon name={open ? "chevronDown" : "chevron"} className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  ) : idx > 0 ? (
                    <div className="px-3 pb-1 text-chrome font-medium text-muted">{s.label}</div>
                  ) : null)}
                  {open && <ul id={s.collapsible ? listId : undefined} className="flex flex-col gap-0.5">{s.items.map(renderRow)}</ul>}
                </nav>
              );
            })}
            {pinned && pinned.items.length > 0 && (
              <nav aria-label={pinned.label}>
                <div className="px-3 pb-1 text-chrome font-medium text-muted">{pinned.label}</div>
                <ul className="flex flex-col gap-0.5">{pinned.items.map(renderRow)}</ul>
              </nav>
            )}
          </>
        )}
      </div>

      {!level && (utilities.length > 0 || toolsMenu.length > 0) && (
        <div className="shrink-0 border-t border-divider p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <ul className="grid grid-flow-col auto-cols-fr gap-1">
            {[...utilities, ...(toolsMenu.length ? [{ id: "__more", label: t.moreTools, icon: "more" as IconName, menu: toolsMenu }] : [])].map((u: ShellTool) => {
              const cls = cn("relative w-full flex flex-col items-center gap-1 py-2 rounded-control text-chrome text-muted hover:text-strong hover:bg-item-hover transition-hover cursor-pointer", FOCUS_RING);
              // the name is the label, then the visible count ("Thông báo 12"), in reading order
              const body = (
                <>
                  <Icon name={u.icon ?? "box"} className={cn("w-5 h-5", u.iconHidden && "opacity-0")} />
                  <span className="truncate max-w-full">{u.label}</span>{" "}
                  {!!u.count && (
                    <span className="absolute top-1 left-1/2 ml-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-on-primary text-badge leading-4 tabular-nums text-center">
                      {u.count > 99 ? "99+" : u.count}
                    </span>
                  )}
                </>
              );
              return (
                <li key={u.id} className="min-w-0">
                  {u.href ? (
                    <Link href={u.href} onClick={() => go(u.id)} className={cls}>
                      {body}
                    </Link>
                  ) : u.menu ? (
                    <button type="button" data-drawer-row={u.id} onClick={() => open({ id: u.id, label: u.label, rows: menuRows(u.id, u.menu!) })} className={cls}>
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
        </div>
      )}
    </div>
  );
}
