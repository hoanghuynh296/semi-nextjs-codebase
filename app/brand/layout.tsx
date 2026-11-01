import type { Metadata } from "next";

export const metadata: Metadata = { title: "Brand preview — Semi Design System", description: "Preview a brand (primary, neutrals, styles, fonts) on every page before creating its brand kit; contrast report." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
