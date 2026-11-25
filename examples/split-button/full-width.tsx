"use client";

import { SplitButton, toast } from "@semi/ui";

export default function SplitButtonFullWidth() {
  return (
    <div className="max-w-sm">
      <SplitButton
        fullWidth
        label="Gửi hỏi giá"
        icon="send"
        onClick={() => toast.success("Đã gửi hỏi giá")}
        menuLabel="Cách gửi khác"
        items={[
          { label: "Gửi từ mẫu", icon: "fileText", onSelect: () => toast.info("Chọn mẫu") },
          { label: "Lưu nháp", icon: "check", onSelect: () => toast.info("Đã lưu nháp") },
        ]}
      />
    </div>
  );
}
