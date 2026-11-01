import type { Metadata } from "next";
import { Geist, Montserrat_Alternates, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "../src/ThemeProvider";
import { ThemeScript } from "../src/ThemeScript";
import { STYLE_SCRIPT } from "./styleScript";
import "./globals.css";

// The fonts of every style (tokens/styles/*.json "fonts"), so the style switch previews them. An app loads only its own.
const geist = Geist({ subsets: ["latin", "vietnamese"], variable: "--font-geist" });
const montserratAlternates = Montserrat_Alternates({ subsets: ["latin", "vietnamese"], weight: ["600", "700"], variable: "--font-montserrat-alternates" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "vietnamese"], variable: "--font-jakarta" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "vietnamese"], variable: "--font-space-grotesk" });
const FONT_VARS = [geist, montserratAlternates, jakarta, spaceGrotesk].map((f) => f.variable).join(" ");

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
    <html lang="vi" data-theme="dark" className={`dark ${FONT_VARS}`} suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
        <script dangerouslySetInnerHTML={{ __html: STYLE_SCRIPT }} />
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
