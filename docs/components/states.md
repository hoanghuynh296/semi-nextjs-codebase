# Error, not found, no access

The page-level states every app needs: ErrorState (what failed, with a retry), NotFound (a wrong URL) and Forbidden (no access), each with a link home, plus the route-file recipe (loading.tsx, error.tsx, not-found.tsx) that uses them.

## When to use

- A route or a fetch failed: ErrorState with onRetry (route error.tsx passes Next.js's reset).
- An unknown URL or notFound(): NotFound. A signed-in user without the role: Forbidden.
- Every Next.js route group ships loading.tsx (PageSkeleton), error.tsx (ErrorState) and not-found.tsx (NotFound).

## Use something else when

| Need | Use |
|---|---|
| A list with nothing in it | EmptyState variant first-use or no-results |
| A form field or action failed | Field error text, Alert or a danger toast |
| Content is loading | PageSkeleton / Skeleton in the shape of the content |

## Import

```tsx
import { ErrorState, NotFound, Forbidden } from "@semi/ui";
```

## Examples

### Error with retry

```tsx
import { ErrorState } from "@semi/ui";

export default function StatesError() {
  return <ErrorState onRetry={() => {}} message="Không tải được danh sách đơn hàng. Kiểm tra kết nối rồi thử lại." detail="Mã lỗi 3871042" />;
}
```

### Not found

```tsx
import { NotFound } from "@semi/ui";

export default function StatesNotFound() {
  return <NotFound />;
}
```

### No access

```tsx
import { Forbidden } from "@semi/ui";

export default function StatesForbidden() {
  return <Forbidden />;
}
```

### Route error.tsx

The error boundary of a route group: Next.js gives it error and reset.

```tsx
"use client";

// app/(app)/error.tsx: Next.js renders it inside the layout, so the shell stays and only the content is replaced.
// A route error is the whole page, so its title is the h1. It does not catch errors in its own layout: see root error.tsx.
import { ErrorState } from "@semi/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState headingLevel={1} onRetry={reset} detail={error.digest} />;
}
```

### Route not-found.tsx

Shown for notFound() and for URLs that match no route.

```tsx
// app/(app)/not-found.tsx (also app/not-found.tsx for URLs that match no route group): shown for notFound() and unknown URLs.
import { NotFound } from "@semi/ui";

export default function NotFoundPage() {
  return <NotFound />;
}
```

### Route loading.tsx

PageSkeleton in the shape of the page (list, cards or detail).

```tsx
// app/(app)/loading.tsx: the shell stays and the content shimmers in the shape of the page (list, cards or detail).
// `inShell` drops the full-page height and padding, because the shell's content slot already gives them.
import { PageSkeleton } from "@semi/ui";

export default function Loading() {
  return <PageSkeleton shape="list" inShell />;
}
```

### Root global-error.tsx

The net for an error in the root layout; it renders its own html and body.

```tsx
"use client";

// app/global-error.tsx: the last net, for an error in the ROOT layout (which app/error.tsx cannot catch). It replaces the
// whole document, so it renders its own <html> and <body>, and cannot use the shell or ThemeProvider.
import { ErrorState } from "@semi/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <ErrorState headingLevel={1} onRetry={reset} detail={error.digest} />
      </body>
    </html>
  );
}
```

## API

### ErrorState

Something failed to load or run (route `error.tsx`, a failed fetch). Says what failed and offers a retry; keep any
data already loaded on screen and show this in place of the failed part only (§13c).

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` |  | Defaults to "Có lỗi xảy ra". |
| `message` | `React.ReactNode` |  | What failed and what to do next, in the product's voice. Defaults to a generic Vietnamese sentence. |
| `detail` | `React.ReactNode` |  | Small technical line (an error digest or code) for support, never the raw stack. |
| `onRetry` | `() => void` |  | Shows a primary "Thử lại" button. In `error.tsx` pass the `reset` Next.js gives you. |
| `retryLabel` | `string` |  |  |
| `action` | `React.ReactNode` |  | Extra action beside the retry (a link home, "Báo lỗi"). |
| `icon` | `IconName` | `"alert"` |  |
| `headingLevel` | `2 \| 3 \| 1` |  | Heading level of the title: 2 inside a page (default), 1 when this is the whole page (a route `error.tsx`). |
| `className` | `string` |  |  |

### NotFound

A wrong or removed URL (route `not-found.tsx`, `notFound()`): one sentence and a link home.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` |  |  |
| `message` | `React.ReactNode` |  |  |
| `homeHref` | `string` | `"/"` | Where "Về trang chủ" goes. |
| `homeLabel` | `string` |  |  |
| `headingLevel` | `2 \| 3 \| 1` | `1` | Heading level of the title: 1 (default, a not-found page is the whole page) or 2 inside a page. |
| `className` | `string` |  |  |

### Forbidden

Signed in but not allowed (a 403, or a page the role cannot open): say so and link home; do not offer a retry.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` |  |  |
| `message` | `React.ReactNode` |  |  |
| `homeHref` | `string` | `"/"` |  |
| `homeLabel` | `string` |  |  |
| `headingLevel` | `2 \| 3 \| 1` | `1` | Heading level of the title: 1 (default) or 2 inside a page. |
| `action` | `React.ReactNode` |  | Extra action beside the link home (a mailto to the admin, "Đổi tài khoản"). |
| `className` | `string` |  |  |

## Accessibility

- ErrorState is role="alert", so screen readers announce it; the retry is a normal button.
- NotFound and Forbidden have one heading and a link home; Forbidden offers no retry.
- A route-level state is the page's h1 (headingLevel={1}); inside a page keep ErrorState at h2. Below sm the state is capped at 40% of the viewport and, if its content overflows, becomes a focusable, scrollable region.

## Notes

- Recipe: per route group put loading.tsx, error.tsx and not-found.tsx beside layout.tsx (the route-* examples), titles as h1 (`headingLevel={1}`; NotFound and Forbidden default to h1). Put app/not-found.tsx at the root for URLs that match no group. A group's error.tsx does not catch errors in its own layout: add a root app/error.tsx for the root layout's children and app/global-error.tsx (it renders its own html and body) for the root layout itself.
- Keep data already loaded: when a refetch fails, show ErrorState in place of the failed part only and leave the rest on screen.
- Show a code or digest in `detail` for support, never the stack. Texts are Vietnamese by default and come from SemiLocaleProvider; pass title / message for product wording.
- 403 means signed in but not allowed (Forbidden, no retry); not signed in goes to the login page, not to Forbidden.

<!-- GENERATED by scripts/build-docs.mjs from examples/states/ and the types in src/ -->
