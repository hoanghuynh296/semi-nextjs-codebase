"use client";

// Phones (< md): native-style bottom tab bar with up to 6 primary navigation items.
import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";

export interface MobileTabItem {
  id: string;
  icon: IconName;
  title: string;
  shortTitle?: string;
  href?: string;
}

/** Height of the bar above the safe area; AppShell pads its main scroll area by this much. */
export const TAB_BAR_PAD = "max-md:pb-[calc(4rem+env(safe-area-inset-bottom))]";

export function MobileTabBar({
  tabs,
  active,
  onSelect,
  moreOpen = false,
  onToggleMore,
  moreLabel = "Menu",
}: {
  tabs: MobileTabItem[];
  active: string;
  onSelect?: (id: string) => void;
  /** When the app has more routes than fit on the bottom bar, show a final "Menu" tab that opens a sheet. */
  moreOpen?: boolean;
  onToggleMore?: () => void;
  moreLabel?: string;
}) {
  const itemClass = (on: boolean) =>
    `flex-1 min-w-0 h-16 flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
      on ? "text-primary-400" : "text-muted"
    }`;

  const renderInner = (icon: IconName, label: string, on: boolean) => (
    <>
      <span className={`w-12 h-7 rounded-full flex items-center justify-center transition ${on ? "bg-primary-500/15" : ""}`}>
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <span className={`text-[11px] font-medium truncate max-w-full px-1 ${on ? "text-primary-300" : "text-muted"}`}>
        {label}
      </span>
    </>
  );

  return (
    <nav
      aria-label="Điều hướng"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-app/95 backdrop-blur-xl border-t border-divider pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] select-none"
    >
      <div className="flex items-stretch">
        {tabs.map((t) => {
          const on = !moreOpen && active === t.id;
          const label = t.shortTitle ?? t.title;
          if (t.href && !onSelect) {
            return (
              <Link
                key={t.id}
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={itemClass(on)}
              >
                {renderInner(t.icon, label, on)}
              </Link>
            );
          }
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect?.(t.id)}
              aria-current={on ? "page" : undefined}
              className={itemClass(on)}
            >
              {renderInner(t.icon, label, on)}
            </button>
          );
        })}
        {onToggleMore && (
          <button
            type="button"
            onClick={onToggleMore}
            aria-expanded={moreOpen}
            className={itemClass(moreOpen)}
          >
            {renderInner(moreOpen ? "close" : "menu", moreLabel, moreOpen)}
          </button>
        )}
      </div>
    </nav>
  );
}
