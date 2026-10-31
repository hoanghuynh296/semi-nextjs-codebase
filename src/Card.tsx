// Bento content card (docs/DESIGN_SYSTEM.md §5): CARD / CARD_HOVER / CARD_ACTIVE as a component.
// The surface is fixed (bg-panel, border-line, no shadow): pass padding and layout in className, never a background
// or shadow (semi-lint card-class-override). For a tinted card use TONAL_CONTAINER on a plain element instead.
import React from "react";
import { CARD, CARD_ACTIVE, CARD_HOVER } from "../styles/surfaces";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clickable card (opens a detail view): hover border + press scale. */
  interactive?: boolean;
  /** "On" / selected card: primary border, no glow. */
  active?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

export function Card({ interactive = false, active = false, className = "", ...rest }: CardProps) {
  return <div className={`${interactive ? CARD_HOVER : CARD} ${active ? CARD_ACTIVE : ""} ${className}`} {...rest} />;
}
