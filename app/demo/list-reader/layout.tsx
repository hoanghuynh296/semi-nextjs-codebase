import type { Metadata } from "next";
import ListReaderInShell from "../../../examples/list-reader/in-shell";

export const metadata: Metadata = { title: "List + reader demo · Semi Design System" };

/** examples/list-reader/in-shell.tsx full screen (AppShell page="fixed" + Page fixed + ListReaderLayout). */
export default function ListReaderDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ListReaderInShell />
      {children}
    </>
  );
}
