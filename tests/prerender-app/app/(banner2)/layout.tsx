"use client";

// styled like the real app: the slots' layout is CSS
import "./banner2.css";
import React from "react";
import { AppShell } from "../../../../src/AppShell";
import { Button } from "../../../../src/Button";

// header.banner with a link CTA and the app's own header.middle (#192 review): the banner covers the centre only while
// it shows; once closed the middle is back, and the right group still never moves.
export default function Banner2Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      productName="Semi Banner 2"
      sections={[
        {
          label: "Workspace",
          items: [
            { id: "orders", label: "Orders", icon: "bag", href: "/banner2/orders" },
            { id: "news", label: "News", icon: "sparkles", href: "/banner2/news" },
          ],
        },
      ]}
      activeId="orders"
      header={{
        banner: { id: "prerender-banner-link", text: "Bảng giá mới áp dụng từ tháng 12", cta: { label: "Xem bảng giá", href: "/banner2/news" } },
        middle: <span data-testid="app-middle" className="text-chrome text-muted">App middle</span>,
        actions: <Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo" />,
        account: { name: "Hoang Huynh", detail: "Owner" },
      }}
    >
      {children}
    </AppShell>
  );
}
