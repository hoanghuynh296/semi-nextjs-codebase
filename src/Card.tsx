// Bento content card (docs/DESIGN_SYSTEM.md §5): CARD / CARD_HOVER / CARD_ACTIVE as a component.
// The surface is fixed (bg-panel, border-line, no shadow) and it pads itself (p-card): pass layout in className, never a
// background or shadow (semi-lint card-class-override). For a tinted card use TONAL_CONTAINER on a plain element instead.
import React from "react";
import { CARD, CARD_ACTIVE, CARD_HOVER } from "../styles/surfaces";
import { cn } from "../styles/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clickable card (opens a detail view): hover border + press scale. */
  interactive?: boolean;
  /** "On" / selected card: primary border, no glow. */
  active?: boolean;
  /**
   * Inner padding: `"card"` = p-card (16px at regular density, the default), `"panel"` = p-card sm:p-panel (a roomy
   * card, 24px from sm), `"none"` for an image or a table that runs to the edge. A padding class in `className`
   * (p-*, px-*, py-*) replaces it.
   */
  padding?: "card" | "panel" | "none";
  ref?: React.Ref<HTMLDivElement>;
}

const PADDING = { card: "p-card", panel: "p-card sm:p-panel", none: "" } as const;
const HAS_PADDING = /(?:^|\s)(?:[a-z0-9-]+:)*p[xytrbl]?-/;

export function Card({ interactive = false, active = false, padding = "card", className = "", ...rest }: CardProps) {
  const pad = HAS_PADDING.test(className) ? "" : PADDING[padding];
  return <div className={cn(interactive ? CARD_HOVER : CARD, active && CARD_ACTIVE, pad, className)} {...rest} />;
}
