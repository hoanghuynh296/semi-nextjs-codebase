"use client";

import { Button, startTask, toast } from "@semi/ui";

const STEPS = ["Kiểm tra file", "Gửi file lên máy in", "Cắt lớp"];

export default function TaskHostUpload() {
  const run = () => {
    let stopped = false;
    const task = startTask({
      label: "Tải file lên máy in",
      step: STEPS[0],
      value: 0,
      timer: true,
      onCancel: () => {
        stopped = true;
        toast({ title: "Đã huỷ tải lên" });
      },
    });
    let value = 0;
    const tick = setInterval(() => {
      if (stopped) return clearInterval(tick);
      value += 10;
      task.update({ value, step: STEPS[Math.min(STEPS.length - 1, Math.floor(value / 34))] });
      if (value >= 100) {
        clearInterval(tick);
        task.done();
        toast({ title: "Đã gửi file tới máy in", tone: "success" });
      }
    }, 400);
  };
  return (
    <Button variant="primary" onClick={run}>
      Tải lên và in
    </Button>
  );
}
