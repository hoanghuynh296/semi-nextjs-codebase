import type { Metadata } from "next";
import { STORY_PAGES } from "../usage";

const page = STORY_PAGES.find((p) => p.path === "components")!;

export const metadata: Metadata = { title: `${page.title} — Semi Design System`, description: page.summary };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
