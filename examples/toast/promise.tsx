"use client";

import { Button, toast } from "@semi/ui";

const save = (fail: boolean) => new Promise<number>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("offline")) : resolve(12)), 1500));

// toast.promise: one toast follows the work, then becomes the result (success once, or the failure with the reason).
export default function ToastPromise() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast.promise(save(false), { loading: "Đang lưu…", success: (n) => `Đã lưu ${n} dòng`, error: "Không lưu được" })}>Lưu</Button>
      <Button variant="secondary" onClick={() => toast.promise(save(true), { loading: "Đang lưu…", success: "Đã lưu", error: (e) => `Không lưu được: ${e instanceof Error ? e.message : "lỗi"}` }).catch(() => {})}>
        Lưu (lỗi)
      </Button>
    </div>
  );
}
