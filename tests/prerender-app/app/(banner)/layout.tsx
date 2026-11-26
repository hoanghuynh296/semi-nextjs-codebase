"use client";

// styled like the real app: the slots' layout is CSS (the right group's edge, the md switch)
import "./banner.css";
import React from "react";
import { AppShell } from "../../../../src/AppShell";
import { Button } from "../../../../src/Button";

// The route header's three slots with an announcement (#192): header.banner shows in the centre from md and as the
// first row of the page content below md; closing either hides both, and the right group must not move.
export default function BannerShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      productName="Semi Banner"
      sections={[
        {
          label: "Workspace",
          items: [
            { id: "orders", label: "Orders", icon: "bag", href: "/banner/orders" },
            { id: "other", label: "Customers", icon: "users", href: "/banner/other" },
          ],
        },
      ]}
      activeId="orders"
      header={{
        banner: {
          id: "prerender-banner",
          text: "Trợ lý AI giờ đã đọc được cả đơn hàng và báo giá của bạn",
          sub: "Từ 01/12",
          cta: {
            label: "Xem ngay",
            onClick: () => {
              const w = window as unknown as { __bannerCta?: number };
              w.__bannerCta = (w.__bannerCta ?? 0) + 1;
            },
          },
        },
        actions: <Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo" />,
        account: { name: "Hoang Huynh", detail: "Owner" },
      }}
    >
      {children}
    </AppShell>
  );
}
