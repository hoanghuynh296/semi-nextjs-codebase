"use client";

import { Button, toast } from "@semi/ui";

export default function ToastTones() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast({ title: "Đã lưu thay đổi", tone: "success", action: { label: "Hoàn tác", onClick: () => toast({ title: "Đã hoàn tác" }) } })}>
        Thành công + hoàn tác
      </Button>
      <Button onClick={() => toast({ title: "Mất kết nối máy in", description: "Thử lại sau vài giây.", tone: "warning" })}>Cảnh báo</Button>
      <Button onClick={() => toast({ title: "Tệp sẽ được gửi khi máy rảnh", tone: "info", duration: 0 })}>Không tự tắt</Button>
    </div>
  );
}
