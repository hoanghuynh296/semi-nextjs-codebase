import { ConfirmHost, TaskHost, ThemeProvider, ThemeScript, ToastHost } from "@semi/ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-canvas text-body">
        <ThemeProvider>
          {children}
          <ToastHost />
          <ConfirmHost />
          <TaskHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
