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
  collapseOnPhone = true,
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
  /** `primary` for the view's main action (G7: one filled primary per view), `secondary` elsewhere. */
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  /** The main action is running: spinner and no clicks on the main half; the ▾ stays usable. */
  loading?: boolean;
  /** Disables both halves. */
  disabled?: boolean;
  /**
   * Below `sm`, show one button (the icon, or the label with ▾) that opens a menu with the main action first.
   * @default true
   */
  collapseOnPhone?: boolean;
  className?: string;
}) {
  const t = useSemiLocale();
  const more = menuLabel ?? t.moreActions;
  const visible = items.filter((it) => !it.hidden);
  const divider = variant === "primary" ? "border-l border-on-primary/25" : "border-l border-divider";
  const wide = (
    <ButtonGroup label={label} className={cn(collapseOnPhone && "max-sm:hidden", className)}>
      <Button variant={variant} size={size} icon={icon} loading={loading} disabled={disabled} onClick={onClick}>
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
      <span className={cn("sm:hidden inline-flex", className)}>
        <Menu
          label={label}
          items={all}
          trigger={
            icon ? (
              <Button variant={variant} size={size} iconOnly icon={icon} aria-label={label} disabled={disabled} />
            ) : (
              <Button variant={variant} size={size} disabled={disabled}>
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
