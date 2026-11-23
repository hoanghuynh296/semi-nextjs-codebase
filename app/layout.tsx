import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "../src/ThemeProvider";
import { ThemeScript } from "../src/ThemeScript";
import { SiteHosts } from "./SiteHosts";
import { SiteShell } from "./SiteShell";
import "./globals.css";

// The font of the one look (tokens.json shape "$fonts"); font-display falls back to it without a brand display face.
const geist = Geist({ subsets: ["latin", "vietnamese"], variable: "--font-geist" });
const FONT_VARS = geist.variable;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Semi Design System",
  description: "Components, tokens and brand kits for every Semi app, documented for people and agents: live examples, exact code, generated API, markdown for each component.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="dark" className={`dark ${FONT_VARS}`} suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
        {/* Text form of these docs for agents (under the GitHub Pages base path when set) */}
        <link rel="alternate" type="text/plain" href={`${BASE}/llms.txt`} title="llms.txt — Semi Design System for agents" />
        <link rel="alternate" type="application/json" href={`${BASE}/components.json`} title="components.json — component manifest" />
      </head>
      <body className="min-h-screen bg-canvas text-body antialiased selection:bg-accent-subtle-hover selection:text-accent-fg">
        <ThemeProvider defaultTheme="dark">
          <SiteHosts />
          {/* One shell for every page: the menu keeps its scroll and state when the page changes */}
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
