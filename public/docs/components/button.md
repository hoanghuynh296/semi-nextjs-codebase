# Button

The action control: one primary per area (the action fill: the accent, or a neutral inverted fill in a brand with primaryStyle inverted), secondary (a translucent tint, no border) for the rest, outline (field fill + line) for framed toolbars, danger for destructive actions, ghost for quiet ones. Spinner shows work in progress inside the control that runs it.

## When to use

- Any action: save, create, refresh, delete, open a dialog.
- Icon-only toolbar actions (iconOnly + aria-label).
- Dialog footers (size="modal": 44px touch target on phones).
- Round icon buttons over media, in an overlay header or beside a carousel (iconOnly + shape="round").

## Use something else when

| Need | Use |
|---|---|
| Go to another page | next/link (styled with BTN_* from @semi/ui/styles when it must look like a button) |
| Link to another site | ExternalLink |
| Pick one of 2–5 filters | Pills |
| Turn a setting on / off | Switch |

## Import

```tsx
import { Button, Spinner } from "@semi/ui";
```

## Examples

### Variants

primary for the main action of an area, secondary (default, tint fill without border) for the rest, outline where a framed control is needed, danger for destructive, ghost for quiet actions.

```tsx
import { Button } from "@semi/ui";

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Huỷ</Button>
      <Button variant="primary">Lưu</Button>
      <Button variant="outline">Xuất file</Button>
      <Button variant="danger">Xoá</Button>
      <Button variant="ghost">Xem thêm</Button>
      <Button disabled>Không khả dụng</Button>
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

shape="round" makes an icon-only button a circle (media tiles, overlay headers, carousel arrows); the fill, focus ring and size stay the variant's.

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

sm for dense rows, md (default) for toolbars and forms, modal for dialog footers.

```tsx
import { Button } from "@semi/ui";

export default function ButtonSizes() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" icon="edit">
          Sửa (sm)
        </Button>
        <Button icon="edit">Sửa (md)</Button>
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
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'danger' \| 'ghost'` | `"secondary"` | Look of the button (default `secondary`): `primary` main action, `secondary` tint fill without border (since 0.36), `outline` field fill with a 1px line (the pre-0.36 secondary), `danger`, `ghost`. |
| `size` | `'sm' \| 'md' \| 'modal'` | `"md"` | md = h-control toolbar / form (34px in Flat) · sm = 28px dense rows · modal = 44px on phones, 34px from sm (dialog footers). |
| `icon` | `IconName` |  | Leading icon from the Semi registry. |
| `loading` | `boolean` | `false` | Shows a spinner in place of the icon and blocks clicks (aria-busy). |
| `fullWidth` | `boolean` | `false` |  |
| `shape` | `'default' \| 'round'` | `"default"` | `round`: a circle instead of the style's control radius, for round icon buttons (media tiles, overlay headers, carousel arrows). Use it with `iconOnly`; lint `raw-pill-button` flags hand-made ones. |
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
- iconOnly requires aria-label (the types enforce it); keep a title for the tooltip.
- loading sets aria-busy and blocks clicks; the visible focus ring stays.

<!-- GENERATED by scripts/build-docs.mjs from examples/button/ and the types in src/ -->
