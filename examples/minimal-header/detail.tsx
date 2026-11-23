"use client";

import { Breadcrumb, Button, MinimalHeader } from "@semi/ui";

export default function MinimalHeaderDetail() {
  return (
    <MinimalHeader
      left={<Breadcrumb items={[{ label: "Đơn hàng", href: "#" }, { label: "DH-1042" }]} />}
      link={<a href="#" className="text-strong hover:underline">Xem lịch sử</a>}
      primary={
        <Button variant="primary" icon="check">
          Xác nhận đơn
        </Button>
      }
    />
  );
}
