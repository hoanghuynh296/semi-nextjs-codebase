"use client";

import { Button, toast, updateToast } from "@semi/ui";

const save = (fail: boolean) => new Promise<number>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("offline")) : resolve(12)), 1500));
const forever = () => new Promise<number>(() => {});

// toast.promise: one toast follows the work, then becomes the result (success once, or the failure with the reason).
// `timeout` (default 30 s) ends the wait with the error text. updateToast changes a toast in place, by its id.
export default function ToastPromise() {
  const progress = () => {
    const id = toast({ title: "Đang gửi 0/3", tone: "info", duration: 0 });
    [1, 2, 3].forEach((n) => setTimeout(() => updateToast(id, n === 3 ? { title: "Đã gửi 3/3", tone: "success", duration: 6000 } : { title: `Đang gửi ${n}/3` }), n * 300));
    return id;
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast.promise(save(false), { loading: "Đang lưu…", success: (n) => `Đã lưu ${n} dòng`, error: "Không lưu được" })}>Lưu</Button>
      <Button variant="secondary" onClick={() => toast.promise(save(true), { loading: "Đang lưu…", success: "Đã lưu", error: (e) => `Không lưu được: ${e instanceof Error ? e.message : "lỗi"}` }).catch(() => {})}>
        Lưu (lỗi)
      </Button>
      <Button variant="secondary" onClick={() => toast.promise(forever(), { timeout: 1500, loading: "Đang kết nối…", success: "Đã kết nối", error: "Quá thời gian chờ" })}>
        Kết nối (treo)
      </Button>
      <Button variant="secondary" onClick={progress}>
        Tiến độ
      </Button>
    </div>
  );
}
