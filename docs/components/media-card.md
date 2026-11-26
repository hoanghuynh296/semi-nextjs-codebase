# Media card

A card for a gallery or discovery rail: 16:9 media (image, video or any node) at the card radius, a 14 / 500 caption, an optional meta line in the overline style, and two optional slots over the media (top left, bottom right) that take any node. The whole card is one link or one button.

## When to use

- Galleries and discovery sections: videos, templates, collections, articles with a cover image.
- A horizontal rail under a SectionHeader, or a grid of cards that fills the width (recipes below).

## Use something else when

| Need | Use |
|---|---|
| A product or record with several fields and actions | Card (with CardActions) |
| A list row with a thumbnail | Item with media |
| Slides people step through one at a time | Carousel |
| A media frame without a card | AspectRatio |

## Import

```tsx
import { MediaCard, type MediaCardProps } from "@semi/ui";
```

## Examples

### Grid with slots

Badge tone="overlay" top left; an Avatar + name or a pill Button bottom right. The cards are buttons; the pill is its own control.

```tsx
"use client";

import { useState } from "react";
import { Avatar, Badge, Button, MediaCard } from "@semi/ui";

// Stand-in photos (inline SVG) so the example needs no image files; n turns the hue.
const photo = (n: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><g style="filter:hue-rotate(${n * 47}deg)"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/></g></svg>`,
  );

const ITEMS = [
  { title: "Hướng dẫn in mô hình kiến trúc", meta: "Video · 12 phút", author: "Lan Anh", video: "12:04" },
  { title: "Chậu cây mini in 3D", meta: "Mẫu in", author: "Minh Quân" },
  { title: "Kệ sách gấp gọn cho bàn làm việc", meta: "Mẫu in · Mới", author: "Thu Hà" },
  { title: "Tối ưu đường đi đầu in", meta: "Video · 8 phút", author: "Đức Huy", video: "8:31" },
];

export default function MediaCardGrid() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {/* the grid recipe: as many 220px+ columns as fit, cards share the rest */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6">
        {ITEMS.map((it, i) => (
          <MediaCard
            key={it.title}
            onClick={() => setOpened(it.title)}
            media={<img src={photo(i)} alt="" />}
            title={it.title}
            meta={it.meta}
            topLeft={it.video ? <Badge tone="overlay" icon="video">{it.video}</Badge> : undefined}
            bottomRight={
              it.video ? (
                <Button size="pill" variant="inverse" onClick={() => setOpened(`Lưu: ${it.title}`)}>
                  Lưu
                </Button>
              ) : (
                <Badge tone="overlay" className="gap-1.5 pl-0.5">
                  <Avatar name={it.author} size="sm" className="w-5 h-5" />
                  {it.author}
                </Badge>
              )
            }
          />
        ))}
      </div>
      <p role="status" className="text-ui text-muted">
        {opened ? `Đã mở: ${opened}` : "Chọn một thẻ."}
      </p>
    </div>
  );
}
```

### As a link

href makes the card a next/link; no slots.

```tsx
import { MediaCard } from "@semi/ui";

// Stand-in photos (inline SVG) so the example needs no image files; n turns the hue.
const photo = (n: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><g style="filter:hue-rotate(${n * 47}deg)"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/></g></svg>`,
  );

export default function MediaCardLink() {
  return (
    <div className="max-w-xs">
      <MediaCard href="#media-card-link" media={<img src={photo(0)} alt="" />} title="Bộ sưu tập mùa hè" meta="24 mẫu in" />
    </div>
  );
}
```

## API

### MediaCard

Gallery / rail card. Hover (devices that hover) scales the media to 1.05 in 300ms ease-out (`--motion-slide`);
`prefers-reduced-motion` keeps it still. Keyboard: Tab reaches the card (focus ring around the whole card), Enter
opens it (Space too for the button form); slot buttons follow it in the tab order.

| Prop | Type | Default | Description |
|---|---|---|---|
| `media` * | `React.ReactNode` |  | The media: an `<img>`, a `<video>` or any node; it fills the frame (`object-cover`). Decorative images: `alt=""`. |
| `title` * | `React.ReactNode` |  | Caption under the media (14 / 500, strong, one line with …). It names the card's link or button. |
| `meta` | `React.ReactNode` |  | Optional meta line under the caption, in the overline style (a category, a count, a date). |
| `topLeft` | `React.ReactNode` |  | Optional slot at the media's top left, any node: usually `<Badge tone="overlay">`. Nothing renders without it. |
| `bottomRight` | `React.ReactNode` |  | Optional slot at the media's bottom right, any node: an Avatar + name, a `<Button size="pill">`. Nothing renders without it. |
| `ratio` | `number` | `16 / 9` | Width / height of the media frame. |
| `label` | `string` |  | Accessible name of the card's link or button when the caption alone is not enough (default: the caption). |
| `className` | `string` |  |  |
| `href` | `string \| undefined` |  |  |
| `onClick` | `undefined \| () => void` |  |  |

## Accessibility

- The card is one link (href) or one button (onClick), named by its caption (label overrides it). Tab reaches it, the focus ring goes around the whole card, Enter opens it (Space too for the button).
- The slots sit beside the card's control, never inside it: a Button in a slot is its own control and comes after the card in the tab order. Only controls in a slot take the pointer, so a badge on the media never blocks opening the card.
- Decorative media take alt="" (the caption names the card); a video needs its own controls or a poster image.
- Hover scales the media to 1.05 in 300ms ease-out on devices that hover; prefers-reduced-motion keeps it still.

## Notes

- Grid recipe: grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6 (as many 220px+ columns as fit).
- Rail recipe: a flex row with overflow-x-auto snap-x snap-mandatory overscroll-x-contain, the cards snap-start shrink-0 basis-[75%] on phones (the next card peeks) and 3 or 4 per view from sm / lg; SectionHeader pager={{ target: railRef }} pages it (see Section header).
- Slots: topLeft for a Badge tone="overlay" (duration, "Video"), bottomRight for an Avatar + name in an overlay Badge or a Button size="pill". Leave them out and nothing renders.
- The meta line uses text-overline (11 / 600, uppercase): keep it short, a category or a count, never a sentence.

<!-- GENERATED by scripts/build-docs.mjs from examples/media-card/ and the types in src/ -->
