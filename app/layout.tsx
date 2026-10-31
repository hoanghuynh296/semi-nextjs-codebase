import type { Metadata } from "next";
import { ThemeProvider } from "../src/ThemeProvider";
import { ThemeScript } from "../src/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semi Design System — Catalogue & Storybook",
  description: "Foundations, design tokens, semantic icons & components for the Semi ecosystem.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="min-h-screen bg-canvas text-body antialiased selection:bg-primary-500/20 selection:text-accent-fg">
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
