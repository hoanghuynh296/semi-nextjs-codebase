# Section header

The header row of a discovery or gallery section: a 20 / 500 title, an optional muted line, an actions slot on the right (usually a ghost "Xem tất cả" Button) and an optional ‹ › pager of subtle icon buttons that scrolls a rail or calls your handlers, disabled at the ends.

## When to use

- Above a rail or a grid of MediaCards on a discovery, home or gallery page.
- A section that links to its full list ("Xem tất cả") or pages through a row of cards (‹ ›).

## Use something else when

| Need | Use |
|---|---|
| A section of a work page with its content | PageSection (title, description, actions) |
| The title of the page | PageTitle |
| A group label in a form or a side panel | WorkspaceSection or text-overline |

## Import

```tsx
import { SectionHeader, type SectionHeaderProps, type SectionHeaderPager } from "@semi/ui";
```

## Examples

### Title, description and Xem tất cả

```tsx
import { Button, Icon, SectionHeader } from "@semi/ui";

export default function SectionHeaderBasic() {
  return (
    <SectionHeader
      title="Mẫu in nổi bật"
      description="Được cộng đồng tải nhiều nhất tuần này."
      actions={
        <Button variant="ghost">
          Xem tất cả <Icon name="chevron" className="w-3.5 h-3.5" />
        </Button>
      }
    />
  );
}
```

### Pager over a rail of MediaCards

The rail recipe: phones show 75% wide cards (the next one peeks), 3 per view from sm, 4 from lg. ‹ › scroll it by one view and turn off at the ends.

```tsx
"use client";

import { useRef, useState } from "react";
import { Badge, Button, Icon, MediaCard, SectionHeader } from "@semi/ui";

// Stand-in photos (inline SVG) so the example needs no image files; n turns the hue.
const photo = (n: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><g style="filter:hue-rotate(${n * 47}deg)"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/></g></svg>`,
  );

const ITEMS = Array.from({ length: 7 }, (_, i) => ({ title: `Video hướng dẫn ${i + 1}`, length: `${4 + i}:2${i}` }));

export default function SectionHeaderRail() {
  const rail = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <section aria-labelledby="rail-head" className="flex flex-col gap-4 min-w-0">
      <SectionHeader
        id="rail-head"
        title="Video mới"
        actions={
          <Button variant="ghost">
            Xem tất cả <Icon name="chevron" className="w-3.5 h-3.5" />
          </Button>
        }
        pager={{ target: rail }}
      />
      {/* the rail recipe: one row that scrolls sideways and snaps; 75% wide cards on phones, 3 then 4 per view */}
      <div ref={rail} data-rail="" className="flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain">
        {ITEMS.map((it, i) => (
          <MediaCard
            key={it.title}
            className="snap-start shrink-0 basis-[75%] sm:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]"
            onClick={() => setOpened(it.title)}
            media={<img src={photo(i)} alt="" />}
            title={it.title}
            meta="Video"
            topLeft={<Badge tone="overlay" className="tabular-nums">{it.length}</Badge>}
          />
        ))}
      </div>
      <p role="status" className="text-ui text-muted">
        {opened ? `Đã mở: ${opened}` : "Chọn một video."}
      </p>
    </section>
  );
}
```

## API

### SectionHeader

Header row of a discovery or gallery section: title (and description) on the left; actions and an optional ‹ ›
pager on the right. Nothing renders for a slot you leave out.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` * | `React.ReactNode` |  | Section title (20 / 500, `text-section`). |
| `description` | `React.ReactNode` |  | Optional short muted line under the title. |
| `actions` | `React.ReactNode` |  | Right slot, before the pager: usually one `<Button variant="ghost">Xem tất cả</Button>` (or a link styled with `buttonClass("ghost")`). Any node. |
| `pager` | `SectionHeaderPagerHandlers \| SectionHeaderPagerTarget` |  | ‹ › after the actions: handlers (`onPrev` / `onNext` + disabled flags) or a rail to scroll (`target`). |
| `headingLevel` | `2 \| 3` | `2` |  |
| `id` | `string` |  | Id of the heading, for `aria-labelledby` on the section (one is generated otherwise). |
| `className` | `string` |  |  |

## Accessibility

- The title is an h2 (headingLevel 3 inside another section); give the section aria-labelledby={id} with the same id.
- The pager is a group named by the title; its buttons are named "Mục trước" / "Mục sau" (locale prevItem / nextItem, or prevLabel / nextLabel) and are disabled at the start / end, so Tab skips them there. Enter or Space presses them.
- With target, a press scrolls the rail by one visible width (instantly under prefers-reduced-motion); cards scrolled off screen stay reachable with Tab.

## Notes

- It renders the existing Button only: the actions are your Buttons, the pager is two Button iconOnly variant="subtle" size="sm" shape="round" (44px on a touch phone). No colours or sizes of its own.
- pager={{ target: ref }} reads the rail after mount (the server HTML has ‹ disabled and › enabled) and follows its scroll and size; the ref can point at the scroll container or at an element that contains one (a Carousel's wrapper, though a Carousel shows its own arrows from sm).
- pager={{ onPrev, onNext, prevDisabled, nextDisabled }} for anything else (pages of data, a carousel of yours).

<!-- GENERATED by scripts/build-docs.mjs from examples/section-header/ and the types in src/ -->
