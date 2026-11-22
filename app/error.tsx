"use client";

// A runtime error in a docs page: the shell stays, the content is replaced (§13c).
import { ErrorState } from "../src/States";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState headingLevel={1} onRetry={reset} detail={error.digest} />;
}
