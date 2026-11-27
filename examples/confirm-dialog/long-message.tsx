"use client";

import { useState } from "react";
import { Button, confirmDialog } from "@semi/ui";

const FILES = Array.from({ length: 40 }, (_, i) => `mau-${String(i + 1).padStart(2, "0")}.gcode`);

/** A message the caller does not control (a list from the server): it scrolls, the buttons always show. */
export default function ConfirmLongMessage() {
  const [result, setResult] = useState("");
  const remove = async () => {
    const ok = await confirmDialog({
      title: `Xoá ${FILES.length} tệp G-code?`,
      message: `Các tệp sau sẽ bị xoá vĩnh viễn:\n${FILES.join("\n")}`,
      confirmLabel: "Xoá",
      tone: "danger",
    });
    setResult(ok ? "Đã xoá" : "Đã huỷ");
  };
  return (
    <div className="flex items-center gap-3">
      <Button variant="danger" icon="trash" onClick={remove}>
        Xoá {FILES.length} tệp
      </Button>
      {result && <span className="text-ui text-muted">{result}</span>}
    </div>
  );
}
