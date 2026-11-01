"use client";

import { useState } from "react";
import { Button, ConfirmHost, confirmDialog } from "@semi/ui";

export default function ConfirmDanger() {
  const [result, setResult] = useState("");
  const remove = async () => {
    const ok = await confirmDialog({
      title: "Xoá bản in mẫu?",
      message: "Tệp G-code và dữ liệu lát cắt sẽ bị xoá vĩnh viễn.",
      confirmLabel: "Xoá",
      tone: "danger",
    });
    setResult(ok ? "Đã xoá" : "Đã huỷ");
  };
  return (
    <div className="flex items-center gap-3">
      {/* Once in the root layout of a real app */}
      <ConfirmHost />
      <Button variant="danger" icon="trash" onClick={remove}>
        Xoá bản in
      </Button>
      {result && <span className="text-label text-muted">{result}</span>}
    </div>
  );
}
