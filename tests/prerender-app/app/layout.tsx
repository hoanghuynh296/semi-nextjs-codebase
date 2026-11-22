import { ToastHost } from "../../../src/Toast";

// ToastHost is bare on purpose: no <Suspense> around it, as the docs show. If it calls a router hook outside a
// boundary, `next build` of /prerender/[id] fails (#82).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ToastHost />
        {children}
      </body>
    </html>
  );
}
