# Route header banner

One announcement in the route header's centre slot: a “Mới” tag, one line of text, an optional date, a pill CTA and a close button. Closed once per user per id (localStorage by default, or your own store). Below md the header's centre is hidden and the same banner is one row at the top of the page content.

## When to use

- A short app-wide announcement people should notice for a while: a new feature, a planned maintenance window, a changed price list.
- One at a time: the newest announcement replaces the previous one (a new id shows again for everybody).

## Use something else when

| Need | Use |
|---|---|
| The first visit of a feature, with slides | FeatureIntro |
| A message about this page or this record | Alert in the page |
| The result of an action | Toast |
| A search field in the header | RouteHeader middle (header.middle) |

## Import

```tsx
import { RouteHeaderBanner, localBannerStore, type RouteHeaderBannerProps, type RouteHeaderBannerStore } from "@semi/ui";
```

## Examples

### In the route header

The header copy and the row copy share one id: close either and both go. The button shows it again (a new id).

```tsx
import { useState } from "react";
import { Button, RouteHeader, RouteHeaderBanner, type RouteHeaderBannerProps, type RouteHeaderBannerStore } from "@semi/ui";

// "Dismissed" in memory, so this page can show it again; an app keeps the default localStorage store or its own.
const memory = new Set<string>();
const memoryStore: RouteHeaderBannerStore = { get: (id) => memory.has(id), set: (id) => void memory.add(id) };

export default function RouteHeaderBannerBasic() {
  const [round, setRound] = useState(0);
  const banner: RouteHeaderBannerProps = {
    id: `docs-ai-assistant-${round}`,
    text: "Trợ lý AI giờ đọc được cả đơn hàng và báo giá",
    sub: "Từ 01/12",
    cta: { label: "Xem ngay", onClick: () => {} },
    store: memoryStore,
  };
  return (
    <div className="flex flex-col gap-stack">
      <div className="rounded-card bg-app">
        <RouteHeader
          crumbs={[{ label: "Bán hàng", href: "#" }, { label: "Đơn hàng" }]}
          middle={<RouteHeaderBanner {...banner} />}
          actions={<Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo" />}
          account={{ name: "Lan Phạm", detail: "Quản lý" }}
        />
      </div>
      {/* below md the header's centre is hidden: the same banner is the first row of the page */}
      <RouteHeaderBanner {...banner} placement="inline" />
      <Button size="sm" icon="refresh" onClick={() => setRound((n) => n + 1)} className="self-start">
        Hiện lại thông báo
      </Button>
    </div>
  );
}
```

### In AppShell

header.banner: the shell renders both copies.

```tsx
import { AppShell } from "@semi/ui";

// In AppShell: header.banner. The shell puts it in the header's centre from md and as the first row of the page
// content below md; closing either hides both, remembered per id (localStorage unless you pass a store).
export default function RouteHeaderBannerAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      productName="Kho hàng"
      sections={[{ items: [{ id: "orders", label: "Đơn hàng", icon: "bag", href: "/orders" }] }]}
      activeId="orders"
      header={{
        banner: {
          id: "ai-assistant-2026-12",
          text: "Trợ lý AI giờ đọc được cả đơn hàng và báo giá",
          sub: "Từ 01/12",
          cta: { label: "Xem ngay", href: "/whats-new" },
        },
        account: { name: "Lan Phạm", detail: "Quản lý" },
      }}
    >
      {children}
    </AppShell>
  );
}
```

## API

### RouteHeaderBanner

An announcement for the route header's centre slot (one at a time): tag, text (truncates first, before the
breadcrumb or the right group shrink), optional sub text, a pill CTA and a close button. `role="status"`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` * | `string` |  | One id per announcement ("ai-assistant-2026"): closed once per id. |
| `text` * | `React.ReactNode` |  | One short sentence. One line in the header (cut with …), up to two lines in the row below `md`. |
| `sub` | `React.ReactNode` |  | Optional date or sub text after the text, muted ("Từ 01/12"). |
| `tag` | `React.ReactNode` |  | The tag before the text (a Badge); default "Mới" (locale `newBadge`); `null` drops it. |
| `tagTone` | `SemanticTone` | `"blue"` | The tag's tone (default `blue`). |
| `cta` | `{ label: string; href?: string; onClick?: () => void }` |  | The call to action, a `Button size="pill"`: a link (`href`) or an action (`onClick`). |
| `store` | `RouteHeaderBannerStore` | `localBannerStore` | Where "dismissed" is read and written (default `localBannerStore`). |
| `onDismiss` | `() => void` |  | After it is closed (either copy) and stored as dismissed. |
| `placement` | `'inline' \| 'header'` | `"header"` | `header` (default): the pill for the route header's centre slot. `inline`: the row at the top of the page content, shown below `md` only. AppShell's `header.banner` renders both; a frame of your own renders both itself. |
| `closeLabel` | `string` |  | The close button's name; default "Đóng thông báo" (locale `bannerClose`). |
| `className` | `string` |  |  |

## Accessibility

- Each copy is role="status"; its close button is named “Đóng thông báo” (locale bannerClose) and has a 44px touch area.
- Tab reaches the CTA and then the close button; Enter or Space presses them. Closing moves focus to the next control after the banner (the header's right group, or the page), never to the body.

## Notes

- In AppShell pass header.banner (data, not an element): the shell renders the header copy and the inline copy below md, and closing either hides both. It takes the header's centre in place of header.middle.
- A frame of your own: RouteHeader middle={<RouteHeaderBanner {...b} />} plus <RouteHeaderBanner {...b} placement="inline" /> above the page title.
- The store is read after mount only, so the server HTML never contains it; with storage blocked it shows, and closing hides it until the next page load.
- The text truncates with … first, before the breadcrumb or the right group shrink: one short sentence, the date in sub. The CTA is a Button size="pill" (inverse), never the brand fill.
- RouteHeader always renders its three slot containers (left, centre, right): closing the banner never moves the right group.

<!-- GENERATED by scripts/build-docs.mjs from examples/route-header-banner/ and the types in src/ -->
