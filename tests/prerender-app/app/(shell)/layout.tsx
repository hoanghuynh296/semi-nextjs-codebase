import { Shell } from "./Shell";

// A route-group layout with the app shell, no loading.tsx: the dynamic route under it must still prerender (#96).
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
