import { ToastHost } from "../../../src/Toast";
import { ThemeProvider } from "../../../src/ThemeProvider";
import { Palette } from "./Palette";

// ToastHost is bare on purpose: no <Suspense> around it, as the docs show. If it calls a router hook outside a
// boundary, `next build` of /prerender/[id] fails (#82). The CommandPalette is app-wide the same way (#102).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ThemeProvider defaultTheme="light">
          <ToastHost />
          <Palette />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
