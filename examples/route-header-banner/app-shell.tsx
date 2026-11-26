import { AppShell } from "@semi/ui";

// In AppShell: header.banner. The shell puts it in the header's centre from md and as the first row of the page
// content below md; closing either hides both, remembered per id (localStorage unless you pass a store).
export default function RouteHeaderBannerAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      productName="Kho hàng"
      sections={[{ items: [{ id: "orders", label: "Đơn hàng", icon: "bag", href: "/orders" }] }]}
      activeId="orders"
      header={{
        banner: {
          id: "ai-assistant-2026-12",
          text: "Trợ lý AI giờ đọc được cả đơn hàng và báo giá",
          sub: "Từ 01/12",
          cta: { label: "Xem ngay", href: "/whats-new" },
        },
        account: { name: "Lan Phạm", detail: "Quản lý" },
      }}
    >
      {children}
    </AppShell>
  );
}
