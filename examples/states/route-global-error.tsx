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
