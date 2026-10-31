import type { Metadata } from "next";
import { ThemeProvider } from "../src/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semi Design System — Catalogue & Storybook",
  description: "Foundations, Design Tokens, 166 Semantic Icons & Components for the Semi ecosystem.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="dark" className="dark">
      <body className="min-h-screen bg-canvas text-body antialiased selection:bg-primary-500/20 selection:text-primary-300">
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
