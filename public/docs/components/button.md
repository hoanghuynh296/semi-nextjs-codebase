# Button

The action control, 1.0 variants: subtle (default) for ordinary actions, surface for toolbar actions, inverse for the main action of a card or a list title row, outline beside an inverse one, ghost for icon buttons, primary / secondary (the brand fills) only for the one main button of a page, a dialog or the nav, danger for destructive actions. Spinner shows work in progress inside the control that runs it.

## When to use

- Any action: save, create, refresh, delete, open a dialog.
- Icon-only toolbar actions (iconOnly + aria-label); an attention count on one with badge.
- Dialog footers (size="modal": 44px touch target on phones): commit primary, cancel subtle, a destructive confirm danger.
- Round icon buttons over media, in an overlay header or beside a carousel (iconOnly + shape="round"); the inverse pill of a list title row (size="xs" shape="round").

## Use something else when

| Need | Use |
|---|---|
| Go to another page | next/link (styled with BTN_* from @semi/ui/styles when it must look like a button) |
| Link to another site | ExternalLink |
| Pick one of 2–5 filters | SegmentedControl |
| Turn a setting on / off | Switch |

## Import

```tsx
import { Button, Spinner } from "@semi/ui";
```

## Examples

### Variants

subtle (default) for ordinary actions, surface for toolbar actions, inverse for a card's or a list title row's main action, outline beside it, ghost for quiet and icon actions, primary / secondary (brand) for the one main button of the page or dialog, danger for destructive. The second row is disabled: neutral for every variant.

```tsx
import { Button } from "@semi/ui";

const VARIANTS = ["subtle", "surface", "inverse", "outline", "ghost", "primary", "secondary", "danger"] as const;
const LABEL = { subtle: "Làm mới", surface: "Mời", inverse: "Thêm", outline: "Chia sẻ", ghost: "Xem thêm", primary: "Lưu", secondary: "Gửi", danger: "Xoá" };

export default function ButtonVariants() {
  return (
    // A specimen shows both brand fills on purpose: data-density-skip keeps it out of the one-brand-button budget.
    <div data-density-skip className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {LABEL[v]}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((v) => (
          <Button key={v} variant={v} disabled>
            {LABEL[v]}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

### Icon and icon-only

icon adds a leading icon; iconOnly needs an aria-label.

```tsx
import { Button } from "@semi/ui";

export default function ButtonIcons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" icon="plus">
        Thêm máy in
      </Button>
      <Button icon="refresh">Làm mới</Button>
      <Button variant="danger" icon="trash">
        Xoá
      </Button>
      <Button iconOnly icon="settings" aria-label="Cài đặt" title="Cài đặt" />
      <Button iconOnly icon="download" aria-label="Tải xuống" title="Tải xuống" />
    </div>
  );
}
```

### Round

shape="round" makes an icon-only button a circle (media tiles, overlay headers, carousel arrows) and a labelled one a pill; the fill, focus and size stay the variant's.

```tsx
import { Button } from "@semi/ui";

// Round icon buttons: over media, in an overlay header, beside a carousel. shape="round" keeps the variant's fill,
// the focus ring, the title and the size; only the corner changes.
export default function ButtonRound() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button iconOnly shape="round" icon="close" aria-label="Đóng" />
      <Button iconOnly shape="round" icon="copy" aria-label="Sao chép liên kết" />
      <Button iconOnly shape="round" variant="ghost" icon="more" aria-label="Thao tác khác" />
      <Button iconOnly shape="round" variant="primary" icon="plus" aria-label="Tạo mới" />
    </div>
  );
}
```

### Loading

loading swaps the icon for a spinner and blocks clicks.

```tsx
"use client";

import { useState } from "react";
import { Button, Spinner } from "@semi/ui";

export default function ButtonLoading() {
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1200);
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" icon="check" loading={saving} onClick={save}>
        {saving ? "Đang lưu" : "Lưu"}
      </Button>
      <Spinner label="Đang đồng bộ" />
    </div>
  );
}
```

### Sizes

xs (24px) for the inverse pill of a list title row, sm (28px, 12px text) for dense rows and toolbars, md (default, 14px text) for content, modal for dialog footers and a full-width commit; badge pins an attention count to an icon button.

```tsx
import { Button } from "@semi/ui";

export default function ButtonSizes() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs" variant="inverse" shape="round" icon="plus">
          Thêm (xs)
        </Button>
        <Button size="sm" icon="edit">
          Sửa (sm)
        </Button>
        <Button icon="edit">Sửa (md)</Button>
        <Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo, 12 chưa đọc" badge={12} />
      </div>
      <div className="flex gap-2 max-w-sm">
        <Button size="modal" className="flex-1">
          Huỷ
        </Button>
        <Button size="modal" variant="primary" className="flex-1">
          Xác nhận
        </Button>
      </div>
    </div>
  );
}
```

## API

### Button

| Prop | Type | Default | Description |
|---|---|---|---|
| `ref` | `React.Ref<HTMLButtonElement>` |  |  |
| `variant` | `ButtonVariant` | `"subtle"` | Look of the button. `subtle` ordinary action · `surface` toolbar action · `inverse` the main action of a card or a list title row · `outline` beside an inverse one · `ghost` icon buttons, the nav bottom row · `primary` / `secondary` the brand fill, only for the one main button of a page, a dialog (its commit) or the nav, or a case the app's owner asks for (`secondary` is the brand secondary; the primary when the brand has none) · `danger`. Disabled is neutral for every variant. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'modal'` | `"md"` | md = h-control (34px, 14px text) · sm = 28px, 12px text (dense rows, toolbars) · xs = 24px, 12px text (the inverse pill of a list title row) · modal = 44px and 15px text on phones, h-control from sm (dialog footers, a full-width commit). |
| `badge` | `number` |  | Attention count at the top-right corner (brand fill, "99+" cap), for an icon button: unread, waiting jobs. 0 hides it. The drawn badge is aria-hidden: with an `aria-label`, say the count in it ("Thông báo, 12 chưa đọc"); without one, Button adds the count as screen-reader text. |
| `icon` | `IconName` |  | Leading icon from the Semi registry. |
| `loading` | `boolean` | `false` | Shows a spinner in place of the icon and blocks clicks (aria-busy). |
| `fullWidth` | `boolean` | `false` |  |
| `shape` | `'default' \| 'round'` | `"default"` | `round`: fully round instead of the control radius: a circle with `iconOnly` (media tiles, overlay headers, carousel arrows), a pill otherwise (the inverse pill of a list title row, `size="xs"`). Lint `raw-pill-button` flags hand-made ones. |
| `iconOnly` | `boolean` | `false` |  |
| `children` | `React.ReactNode \| undefined` |  |  |
| `aria-label` | `string` |  | Defines a string value that labels the current element. |

### Spinner

Indeterminate activity mark for a button or field running its own action (§13b: no page spinners).

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | `"w-4 h-4"` |  |
| `label` | `string` |  |  |

## Accessibility

- Renders a real <button type="button"> (pass type="submit" in forms).
- iconOnly requires aria-label (the types enforce it); keep a title for the tooltip. With badge, say the count in the aria-label ("Thông báo, 3 chưa đọc").
- loading sets aria-busy and blocks clicks. Keyboard focus is a 2px outline in the strong text colour on every variant; disabled is neutral for every variant.
- A 24px hit area at every size that grows to 44px on a touch screen (any-pointer-coarse), without a bigger drawn button.

<!-- GENERATED by scripts/build-docs.mjs from examples/button/ and the types in src/ -->
