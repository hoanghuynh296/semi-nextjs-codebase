// Bento content card (docs/DESIGN_SYSTEM.md §5): CARD / CARD_HOVER / CARD_ACTIVE as a component.
// The surface is fixed (bg-card, no visible border in Flat / Soft; `bordered` = bg-panel + border-line) and it pads itself (p-card): pass layout in className, never a
// background or shadow (semi-lint card-class-override). For a tinted card use TONAL_CONTAINER on a plain element instead.
import React from "react";
import { CARD, CARD_ACTIVE, CARD_BORDERED, CARD_BORDERED_HOVER, CARD_HOVER } from "../styles/surfaces";
import { FOCUS_RING, cn } from "../styles/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clickable card (opens a detail view): hover border + press scale. */
  interactive?: boolean;
  /** "On" / selected card: primary border, no glow. On a card with onClick it is also its pressed state (aria-pressed). */
  active?: boolean;
  /** Framed card for dense data views (a table or rows that need an edge): panel fill + 1px line instead of the borderless card surface. */
  bordered?: boolean;
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

/**
 * With `onClick` the card is a button for keyboards and screen readers too: role="button", in the tab order, Enter and
 * Space click it, FOCUS_RING shows focus (a plain <div onClick> is mouse-only). `active` is then its pressed state.
 * A card that opens another page wraps a next/link around its title instead.
 */
export function Card({ interactive = false, active, bordered = false, padding = "card", className = "", onClick, onKeyDown, ...rest }: CardProps) {
  const pad = HAS_PADDING.test(className) ? "" : PADDING[padding];
  const clickable = Boolean(onClick);
  const keys = clickable
    ? {
        ...(active !== undefined && !rest.role ? { "aria-pressed": active } : {}),
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(e);
          if (e.defaultPrevented || e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        },
      }
    : { onKeyDown };
  return (
    <div
      className={cn(interactive || clickable ? (bordered ? CARD_BORDERED_HOVER : CARD_HOVER) : bordered ? CARD_BORDERED : CARD, active && CARD_ACTIVE, pad, clickable && cn("text-left cursor-pointer", FOCUS_RING), className)}
      {...rest}
      role={clickable ? (rest.role ?? "button") : rest.role}
      tabIndex={clickable ? (rest.tabIndex ?? 0) : rest.tabIndex}
      onClick={onClick}
      {...keys}
    />
  );
}
