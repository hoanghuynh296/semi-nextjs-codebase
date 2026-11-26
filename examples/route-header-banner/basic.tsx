import { useState } from "react";
import { Button, RouteHeader, RouteHeaderBanner, type RouteHeaderBannerProps, type RouteHeaderBannerStore } from "@semi/ui";

// "Dismissed" in memory, so this page can show it again; an app keeps the default localStorage store or its own.
const memory = new Set<string>();
const memoryStore: RouteHeaderBannerStore = { get: (id) => memory.has(id), set: (id) => void memory.add(id) };

export default function RouteHeaderBannerBasic() {
  const [round, setRound] = useState(0);
  const banner: RouteHeaderBannerProps = {
    id: `docs-ai-assistant-${round}`,
    text: "Trợ lý AI giờ đọc được cả đơn hàng và báo giá",
    sub: "Từ 01/12",
    cta: { label: "Xem ngay", onClick: () => {} },
    store: memoryStore,
  };
  return (
    <div className="flex flex-col gap-stack">
      <div className="rounded-card bg-app">
        <RouteHeader
          crumbs={[{ label: "Bán hàng", href: "#" }, { label: "Đơn hàng" }]}
          middle={<RouteHeaderBanner {...banner} />}
          actions={<Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo" />}
          account={{ name: "Lan Phạm", detail: "Quản lý" }}
        />
      </div>
      {/* below md the header's centre is hidden: the same banner is the first row of the page */}
      <RouteHeaderBanner {...banner} placement="inline" />
      <Button size="sm" icon="refresh" onClick={() => setRound((n) => n + 1)} className="self-start">
        Hiện lại thông báo
      </Button>
    </div>
  );
}
