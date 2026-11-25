import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Icons — Semi Design System",
  description: "Searchable semantic icon registry for @semi/ui.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
