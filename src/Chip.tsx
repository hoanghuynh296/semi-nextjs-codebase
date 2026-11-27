"use client";

// On/off toggle chip (multi-select filters, outcome pickers) + the shared chip colours.
// No border on chips and tags (#190, C-014 / C-015): off = the subtle button fill (bg-subtle-button, hover one step up),
// on = its tint (bg-raised, or the tone's) plus a leading check, so the state never rests on colour alone. The only
// per-item colour is a leading dot (TONE_DOT) or icon (chipIconClass) in the tone of what it filters.
// On a touch phone (pointer-coarse + max-sm) a chip grows to at least 44 × 44px (the BTN_HIT pair, real size, so chips
// in a row never share a tap point); with a mouse it stays 34px.
import React from "react";
import { Icon, TONE_TEXT, type TileTone } from "./Icon";
import { type SemanticTone, TONAL_SURFACE } from "../styles/surfaces";

export const CHIP_BASE =
  "shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 h-control pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11 rounded-full text-ui font-medium whitespace-nowrap transition-hover motion-safe:active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer";

const CHIP_ON = "bg-raised text-strong";

const CHIP_OFF = "bg-subtle-button text-body hover:text-strong hover:bg-tint-hover";

/** Leading check of a selected chip (the non-colour cue). A hand-built chip (CHIP_BASE + chipClass) adds it itself:
 * `{active && <Icon name="check" className={CHIP_CHECK} />}`. */
export const CHIP_CHECK = "w-3.5 h-3.5 -ml-0.5";

/** Colour classes of a filter chip (add CHIP_BASE + your own size; when active, a leading CHIP_CHECK icon). Same for every chip. */
export const chipClass = (active: boolean) => (active ? CHIP_ON : CHIP_OFF);

/** Text colour of a chip's leading icon: the item's tone (kept when selected, the background is what changes). */
export const chipIconClass = (tone: TileTone = "green") => TONE_TEXT[tone];

/** Static tag (a filament's brand / type on a card): same neutral background for every tag, no border. */
export const TAG = "inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-field text-chrome font-medium text-muted";

/** Solid dot in a tone (material / category chips and tags). */
export const TONE_DOT: Record<TileTone, string> = {
  green: "bg-success-solid",
  emerald: "bg-emerald-400",
  orange: "bg-orange-400",
  rose: "bg-rose-400",
  pink: "bg-pink-400",
  sky: "bg-sky-400",
  blue: "bg-blue-400",
  indigo: "bg-indigo-400",
  violet: "bg-indigo-400",
  purple: "bg-purple-400",
  cyan: "bg-cyan-400",
  teal: "bg-teal-400",
  amber: "bg-amber-400",
  gray: "bg-muted",
};

export function Chip({
  active,
  onClick,
  children,
  title,
  tone,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  /** Tint of the chip while active (its tone's 10% fill and text). Default: the neutral raised surface. Either way an active chip shows a leading check. */
  tone?: SemanticTone;
  className?: string;
}) {
  const activeStyle = tone && TONAL_SURFACE[tone] ? TONAL_SURFACE[tone] : CHIP_ON;
  const chipStyle = active ? activeStyle : CHIP_OFF;
  return (
    <button data-semi="Chip"
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`${CHIP_BASE} ${chipStyle} ${className}`}
    >
      {active && <Icon name="check" className={CHIP_CHECK} />}
      {children}
    </button>
  );
}
