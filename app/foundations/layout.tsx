import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foundations — Semi Design System",
  description: "Surface tokens, text tiers, shape tokens and the type scale.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
