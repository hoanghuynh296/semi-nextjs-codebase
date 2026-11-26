import type { Metadata } from "next";

export const metadata: Metadata = { title: "Title toggle demo · Semi Design System" };

/** A DetailOverlay with a constant long title (#196 review): the expand toggle shows on every opening. */
export default function TitleToggleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
