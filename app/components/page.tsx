import type { Metadata } from "next";
import list from "../../examples/list.generated.json";
import { ComponentIndex } from "../../site/ComponentIndex";
import { PageTitle } from "../../src/PageTitle";

export const metadata: Metadata = {
  title: "Components — Semi Design System",
  description: "Every Semi component with a live example: actions, forms, overlays, layout, data, feedback, AI.",
};

export default function ComponentsPage() {
  return (
    <>
      <div className="space-y-3">
        <PageTitle title="Component" />
        <p className="text-lead text-body max-w-3xl">
          {list.length} trang tài liệu, mỗi trang có ví dụ chạy thật, code copy được, bảng API sinh từ TypeScript và bản markdown cho agent. Đổi sáng / tối ở góc trên phải để kiểm tra mọi component ở cả hai theme.
        </p>
      </div>
      <ComponentIndex />
    </>
  );
}
