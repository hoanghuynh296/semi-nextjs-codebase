"use client";

// A card for a gallery or discovery rail (C-014, #191): 16:9 media (image, video, any node) at the card radius, a
// 14 / 500 caption and an optional meta line, with two optional slots over the media (top left, bottom right) that take
// any node: a Badge tone="overlay", an Avatar + name, a Button size="pill". The whole card is one link (href) or one
// button (onClick); the slots sit beside that control (never inside it), so a pill button in a slot is its own control.
import React, { useId } from "react";
import Link from "next/link";
import { AspectRatio } from "./AspectRatio";
import { FOCUS_RING, cn } from "../styles/utils";

interface MediaCardBase {
  /** The media: an `<img>`, a `<video>` or any node; it fills the frame (`object-cover`). Decorative images: `alt=""`. */
  media: React.ReactNode;
  /** Caption under the media (14 / 500, strong, one line with …). It names the card's link or button. */
  title: React.ReactNode;
  /** Optional meta line under the caption, in the overline style (a category, a count, a date). */
  meta?: React.ReactNode;
  /** Optional slot at the media's top left, any node: usually `<Badge tone="overlay">`. Nothing renders without it. */
  topLeft?: React.ReactNode;
  /** Optional slot at the media's bottom right, any node: an Avatar + name, a `<Button size="pill">`. Nothing renders without it. */
  bottomRight?: React.ReactNode;
  /** Width / height of the media frame. @default 16 / 9 */
  ratio?: number;
  /** Accessible name of the card's link or button when the caption alone is not enough (default: the caption). */
  label?: string;
  className?: string;
}

export type MediaCardProps = MediaCardBase &
  (
    | { /** Route or URL the card opens (`next/link`). */ href: string; onClick?: never }
    | { href?: never; /** The card is a button that runs this. */ onClick: () => void }
  );

/**
 * Gallery / rail card. Hover (devices that hover) scales the media to 1.05 in 300ms ease-out (`--motion-slide`);
 * `prefers-reduced-motion` keeps it still. Keyboard: Tab reaches the card (focus ring around the whole card), Enter
 * opens it (Space too for the button form); slot buttons follow it in the tab order.
 */
export function MediaCard({ media, title, meta, topLeft, bottomRight, ratio = 16 / 9, label, className, ...action }: MediaCardProps) {
  const titleId = useId();
  const cover = cn("absolute inset-0 z-0 rounded-card cursor-pointer", FOCUS_RING);
  const named = label ? { "aria-label": label } : { "aria-labelledby": titleId };
  // the slots sit over the media and above the cover (z-10); only their controls take the pointer, so a badge never
  // blocks opening the card. The cover comes after the media in the DOM, so it paints over it and takes its clicks.
  const slot = "absolute z-10 max-w-[calc(100%-1rem)] pointer-events-none [&_:is(a,button,input,select,textarea,[tabindex])]:pointer-events-auto";
  return (
    <div data-media-card="" className={cn("group relative flex flex-col gap-2 min-w-0", className)}>
      <AspectRatio ratio={ratio} className="rounded-card bg-field">
        <div className="size-full *:size-full *:object-cover [transition:scale_var(--motion-slide)] motion-safe:group-hover:scale-105">
          {media}
        </div>
        {topLeft && <div className={cn(slot, "top-2 left-2")}>{topLeft}</div>}
        {bottomRight && <div className={cn(slot, "bottom-2 right-2")}>{bottomRight}</div>}
      </AspectRatio>
      <div className="min-w-0 flex flex-col">
        <p id={titleId} className="text-ui font-medium text-strong truncate">
          {title}
        </p>
        {meta && <p className="text-overline text-muted truncate">{meta}</p>}
      </div>
      {action.href !== undefined ? (
        <Link href={action.href} className={cover} {...named} />
      ) : (
        <button type="button" onClick={action.onClick} className={cover} {...named} />
      )}
    </div>
  );
}
