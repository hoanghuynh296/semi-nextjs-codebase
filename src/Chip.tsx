"use client";

// On/off toggle chip (multi-select filters, outcome pickers) + the shared chip colours.
// Every chip and tag shares one background: neutral when off, primary tint when selected. The only per-item colour is
// a leading dot (TONE_DOT) or icon (chipIconClass) in the tone of what it filters (a material, a device category).
import React from "react";
import { TONE_TEXT, type TileTone } from "./Icon";

export const CHIP_BASE =
  "shrink-0 inline-flex items-center gap-1.5 px-3.5 h-[34px] rounded-full text-[12px] font-medium whitespace-nowrap border transition cursor-pointer";

const CHIP_ON = "bg-raised border-line text-contrast";

const CHIP_OFF = "bg-transparent border-transparent text-muted hover:text-contrast hover:bg-field";

/** Colour classes of a filter chip (add CHIP_BASE + your own size). Same for every chip. */
export const chipClass = (active: boolean) => (active ? CHIP_ON : CHIP_OFF);

/** Text colour of a chip's leading icon: the item's tone (kept when selected, the background is what changes). */
export const chipIconClass = (tone: TileTone = "green") => TONE_TEXT[tone];

/** Static tag (a filament's brand / type on a card): same neutral background for every tag. */
export const TAG = "inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-field border border-line text-[11px] font-medium text-muted";

/** Solid dot in a tone (material / category chips and tags). */
export const TONE_DOT: Record<TileTone, string> = {
  green: "bg-primary-400",
  pink: "bg-pink-400",
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  violet: "bg-indigo-400",
  gray: "bg-muted",
};

export function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={title} aria-pressed={active} className={`${CHIP_BASE} ${chipClass(active)}`}>
      {children}
    </button>
  );
}
