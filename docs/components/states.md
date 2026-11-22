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
import { ErrorState } from "@semi/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState onRetry={reset} detail={error.digest} />;
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
import { PageSkeleton } from "@semi/ui";

export default function Loading() {
  return <PageSkeleton shape="list" />;
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
| `className` | `string` |  |  |

### NotFound

A wrong or removed URL (route `not-found.tsx`, `notFound()`): one sentence and a link home.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` |  |  |
| `message` | `React.ReactNode` |  |  |
| `homeHref` | `string` | `"/"` | Where "Về trang chủ" goes. |
| `homeLabel` | `string` |  |  |
| `className` | `string` |  |  |

### Forbidden

Signed in but not allowed (a 403, or a page the role cannot open): say so and link home; do not offer a retry.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` |  |  |
| `message` | `React.ReactNode` |  |  |
| `homeHref` | `string` | `"/"` |  |
| `homeLabel` | `string` |  |  |
| `action` | `React.ReactNode` |  | Extra action beside the link home (a mailto to the admin, "Đổi tài khoản"). |
| `className` | `string` |  |  |

## Accessibility

- ErrorState is role="alert", so screen readers announce it; the retry is a normal button.
- NotFound and Forbidden have one heading and a link home; Forbidden offers no retry.

## Notes

- Recipe: per route group put loading.tsx, error.tsx and not-found.tsx beside layout.tsx (the three route-* examples). Put app/not-found.tsx at the root for URLs that match no group.
- Keep data already loaded: when a refetch fails, show ErrorState in place of the failed part only and leave the rest on screen.
- Show a code or digest in `detail` for support, never the stack. Texts are Vietnamese by default and come from SemiLocaleProvider; pass title / message for product wording.
- 403 means signed in but not allowed (Forbidden, no retry); not signed in goes to the login page, not to Forbidden.

<!-- GENERATED by scripts/build-docs.mjs from examples/states/ and the types in src/ -->
