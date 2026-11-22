import type { Metadata } from "next";
import FullShell from "../../../examples/app-shell/full";

export const metadata: Metadata = { title: "AppShell demo · Semi Design System" };

/** The AppShell example full screen (no docs shell around it): examples/app-shell/full.tsx. A layout, since AppShell
 * never renders from a page (app-shell-in-page); the page itself is empty. */
export default function AppShellDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FullShell />
      {children}
    </>
  );
}
