"use client";

// app/(app)/error.tsx: Next.js renders it inside the layout, so the shell stays and only the content is replaced.
import { ErrorState } from "@semi/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState onRetry={reset} detail={error.digest} />;
}
