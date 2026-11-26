"use client";

// #196 review: a DetailOverlay whose long title stays the same across opening and closing (no ?open= in the URL):
// the heading mounts only when the overlay shows, and its expand toggle must still appear (tests/narrow-layouts.spec.ts).
import { useState } from "react";
import { Button, DetailOverlay } from "../../../src";

const TITLE =
  "Đơn DH-2001 — giao gấp trước Tết cho chuỗi 12 cửa hàng tại Thủ Đức và Bình Thạnh, kèm hoá đơn VAT, biên bản bàn giao từng điểm và ảnh chụp kiện hàng khi nhận, xác nhận trước 15:00";

export default function TitleToggleDemo() {
  const [open, setOpen] = useState(false);
  return (
    <main className="p-6">
      <Button onClick={() => setOpen(true)}>Mở chi tiết</Button>
      <DetailOverlay open={open} onClose={() => setOpen(false)} title={TITLE}>
        <p className="text-ui text-body">Nội dung đơn hàng.</p>
      </DetailOverlay>
    </main>
  );
}
