import { ConfirmHost, TaskHost, ThemeProvider, ThemeScript, ToastHost } from "@semi/ui";
import brand from "./brand.json";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata = {
  title: `${brand.name} — brand preview`,
  description: `The ${brand.name} brand on the Semi Design System: logo, colours, type, voice, sample screens and every component.`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark" className={`dark ${fontVariables}`} suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="min-h-screen bg-canvas text-body font-sans antialiased">
        <ThemeProvider defaultTheme="dark">
          {children}
          <ToastHost />
          <ConfirmHost />
          <TaskHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
