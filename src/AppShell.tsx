"use client";

// 2-panel floating Bento shell of the Semi Design System (docs/DESIGN_SYSTEM.md §4):
// - Outer bg-canvas (#111111) with md:p-2 md:gap-2
// - Collapsible rounded-2xl bg-panel left menu (w-52 <-> w-14 icon rail, persisted in localStorage)
// - Rounded-2xl bg-app right content panel with max-w-[1440px] container
// - Mobile (< md): hides the top logo header and renders MobileTabBar at the bottom (plus a bottom sheet if >5 routes)
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { MobileTabBar, TAB_BAR_PAD, type MobileTabItem } from "./MobileTabBar";
import { PageActionsProvider, PageActionsSlot } from "./PageActions";
import { SHELL_ASIDE, SHELL_CONTAINER, SHELL_MAIN, SHELL_OUTER } from "../styles/surfaces";

export interface ShellNavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: IconName;
  href?: string;
  external?: boolean;
  right?: React.ReactNode;
}

export interface ShellNavSection {
  label?: string;
  items: ShellNavItem[];
  loading?: boolean;
  loadingCount?: number;
}

export function AppShell({
  productName,
  logoIcon = "sparkles",
  logo,
  sections,
  activeId,
  onSelect,
  primaryCta,
  footer,
  mobileTabIds,
  storageKey = "semi_sidebar_collapsed",
  children,
  containerClassName = "",
}: {
  /** Product title shown in the sidebar header (e.g. "3D Noobs Studio", "Auton"). */
  productName: string;
  /** Icon inside the default 24x24 brand tile. */
  logoIcon?: IconName;
  /** Optional custom logo element replacing the default brand tile. */
  logo?: React.ReactNode;
  /** Navigation groups separated by thin dividers in the left panel. */
  sections: ShellNavSection[];
  /** Currently active item id (or route path). */
  activeId: string;
  /** Callback when a tab is clicked (optional if items use `href` routing). */
  onSelect?: (id: string) => void;
  /** Optional highlighted CTA button at the top of the sidebar (e.g. Slicer launcher). */
  primaryCta?: {
    label: string;
    icon: IconName;
    href?: string;
    external?: boolean;
    onClick?: () => void;
  };
  /** Footer content at the bottom of the sidebar. Receives `{ collapsed }` so it can hide text in rail mode. */
  footer?: React.ReactNode | ((state: { collapsed: boolean }) => React.ReactNode);
  /** Up to 5 item ids to pin on the phone bottom tab bar (defaults to the first 5 items). */
  mobileTabIds?: string[];
  /** localStorage key for persisting sidebar collapsed state. */
  storageKey?: string;
  children: React.ReactNode;
  containerClassName?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") {
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggleCollapsed = () => {
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

  const allItems = sections.flatMap((s) => s.items);
  const firstItem = allItems[0];

  const navItemClass = `w-full h-8 flex items-center rounded-lg text-[12px] font-medium transition whitespace-nowrap cursor-pointer ${
    collapsed ? "justify-center" : "justify-center lg:justify-start lg:gap-2.5 lg:px-2.5"
  }`;
  const navLabelClass = `${collapsed ? "hidden" : "hidden lg:block"} flex-1 min-w-0 truncate text-left`;

  // Phone bottom tabs: up to 5 primary tabs; if there are more items in the app, add a "Menu" sheet toggle
  const pinnedItems = mobileTabIds
    ? mobileTabIds.map((id) => allItems.find((i) => i.id === id)).filter((x): x is ShellNavItem => Boolean(x))
    : allItems.slice(0, allItems.length > 6 ? 5 : 6);
  const hasMoreSheet = allItems.length > pinnedItems.length;

  const mobileTabs: MobileTabItem[] = pinnedItems.map((i) => ({
    id: i.id,
    icon: i.icon,
    title: i.label,
    shortTitle: i.shortLabel,
    href: i.href,
  }));

  const renderNavEntry = (item: ShellNavItem) => {
    const active = activeId === item.id;
    const stateClass = active
      ? "bg-white/[0.10] text-white"
      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]";
    const inner = (
      <>
        <Icon name={item.icon} className="w-4 h-4 shrink-0" />
        <span className={navLabelClass}>{item.label}</span>
      </>
    );

    if (item.href && !onSelect) {
      return (
        <Link
          key={item.id}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          aria-current={active ? "page" : undefined}
          title={item.label}
          className={`${navItemClass} ${stateClass} group`}
        >
          {inner}
          {item.right && !collapsed && (
            <span className="hidden lg:flex items-center shrink-0 ml-auto">{item.right}</span>
          )}
        </Link>
      );
    }

    if (item.right) {
      return (
        <div
          key={item.id}
          className={`${navItemClass} ${stateClass} group relative !pr-1.5`}
          title={item.label}
        >
          <button
            type="button"
            onClick={() => onSelect?.(item.id)}
            aria-current={active ? "page" : undefined}
            className="flex-1 min-w-0 h-full flex items-center gap-2.5 text-left cursor-pointer overflow-hidden focus:outline-none"
          >
            {inner}
          </button>
          {!collapsed && (
            <div className="hidden lg:flex items-center shrink-0 ml-auto z-10">
              {item.right}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect?.(item.id)}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className={`${navItemClass} ${stateClass}`}
      >
        {inner}
      </button>
    );
  };

  const brandNode = (
    <>
      {logo ?? (
        <span className="w-6 h-6 rounded-lg bg-white/[0.08] text-white flex items-center justify-center shrink-0">
          <Icon name={logoIcon} className="w-3.5 h-3.5 text-primary-400" />
        </span>
      )}
      <span className="hidden lg:block truncate text-[13px] font-semibold text-white tracking-tight">
        {productName}
      </span>
    </>
  );

  return (
    <PageActionsProvider>
      <div className={SHELL_OUTER}>
        {/* Left floating Bento sidebar (md+; phones use MobileTabBar at bottom) */}
        <aside className={`${SHELL_ASIDE} ${collapsed ? "w-14" : "w-14 lg:w-52"}`}>
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden p-2 gap-2.5">
            {/* Brand + collapse toggle */}
            <div
              className={`h-8 flex items-center gap-2 ${
                collapsed ? "justify-center" : "justify-center lg:justify-between lg:pl-1.5"
              }`}
            >
              {firstItem?.href && !onSelect ? (
                <Link
                  href={firstItem.href}
                  className={`min-w-0 items-center gap-2 text-left ${collapsed ? "hidden" : "flex"}`}
                  aria-label={productName}
                >
                  {brandNode}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => firstItem && onSelect?.(firstItem.id)}
                  className={`min-w-0 items-center gap-2 text-left cursor-pointer ${collapsed ? "hidden" : "flex"}`}
                  aria-label={productName}
                >
                  {brandNode}
                </button>
              )}
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
                title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
                className={`${
                  collapsed ? "flex" : "hidden lg:flex"
                } w-7 h-7 rounded-lg items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] transition shrink-0 cursor-pointer`}
              >
                <Icon name="sidebar" className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional primary CTA (e.g. Slicer) */}
            {primaryCta &&
              (primaryCta.href ? (
                <Link
                  href={primaryCta.href}
                  target={primaryCta.external ? "_blank" : undefined}
                  rel={primaryCta.external ? "noopener noreferrer" : undefined}
                  title={primaryCta.label}
                  className={`w-full h-9 rounded-lg bg-primary-500/15 hover:bg-primary-500/25 border border-primary-500/30 hover:border-primary-500/50 text-white flex items-center text-[12px] font-semibold transition active:scale-[0.99] ${
                    collapsed ? "justify-center" : "justify-center lg:justify-start lg:gap-2 lg:px-2.5"
                  }`}
                >
                  <span className="w-5 h-5 rounded bg-primary-500 text-white flex items-center justify-center shrink-0">
                    <Icon name={primaryCta.icon} className="w-3.5 h-3.5" />
                  </span>
                  <span className={navLabelClass}>{primaryCta.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={primaryCta.onClick}
                  title={primaryCta.label}
                  className={`w-full h-9 rounded-lg bg-primary-500/15 hover:bg-primary-500/25 border border-primary-500/30 hover:border-primary-500/50 text-white flex items-center text-[12px] font-semibold transition active:scale-[0.99] cursor-pointer ${
                    collapsed ? "justify-center" : "justify-center lg:justify-start lg:gap-2 lg:px-2.5"
                  }`}
                >
                  <span className="w-5 h-5 rounded bg-primary-500 text-white flex items-center justify-center shrink-0">
                    <Icon name={primaryCta.icon} className="w-3.5 h-3.5" />
                  </span>
                  <span className={navLabelClass}>{primaryCta.label}</span>
                </button>
              ))}

            {/* Navigation sections */}
            {sections.map((section, idx) => (
              <React.Fragment key={section.label ?? idx}>
                {idx > 0 && <div className="my-0.5 mx-1.5 border-t border-divider" />}
                <nav aria-label={section.label ?? `Menu ${idx + 1}`} className="flex flex-col gap-0.5">
                  {section.loading ? (
                    Array.from({ length: section.loadingCount ?? 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-full h-8 flex items-center rounded-lg ${
                          collapsed ? "justify-center" : "justify-center lg:justify-start lg:gap-2.5 lg:px-2.5"
                        }`}
                        aria-hidden
                      >
                        <div className="w-4 h-4 rounded shimmer shrink-0" />
                        <div
                          className={`${collapsed ? "hidden" : "hidden lg:block"} h-3 rounded shimmer`}
                          style={{ width: `${55 + ((i * 19) % 35)}%` }}
                        />
                      </div>
                    ))
                  ) : (
                    section.items.map(renderNavEntry)
                  )}
                </nav>
              </React.Fragment>
            ))}
          </div>

          {/* Sidebar footer */}
          {footer && (
            <div className="shrink-0 p-2 border-t border-divider">
              {typeof footer === "function" ? footer({ collapsed }) : footer}
            </div>
          )}
        </aside>

        {/* Right floating Bento content panel */}
        <main className={`${SHELL_MAIN} ${TAB_BAR_PAD}`}>
          <div className={`${SHELL_CONTAINER} ${containerClassName}`}>
            <PageActionsSlot className="empty:hidden ml-auto mb-2 sticky top-0 max-md:top-[env(safe-area-inset-top)] z-30" />
            {children}
          </div>
        </main>

        {/* Mobile bottom sheet when the app has more routes than fit on MobileTabBar */}
        {hasMoreSheet && moreOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col justify-end pb-16"
            onClick={() => setMoreOpen(false)}
          >
            <div
              className="bg-field border-t border-line rounded-t-2xl p-4 max-h-[75dvh] overflow-y-auto space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-1">
                <span className="font-display text-[15px] font-semibold text-white">{productName}</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Đóng"
                  className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-gray-300"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {allItems.map((item) => {
                  const active = activeId === item.id;
                  const cls = `flex items-center gap-2.5 h-10 px-3 rounded-xl text-[12px] font-medium transition ${
                    active ? "bg-white/[0.10] text-white" : "bg-white/[0.04] text-gray-300"
                  }`;
                  if (item.href && !onSelect) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cls}
                      >
                        <Icon name={item.icon} className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect?.(item.id);
                        setMoreOpen(false);
                      }}
                      className={cls}
                    >
                      <Icon name={item.icon} className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {footer && (
                <div className="pt-2 border-t border-divider">
                  {typeof footer === "function" ? footer({ collapsed: false }) : footer}
                </div>
              )}
            </div>
          </div>
        )}

        <MobileTabBar
          tabs={mobileTabs}
          active={activeId}
          onSelect={onSelect}
          moreOpen={moreOpen}
          onToggleMore={hasMoreSheet ? () => setMoreOpen((v) => !v) : undefined}
        />
      </div>
    </PageActionsProvider>
  );
}
