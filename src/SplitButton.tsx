"use client";

// One way to start one job (G1): the main action and a ▾ that opens a Menu of the other ways to do it
// ("Thêm khách hàng" | ▾ Nhập từ file, Tìm trong Data Hub). One filled button in total; on phones one button opens
// the whole list, the main action first.
import React from "react";
import { Button } from "./Button";
import { ButtonGroup } from "./ButtonGroup";
import { Icon, type IconName } from "./Icon";
import { Menu, type MenuItem } from "./Overlay";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export function SplitButton({
  label,
  icon,
  onClick,
  items,
  menuLabel,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  collapseOnPhone: collapseOnPhoneProp,
  className,
}: {
  /** The main action ("Thêm khách hàng"). */
  label: string;
  icon?: IconName;
  onClick: () => void;
  /** The other ways to do the same job (manual, import, copy from another system). Danger items go last. */
  items: MenuItem[];
  /** Accessible name of the ▾ button and of its menu (default "Thao tác khác"). */
  menuLabel?: string;
  /**
   * `primary` (brand) for the view's one main action (G7), `inverse` for the main action of a card or a list title row,
   * `subtle` elsewhere; `secondary` is the brand secondary.
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "inverse" | "subtle" | "surface";
  size?: "sm" | "md";
  /** The main action is running: spinner and no clicks on the main half; the ▾ stays usable. */
  loading?: boolean;
  /** Disables both halves. */
  disabled?: boolean;
  /**
   * Stretch to fill its container (e.g. a `WorkspaceLayout` pinned action): the main half takes `flex-1` while the ▾
   * keeps its width, and `collapseOnPhone` defaults to `false` so phones keep the full-width split button.
   */
  fullWidth?: boolean;
  /**
   * Below `sm`, show one button (the icon, or the label with ▾) that opens a menu with the main action first.
   * Defaults to `false` when `fullWidth` is set, otherwise `true`.
   */
  collapseOnPhone?: boolean;
  className?: string;
}) {
  const t = useSemiLocale();
  const collapseOnPhone = collapseOnPhoneProp ?? !fullWidth;
  const more = menuLabel ?? t.moreActions;
  const visible = items.filter((it) => !it.hidden);
  const divider =
    variant === "primary"
      ? "border-l border-on-primary/25"
      : variant === "secondary"
        ? "border-l border-on-secondary/25"
        : variant === "inverse"
          ? "border-l border-on-inverted/25"
          : "border-l border-divider";
  const wide = (
    <ButtonGroup label={label} fullWidth={fullWidth} className={cn(collapseOnPhone && "max-sm:hidden", className)}>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        loading={loading}
        disabled={disabled}
        onClick={onClick}
        className={fullWidth ? "flex-1 min-w-0" : undefined}
      >
        {label}
      </Button>
      {visible.length > 0 && (
        <Menu
          label={more}
          items={items}
          // data-split-menu: the density audit counts the two halves as one primary (G7)
          trigger={
            <Button variant={variant} size={size} iconOnly icon="chevronDown" aria-label={more} disabled={disabled} className={divider} data-split-menu="" />
          }
        />
      )}
    </ButtonGroup>
  );
  if (!collapseOnPhone) return wide;
  const all: MenuItem[] = [{ label, icon, onSelect: onClick, loading, disabled }, ...items];
  return (
    <>
      {wide}
      <span className={cn("sm:hidden", fullWidth ? "flex w-full" : "inline-flex", className)}>
        <Menu
          label={label}
          items={all}
          trigger={
            icon && !fullWidth ? (
              <Button variant={variant} size={size} iconOnly icon={icon} aria-label={label} disabled={disabled} />
            ) : (
              <Button variant={variant} size={size} icon={icon} fullWidth={fullWidth} disabled={disabled}>
                {label}
                <Icon name="chevronDown" className="w-3.5 h-3.5" />
              </Button>
            )
          }
        />
      </span>
    </>
  );
}
