"use client";

import { Button, toast } from "@semi/ui";
import { useState } from "react";

// A reversible destructive action: do it at once, then offer "Hoàn tác" for 8 seconds. No question first.
export default function ToastUndo() {
  const [rows, setRows] = useState(["Bản in mẫu A", "Bản in mẫu B", "Bản in mẫu C"]);

  const archive = (name: string, index: number) => {
    setRows((r) => r.filter((x) => x !== name));
    toast.undo(`Đã lưu trữ "${name}"`, () => setRows((r) => [...r.slice(0, index), name, ...r.slice(index)]));
  };

  return (
    <ul data-undo-list className="w-full max-w-sm flex flex-col gap-2">
      {rows.map((name, i) => (
        <li key={name} className="flex items-center justify-between gap-2 rounded-control border border-line bg-panel px-3 py-2 text-ui text-contrast">
          {name}
          <Button size="sm" variant="ghost" icon="trash" onClick={() => archive(name, i)}>
            Lưu trữ
          </Button>
        </li>
      ))}
      {rows.length === 0 && <li className="text-label text-muted">Đã lưu trữ hết, bấm Hoàn tác để khôi phục.</li>}
    </ul>
  );
}
