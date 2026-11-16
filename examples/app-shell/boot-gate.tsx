"use client";

// app/(app)/layout.tsx of a client-only app: the session check runs once here, never per page.
// With a server session (proxy / async server layout) drop the gate: render AppShell straight away.
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, BootLoader, type ShellNavSection } from "@semi/ui";

const SECTIONS: ShellNavSection[] = [
  {
    label: "Dữ liệu",
    items: [
      { id: "search", label: "Tìm kiếm", icon: "search", href: "/search" },
      { id: "companies", label: "Doanh nghiệp", icon: "store", href: "/companies" },
      { id: "import", label: "Nhập file", icon: "upload", href: "/import" },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? setReady(true) : router.replace("/login")))
      .catch(() => router.replace("/login"));
  }, [router]);

  // Before the layout is known: a centred spinner, not a page skeleton that may never appear.
  if (!ready) return <BootLoader />;
  const active = SECTIONS[0].items.find((i) => path.startsWith(i.href ?? ""))?.id ?? "search";
  return (
    <AppShell productName="Data Hub" logoIcon="database" sections={SECTIONS} activeId={active}>
      {children}
    </AppShell>
  );
}
