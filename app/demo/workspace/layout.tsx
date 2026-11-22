import type { Metadata } from "next";
import WorkspaceInShell from "../../../examples/workspace-layout/in-shell";

export const metadata: Metadata = { title: "Workspace demo · Semi Design System" };

/** examples/workspace-layout/in-shell.tsx full screen (AppShell with the phone tab bar), for the phone check (#106). */
export default function WorkspaceDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WorkspaceInShell />
      {children}
    </>
  );
}
