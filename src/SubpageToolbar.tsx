"use client";

// Unified sticky sub-page toolbar row (docs/DESIGN_SYSTEM.md §4a):
// - Left slot: filter pills / chips / CustomSelect dropdowns
// - Right slot: icon-only primary CTA (BTN_PRIMARY BTN_ICON) + SearchInput + RefreshButton (+ optional extra controls)
import React from "react";
import { useSemiLocale } from "./locale";
import { Icon, type IconName } from "./Icon";
import { SearchInput } from "./SearchInput";
import { RefreshButton } from "./RefreshButton";
import { BTN_ICON, BTN_PRIMARY } from "../styles/buttons";
import { STICKY_TOOLBAR } from "../styles/surfaces";

export function SubpageToolbar({
  left,
  right,
  onPrimaryAction,
  primaryActionLabel: primaryActionLabelProp,
  primaryActionIcon = "plus",
  searchValue,
  onSearchChange,
  searchPlaceholder: searchPlaceholderProp,
  onRefresh,
  className = "",
}: {
  /** Filter controls on the left (Pills, Chip, CustomSelect). */
  left?: React.ReactNode;
  /** Optional extra controls on the right (placed before the primary icon button). */
  right?: React.ReactNode;
  /** Click handler for the icon-only primary CTA button (e.g. "Thêm"). */
  onPrimaryAction?: () => void;
  /** Accessible title & aria-label for the icon-only primary CTA button. */
  primaryActionLabel?: string;
  /** Icon for the primary CTA button (default: "plus"). */
  primaryActionIcon?: IconName;
  /** Search query value (renders a SearchInput when onSearchChange is provided). */
  searchValue?: string;
  /** Search change handler. */
  onSearchChange?: (val: string) => void;
  /** Placeholder for SearchInput. */
  searchPlaceholder?: string;
  /** Async or sync reload callback (renders RefreshButton when provided). */
  onRefresh?: () => Promise<unknown> | unknown;
  className?: string;
}) {
  const t = useSemiLocale();
  const primaryActionLabel = primaryActionLabelProp ?? t.add;
  const searchPlaceholder = searchPlaceholderProp ?? t.search;
  return (
    <div className={`${STICKY_TOOLBAR} flex flex-wrap items-center justify-between gap-2.5 min-w-0 mb-5 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap min-w-0">{left}</div>
      <div className="flex flex-wrap items-center gap-2 ml-auto shrink-0 max-sm:w-full max-sm:justify-end">
        {right}
        {onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className={`${BTN_PRIMARY} ${BTN_ICON}`}
            title={primaryActionLabel}
            aria-label={primaryActionLabel}
          >
            <Icon name={primaryActionIcon} className="w-4 h-4" />
          </button>
        )}
        {onSearchChange !== undefined && (
          <SearchInput
            value={searchValue ?? ""}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}
        {onRefresh && <RefreshButton onRefresh={onRefresh} />}
      </div>
    </div>
  );
}
