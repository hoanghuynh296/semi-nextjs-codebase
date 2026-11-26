# Badge

A read-only status or tag in a tone (10% fill, no border, theme-safe text; one fixed palette for every brand), tone="overlay" for text on an image or video, and the attention marks in the brand colour: CountBadge (unread, to approve; 99+ cap) and NewTag ("Mới").

## When to use

- Status of a row or card (Đã thanh toán, Lỗi), a plan or role tag.
- Text on an image or video (a duration, "Video", a page count on a thumbnail): tone="overlay", and only there.
- Something waits for the user (unread, to approve): CountBadge, or Button badge on an icon button.
- A new feature or item in a menu: NewTag.

## Use something else when

| Need | Use |
|---|---|
| Something clickable | Chip |
| A count next to a title that is not an alert | COUNT_PILL or CountBadge tone="neutral" |

## Import

```tsx
import { Badge, CountBadge, NewTag } from "@semi/ui";
```

## Examples

### Tones

```tsx
import { Badge } from "@semi/ui";

export default function BadgeTones() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="emerald" dot>
        Hoàn thành
      </Badge>
      <Badge tone="amber" dot>
        Đang xử lý
      </Badge>
      <Badge tone="rose" dot>
        Thất bại
      </Badge>
      <Badge tone="sky" icon="server">
        Đồng bộ
      </Badge>
      <Badge tone="purple" icon="sparkles">
        Pro
      </Badge>
      <Badge tone="gray" size="sm">
        Nháp
      </Badge>
    </div>
  );
}
```

### On media (tone="overlay")

Only on an image or video: the canvas grey at 55% with a 12px backdrop blur behind the strong text. On a page or a card use a tone.

```tsx
import { Badge } from "@semi/ui";

// A stand-in photo (inline SVG) so the example needs no image file.
const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/><polygon points="0,160 90,120 170,158 260,118 320,140 320,180 0,180" fill="#14252f"/></svg>',
  );

export default function BadgeOverlay() {
  return (
    <div className="relative w-full max-w-sm aspect-video rounded-card overflow-hidden">
      <img src={PHOTO} alt="Ảnh xem trước bản in" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <Badge tone="overlay" icon="video">
          Video
        </Badge>
      </div>
      <Badge tone="overlay" className="absolute bottom-2 right-2 tabular-nums">
        2:14
      </Badge>
    </div>
  );
}
```

### Attention marks

CountBadge in the brand fill (99+ cap; tone="neutral" for a plain count), Button badge at a button's corner (the count goes in an icon button's aria-label; a button with text and no aria-label gets it as screen-reader text), NewTag: the brand at 18% behind brand text, or the strong text where the brand is not AA on it.

```tsx
import { Button, CountBadge, NewTag } from "@semi/ui";

export default function BadgeAttention() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo, 3 chưa đọc" badge={3} />
      <Button variant="ghost" iconOnly icon="mail" aria-label="Hộp thư, hơn 99 chưa đọc" badge={240} />
      <Button size="sm" icon="check" badge={2}>
        Duyệt
      </Button>
      <span className="inline-flex items-center gap-2 text-ui text-body">
        Chờ duyệt <CountBadge count={5} />
      </span>
      <span className="inline-flex items-center gap-2 text-ui text-body">
        Tất cả <CountBadge count={128} tone="neutral" max={999} />
      </span>
      <span className="inline-flex items-center gap-2 text-ui text-strong">
        Báo cáo tồn kho <NewTag />
      </span>
    </div>
  );
}
```

## API

### Badge

Standard Bento Tag/Badge primitive with dual-theme tonal matching.
A 10% alpha fill + high-contrast text adapted for dark and light modes; no border (#190). `tone="overlay"` on media.

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `SemanticTone \| "overlay"` | `"gray"` | Chromatic tone matching the theme (its 10% tint and text, no border). Defaults to "gray". `"overlay"`: only for text on an image or video (grey at 55% + 12px backdrop blur, strong text); never on a page or card surface. |
| `icon` | `IconName` |  | Optional leading icon from the Semi standard registry. |
| `dot` | `boolean` |  | Optional leading status dot in the tone's color. |
| `children` * | `React.ReactNode` |  |  |
| `className` | `string` | `""` |  |
| `size` | `'sm' \| 'md'` | `"md"` |  |

### CountBadge

A count in the brand colour (text-badge, 700), "99+" cap. A plain count that is not an alert passes tone="neutral".

| Prop | Type | Default | Description |
|---|---|---|---|
| `count` * | `number` |  | The count. 0 or less renders nothing. |
| `max` | `number` | `99` | Above it the badge shows `max+` (99+). |
| `tone` | `'neutral' \| 'attention'` | `"attention"` | `attention` (default): the brand fill, for something that waits for the user (unread, to approve). `neutral`: a plain count that is not an alert. |
| `corner` | `boolean` | `false` | Pinned to the top-right corner of a `relative` parent (an icon button). Button's `badge` prop uses it. |

### NewTag

"Mới" / "New" tag: the brand colour at 18% behind brand text (or the strong text where the brand text is not AA on it).

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `React.ReactNode` | `the locale's "Mới" / "New"` | The text. |

## Accessibility

- Text, not colour alone, carries the meaning; it never wraps.
- A count on an icon button is said in the button's aria-label.

<!-- GENERATED by scripts/build-docs.mjs from examples/badge/ and the types in src/ -->
