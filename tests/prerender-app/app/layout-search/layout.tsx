import { LayoutSearch } from "./LayoutSearch";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <LayoutSearch />
      {children}
    </main>
  );
}
