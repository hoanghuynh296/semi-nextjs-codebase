"use client";

import { useState } from "react";
import { Button, Drawer } from "@semi/ui";

/** A long title wraps; a long body scrolls with a soft edge on the side where more content continues. */
export default function DrawerLongContent() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Lịch sử đơn hàng</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Lịch sử đơn DH-2001 giao gấp cho chuỗi 12 cửa hàng tại Thủ Đức và Bình Thạnh, kèm hoá đơn VAT"
        footer={
          <Button size="modal" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        }
      >
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="text-ui text-body">
            {String(8 + Math.floor(i / 4)).padStart(2, "0")}:{String((i % 4) * 15).padStart(2, "0")} · Cửa hàng {(i % 12) + 1} đã nhận kiện hàng.
          </p>
        ))}
      </Drawer>
    </>
  );
}
