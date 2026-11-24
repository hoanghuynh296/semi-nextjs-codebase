"use client";

// Bento content card (docs/DESIGN_SYSTEM.md §5): CARD / CARD_HOVER / CARD_ACTIVE as a component.
// The surface is fixed (bg-card, no visible border; `bordered` = bg-panel + border-line) and it pads itself (p-card):
// pass layout in className, never a background or shadow (semi-lint card-class-override).
// 1.0 (#149, #127): `selectable` adds a corner checkbox as a sibling of the open button (never nested interactive
// controls), keyboard accessible, using `bg-item-checked` when checked and `bg-item-selected` when `selected`.
import React, { useId } from "react";
import { Checkbox } from "./Choice";
import { useSemiLocale } from "./locale";
import { CARD, CARD_ACTIVE, CARD_BORDERED, CARD_BORDERED_HOVER, CARD_HOVER } from "../styles/surfaces";
import { FOCUS_RING, cn } from "../styles/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clickable card (opens a detail view): hover border + press scale. */
  interactive?: boolean;
  /** "On" / selected card: outline border, no glow. On a non-selectable card with onClick it is also its pressed state (aria-pressed). */
  active?: boolean;
  /** Framed card for dense data views (a table or rows that need an edge): panel fill + 1px line instead of the borderless card surface. */
  bordered?: boolean;
  /**
   * Inner padding: `"card"` = p-card (16px at regular density, the default), `"panel"` = p-card sm:p-panel (a roomy
   * card, 24px from sm), `"none"` for an image or a table that runs to the edge. A padding class in `className`
   * (p-*, px-*, py-*) replaces it.
   */
  padding?: "card" | "panel" | "none";
  /**
   * Selection mode (#149, #127): renders a corner checkbox as a sibling of the card's open button (zero nested
   * interactive controls) so the card can be checked separately from opening it, by pointer or keyboard.
   */
  selectable?: boolean;
  /** Checked state in selection mode (`bg-item-checked`). */
  checked?: boolean;
  /** Called when the card's selection checkbox toggles. */
  onCheckedChange?: (checked: boolean) => void;
  /** Open / active record state (`bg-item-selected`, `border-outline-line`). */
  selected?: boolean;
  /** Accessible name of the card's open action (also used to build the default checkbox name `"Chọn <label>"`). */
  label?: string;
  /** Override accessible name of the selection checkbox. */
  selectLabel?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const PADDING = { card: "p-card", panel: "p-card sm:p-panel", none: "" } as const;
const HAS_PADDING = /(?:^|\s)(?:[a-z0-9-]+:)*p[xytrbl]?-/;

/**
 * With `onClick` the card is a button for keyboards and screen readers too: role="button", in the tab order, Enter and
 * Space click it, FOCUS_RING shows focus (a plain <div onClick> is mouse-only). `active` is then its pressed state.
 * With `selectable`, the outer element stays a plain container and renders sibling Checkbox + open button controls
 * so checking and opening never nest interactive elements.
 */
export function Card({
  interactive = false,
  active,
  bordered = false,
  padding = "card",
  selectable = false,
  checked = false,
  onCheckedChange,
  selected = false,
  label,
  selectLabel,
  className = "",
  onClick,
  onKeyDown,
  children,
  ...rest
}: CardProps) {
  const t = useSemiLocale();
  const bodyId = useId();
  const pad = HAS_PADDING.test(className) ? "" : PADDING[padding];
  const clickable = Boolean(onClick);
  const stateFill = selected ? "!bg-item-selected" : checked ? "!bg-item-checked" : undefined;

  if (selectable) {
    const checkAria = selectLabel ?? (label ? t.selectItem(label) : t.selectRow);
    return (
      <div
        className={cn(
          "group relative",
          interactive || clickable ? (bordered ? CARD_BORDERED_HOVER : CARD_HOVER) : bordered ? CARD_BORDERED : CARD,
          (active || selected || checked) && CARD_ACTIVE,
          stateFill,
          pad,
          className,
        )}
        {...rest}
      >
        <div
          className={cn(
            "absolute top-3 right-3 z-10 flex items-center",
            padding === "none" && "rounded-chip bg-panel/90 p-0.5",
          )}
        >
          <Checkbox checked={checked} onChange={(on) => onCheckedChange?.(on)} aria-label={checkAria} />
        </div>
        {clickable && (
          <button
            type="button"
            onClick={(e) => onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)}
            aria-label={label}
            aria-labelledby={label ? undefined : bodyId}
            aria-current={selected ? "true" : undefined}
            className={cn("absolute inset-0 rounded-card cursor-pointer", FOCUS_RING)}
          />
        )}
        <div id={bodyId} className={cn("relative min-w-0", clickable && "pointer-events-none", padding !== "none" && "pr-7")}>
          {children}
        </div>
      </div>
    );
  }

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
      className={cn(
        interactive || clickable ? (bordered ? CARD_BORDERED_HOVER : CARD_HOVER) : bordered ? CARD_BORDERED : CARD,
        (active || selected) && CARD_ACTIVE,
        stateFill,
        pad,
        clickable && cn("text-left cursor-pointer", FOCUS_RING),
        className,
      )}
      {...rest}
      role={clickable ? (rest.role ?? "button") : rest.role}
      tabIndex={clickable ? (rest.tabIndex ?? 0) : rest.tabIndex}
      aria-current={selected ? "true" : rest["aria-current"]}
      onClick={onClick}
      {...keys}
    >
      {children}
    </div>
  );
}
