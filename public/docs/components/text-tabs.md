# Text tabs

Big display tabs (`font-display text-tab-xl`, 24px below sm / 28px from sm, weight 400) for 2–4 top-level views of a discovery or reading page: every tab in strong text colour, inactive at opacity 0.2 (raised on hover in 150ms), active with a 2px brand underline at 6px offset under the word only.

## When to use

- 2–4 top-level views of a discovery or reading page, rendered as the page heading (Khám phá / Mẫu sẵn / Cảm hứng).
- Views people link to or reload into: pass `href` on each item or keep `?tab=` with `useTabParam`.

## Use something else when

| Need | Use |
|---|---|
| 5+ sections of one page, or sections with icons (settings-like pages) | PillTabs |
| 2–5 filter values shown in full, often with counts | SegmentedControl |
| Filters of a list | FilterChipRow |
| Sections of one record inside a card or dialog | Tabs |
| A page with one title | PageTitle |

## Import

```tsx
import { TextTabs, useTabParam } from "@semi/ui";
```

## Examples

### Page heading with intro and panel

```tsx
"use client";

import { useState } from "react";
import { TextTabs } from "@semi/ui";

const VIEWS = [
  { key: "discover", label: "Khám phá", intro: "Các mẫu in 3D nổi bật được cộng đồng hoàn thiện trong tuần qua." },
  { key: "use-cases", label: "Ứng dụng", intro: "Bộ gá xưởng, hộp điện tử và phụ kiện bàn làm việc sẵn thông số in." },
  { key: "collections", label: "Bộ sưu tập", intro: "Tuyển tập theo vật liệu PLA, PETG chịu nhiệt và TPU đàn hồi." },
] as const;

export default function TextTabsHeading() {
  const [view, setView] = useState<(typeof VIEWS)[number]["key"]>("discover");
  const current = VIEWS.find((v) => v.key === view) ?? VIEWS[0];

  return (
    <TextTabs
      label="Thư viện cộng đồng"
      value={view}
      onChange={(next) => setView(next)}
      items={[...VIEWS]}
    >
      <p className="text-lead text-muted">{current.intro}</p>
    </TextTabs>
  );
}
```

### URL-driven href tabs with guard

```tsx
"use client";

import { useState } from "react";
import { Switch, TextTabs } from "@semi/ui";

/** URL-driven: each tab is a link; `onBeforeChange` blocks link navigation when there are unsaved edits. */
export default function TextTabsLinked() {
  const [dirty, setDirty] = useState(false);
  const [refused, setRefused] = useState(false);

  return (
    <div className="flex flex-col gap-group">
      <Switch
        checked={dirty}
        onChange={(v) => {
          setDirty(v);
          setRefused(false);
        }}
        label="Có thay đổi chưa lưu (chặn chuyển link)"
      />
      <TextTabs
        label="Mua hàng"
        heading={false}
        className="mb-0"
        value="suppliers"
        onBeforeChange={() => {
          if (dirty) {
            setRefused(true);
            return false;
          }
          setRefused(false);
          return true;
        }}
        items={[
          { key: "requests", label: "Yêu cầu", href: "?view=requests" },
          { key: "suppliers", label: "Nhà cung cấp", href: "?view=suppliers" },
          { key: "quotes", label: "Báo giá", href: "?view=quotes" },
        ]}
      >
        <p className="text-ui text-muted">
          {refused
            ? "Đã giữ nguyên trang Nhà cung cấp vì biểu mẫu còn thay đổi chưa lưu."
            : "Mỗi tab là một liên kết Next.js; phím ←/→ di chuyển tiêu điểm, Enter hoặc Space mở liên kết."}
        </p>
      </TextTabs>
    </div>
  );
}
```

## API

### TextTabs

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` * | `TextTabItem<T>[]` |  |  |
| `value` * | `T` |  | The current tab (read it from the URL for linked tabs, or via `useTabParam`). |
| `onChange` | `(key: T, meta: TabChangeMeta) => void` |  | Called with the tab chosen; tabs with `href` call it too, then navigate unless `onBeforeChange` refuses. |
| `onBeforeChange` | `TabBeforeChange<T>` |  | Guard run before switching (button AND href tabs); return or resolve `false` to keep the current tab. |
| `activation` | `'automatic' \| 'manual'` | `"automatic"` | `"automatic"` (default) switches button tabs as arrows move; `"manual"` moves focus with arrows and commits on Enter / Space. |
| `label` * | `string` |  | Accessible name of the tab list ("Khám phá"). |
| `heading` | `boolean` | `true` | Wrap the tabs in the page's `h1` (default): they are the page heading. Set false when the page has its own h1. |
| `children` | `React.ReactNode` |  | The current tab's content, rendered in the tab panel (28px below the tab row by default). Omit to render content below. |
| `className` | `string` |  |  |
| `panelClassName` | `string` | `"pt-7"` |  |

## Accessibility

- WAI-ARIA tabs: tablist / tab / tabpanel, ←/→, Home and End move and the current tab is the only tab stop.
- Buttons switch as focus moves (or wait for Enter / Space with `activation="manual"`); linked tabs (`href`) move focus on arrows and navigate on Enter or Space.
- `onBeforeChange` guards both button tabs and `href` link tabs (sync boolean or Promise<boolean>).
- Inactive tabs use `text-strong` at `opacity-20` (explicit owner exception for the 24–28px display tab heading; hover raises opacity, keyboard `:focus-visible` restores full contrast).

## Notes

- Only for 2–4 sub-pages. For 5+ sections or sections with icons, use `PillTabs`.
- Weight is 400 (`font-normal`) in `font-display`: never force 600–800 bold on top of a heavy display face.
- Gaps are 16 / 20 / 24px (`base` / `sm` / `md`) with 28px from the tab row to the intro text below.

<!-- GENERATED by scripts/build-docs.mjs from examples/text-tabs/ and the types in src/ -->
