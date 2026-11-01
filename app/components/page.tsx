import type { Metadata } from "next";
import list from "../../examples/list.generated.json";
import { SiteShell } from "../SiteShell";
import { ComponentIndex } from "../../site/ComponentIndex";
import { PageTitle } from "../../src/PageTitle";

export const metadata: Metadata = {
  title: "Components — Semi Design System",
  description: "Every Semi component with a live example: actions, forms, overlays, layout, data, feedback, AI.",
};

export default function ComponentsPage() {
  return (
    <SiteShell>
      <div className="space-y-3">
        <PageTitle title="Component" />
        <p className="text-ui-lg text-body max-w-3xl leading-relaxed">
          {list.length} trang tài liệu, mỗi trang có ví dụ chạy thật, code copy được, bảng API sinh từ TypeScript và bản markdown cho agent. Đổi theme / style ở chân menu để xem mọi component theo từng diện mạo.
        </p>
      </div>
      <ComponentIndex />
    </SiteShell>
  );
}
