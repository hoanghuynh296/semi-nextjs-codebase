"use client";

// app/(app)/error.tsx: Next.js renders it inside the layout, so the shell stays and only the content is replaced.
// A route error is the whole page, so its title is the h1. It does not catch errors in its own layout: see root error.tsx.
import { ErrorState } from "@semi/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState headingLevel={1} onRetry={reset} detail={error.digest} />;
}
