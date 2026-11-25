"use client";

import { useState } from "react";
import { HintTextarea, type HintToken } from "@semi/ui";

const SNIPPETS: HintToken[] = [
  {
    value: "/vat",
    insert: "Giá chưa gồm VAT 8%, giao tại kho Bình Dương.",
    label: "Giá chưa gồm VAT",
    hint: "Điều khoản thuế và giao hàng tiêu chuẩn",
    icon: "fileText",
  },
  {
    value: "/mau",
    insert: "Bên em xin nhận 1 kg mẫu kiểm tra chất lượng trước khi chốt đơn.",
    label: "Xin mẫu kiểm tra",
    hint: "Mẫu 1 kg trước khi đặt lô chính",
    icon: "fileText",
  },
];

export default function HintTextareaSnippets() {
  const [reply, setReply] = useState("");
  return (
    <div className="max-w-lg h-72 flex flex-col justify-end border border-line rounded-card p-card bg-panel">
      <HintTextarea
        label="Trả lời nhà cung cấp"
        placeholder="Nhập trả lời… gõ / để chèn ghi chú nhanh"
        value={reply}
        onChange={setReply}
        autoGrow
        resizable
        triggers={[{ char: "/", hint: "để chèn ghi chú thường dùng", items: SNIPPETS }]}
      />
    </div>
  );
}
