"use client";

import { Button, toast } from "@semi/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

// A reversible destructive action: do it at once, then offer "Hoàn tác" for 8 seconds. No question first.
// onCommit runs when the window closes without an undo: that is where a real app deletes on the server, and its
// undo must restore on the server too (it can run after this component is gone).
export default function ToastUndo() {
  const [rows, setRows] = useState(["Bản in mẫu A", "Bản in mẫu B", "Bản in mẫu C"]);
  const [gone, setGone] = useState(0);
  const router = useRouter();

  // delete on a detail page, then back to the list: the toast shown just before the navigation stays, and Hoàn tác works
  const archiveAndLeave = () => {
    toast.undo('Đã lưu trữ "Bản in mẫu D"', () => toast.success("Đã khôi phục bản in mẫu D"));
    router.push("/components/confirm-dialog/");
  };

  const archive = (name: string, index: number) => {
    setRows((r) => r.filter((x) => x !== name));
    toast.undo(`Đã lưu trữ "${name}"`, () => setRows((r) => [...r.slice(0, index), name, ...r.slice(index)]), { onCommit: () => setGone((n) => n + 1) });
  };

  return (
    <ul data-undo-list className="w-full max-w-sm flex flex-col gap-2">
      {rows.map((name, i) => (
        <li key={name} className="flex items-center justify-between gap-2 rounded-control border border-line bg-panel px-3 py-2 text-ui text-strong">
          {name}
          <Button size="sm" variant="ghost" icon="trash" onClick={() => archive(name, i)}>
            Lưu trữ
          </Button>
        </li>
      ))}
      {rows.length === 0 && <li className="text-ui text-muted">Đã lưu trữ hết, bấm Hoàn tác để khôi phục.</li>}
      <li>
        <Button size="sm" variant="subtle" onClick={archiveAndLeave}>
          Lưu trữ rồi chuyển trang
        </Button>
      </li>
      <li data-committed className="text-ui text-muted">
        Đã chốt: {gone}
      </li>
    </ul>
  );
}
