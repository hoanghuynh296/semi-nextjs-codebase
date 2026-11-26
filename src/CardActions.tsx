"use client";

// Quick actions on a card or media tile (L10): round icon buttons that show on hover or keyboard focus where the
// device can hover, and one always-visible ⋯ with every action on touch screens. Put it inside a `group relative`
// card; it sits in the top right corner.
import React from "react";
import { Icon, type IconName } from "./Icon";
import { Menu, type MenuItem } from "./Overlay";
import { cn, HIT_AREA } from "../styles/utils";

export interface CardAction {
  icon: IconName;
  /** Accessible name and tooltip ("Gửi hỏi giá"). */
  label: string;
  onClick: () => void;
}

const ROUND =
  "w-8 h-8 rounded-full bg-panel-4/90 backdrop-blur text-strong hover:bg-panel-4 shadow-card flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus";

/** The ⋯ trigger: a plain element, so Menu can add its ref, handlers and aria-* to it. */
const moreButton = (label: string) => (
  <button type="button" aria-label={label} title={label} className={cn("relative", ROUND, HIT_AREA)}>
    <Icon name="more" className="w-4 h-4" />
  </button>
);

export function CardActions({
  actions = [],
  menu,
  label,
  className,
}: {
  /** One or two icon actions shown on hover (on touch they move into the ⋯ menu). */
  actions?: CardAction[];
  /** The rest, in the ⋯ menu (danger last). */
  menu?: MenuItem[];
  /** Name of the ⋯ menu, with the item it acts on: "Thao tác với Gia vị Tây Nguyên". Required: on touch it is the only control. */
  label: string;
  className?: string;
}) {
  const all: MenuItem[] = [...actions.map((a) => ({ label: a.label, icon: a.icon, onSelect: a.onClick })), ...(menu ?? [])];
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    // clicks here must not open the card underneath
    <div role="group" aria-label={label} onClick={stop} className={cn("absolute top-2 right-2 z-10 flex gap-1.5", className)}>
      <div className="hidden [@media(hover:hover)]:flex gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100 transition-opacity">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} aria-label={a.label} title={a.label} className={ROUND}>
            <Icon name={a.icon} className="w-4 h-4" />
          </button>
        ))}
        {menu && menu.some((m) => !m.hidden) && <Menu label={label} items={menu} trigger={moreButton(label)} />}
      </div>
      {all.some((m) => !m.hidden) && (
        <div className="[@media(hover:hover)]:hidden">
          <Menu label={label} items={all} trigger={moreButton(label)} />
        </div>
      )}
    </div>
  );
}
