"use client";

import { Button, startTask } from "@semi/ui";

export default function TaskHostFail() {
  const run = () => {
    // No onCancel: a firmware update cannot stop halfway, so there is no Cancel button and Escape does nothing.
    const task = startTask({ label: "Cập nhật firmware", step: "Đang ghi bộ nhớ máy in" });
    setTimeout(() => task.fail("Cập nhật firmware thất bại", "Máy in mất kết nối. Thử lại khi máy online."), 2500);
  };
  return (
    <Button onClick={run}>
      Cập nhật firmware (lỗi)
    </Button>
  );
}
