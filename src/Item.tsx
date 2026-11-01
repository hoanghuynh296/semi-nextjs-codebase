"use client";

// A list row: a leading icon / avatar / image, a title with a description, meta on the right and actions. ItemGroup
// stacks rows in a card with dividers (settings lists, files, members, notifications).
import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { CARD } from "../styles/surfaces";
import { FOCUS_RING, cn } from "../styles/utils";

export function Item({
  icon,
  media,
  title,
  description,
  meta,
  actions,
  href,
  onClick,
  className,
}: {
  /** A leading icon (or pass `media` for an Avatar, IconTile or image). */
  icon?: IconName;
  media?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned detail: a value, a Badge, a time. */
  meta?: React.ReactNode;
  /** Buttons or a Menu at the end (stay clickable on a linked row). */
  actions?: React.ReactNode;
  /** Make the whole row a link (next/link). */
  href?: string;
  /** Make the whole row a button. */
  onClick?: () => void;
  className?: string;
}) {
  const main = (
    <>
      {media ?? (icon && <Icon name={icon} className="w-4 h-4 text-muted shrink-0" />)}
      <span className="min-w-0 flex-1">
        <span className="block text-ui font-medium text-contrast truncate">{title}</span>
        {description && <span className="block text-label text-muted truncate">{description}</span>}
      </span>
      {meta && <span className="shrink-0 text-label text-muted tabular-nums">{meta}</span>}
      {(href || onClick) && !actions && <Icon name="chevron" className="w-4 h-4 text-muted shrink-0" />}
    </>
  );
  const rowCls = "flex items-center gap-3 min-w-0 flex-1 text-left";
  return (
    <div className={cn("relative flex items-center gap-3 px-4 py-3", (href || onClick) && "hover:bg-field/60 transition-colors", className)}>
      {href ? (
        <Link href={href} className={cn(rowCls, "after:absolute after:inset-0 rounded-control", FOCUS_RING)}>
          {main}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cn(rowCls, "after:absolute after:inset-0 rounded-control", FOCUS_RING)}>
          {main}
        </button>
      ) : (
        <div className={rowCls}>{main}</div>
      )}
      {actions && <div className="relative z-10 flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

/** Rows in a card with dividers; `label` names the list for screen readers (and shows above it when visible). */
export function ItemGroup({ label, showLabel = false, className, children }: { label: string; showLabel?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className={cn("space-y-2", className)}>
      {showLabel && <h3 className="px-1 text-label font-medium text-muted">{label}</h3>}
      <div className={cn(CARD, "divide-y divide-divider overflow-hidden")}>{children}</div>
    </section>
  );
}
