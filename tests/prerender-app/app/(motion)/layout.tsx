"use client";

import "./motion.css";
import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "../../../../src/AppShell";
import { PageEnter } from "../../../../src/PageEnter";

export default function MotionShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFixed = pathname === "/motion/fixed";
  const activeId = pathname?.split("/").pop() || "orders";
  const mounts = useRef(0);
  useEffect(() => {
    mounts.current += 1;
    (window as unknown as { __motionShellMounts?: number }).__motionShellMounts = mounts.current;
  }, []);

  return (
    <AppShell
      flush
      page={isFixed ? "fixed" : "scroll"}
      productName="Semi Motion"
      sections={[
        {
          label: "Motion",
          items: [
            { id: "orders", label: "Orders", icon: "bag", href: "/motion/orders" },
            { id: "catalog", label: "Catalog", icon: "sparkles", href: "/motion/catalog" },
            { id: "fixed", label: "Fixed", icon: "inbox", href: "/motion/fixed" },
          ],
        },
      ]}
      activeId={activeId}
      header={{
        account: { name: "Ada Lovelace", detail: "Engineer" },
      }}
    >
      <PageEnter>{children}</PageEnter>
    </AppShell>
  );
}
