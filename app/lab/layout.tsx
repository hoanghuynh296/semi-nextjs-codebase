import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Lab — Semi Design System",
  description: "Try core values of Semi (type scale, styles, densities, the brand colour generator) on every page and on sample brands, then hand the patch to an agent.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
