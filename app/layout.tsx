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
        {/* Text form of this Storybook for agents (relative: works under the GitHub Pages base path) */}
        <link rel="alternate" type="text/plain" href="llms.txt" title="llms.txt — Semi Design System for agents" />
        <link rel="alternate" type="application/json" href="components.json" title="components.json — component manifest" />
      </head>
      <body className="min-h-screen bg-canvas text-body antialiased selection:bg-primary-500/20 selection:text-accent-fg">
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
