import { useState } from "react";
import { FileDrop, type FileDropItem } from "@semi/ui";

const initial: FileDropItem[] = [
  { id: "1", name: "anh-san-pham-01.jpg", size: 2_400_000, status: "done" },
  { id: "2", name: "anh-san-pham-02.jpg", size: 3_100_000, status: "uploading", progress: 45 },
  { id: "3", name: "hoa-don-thang-10.pdf", size: 880_000, status: "uploading" },
  { id: "4", name: "anh-san-pham-03.jpg", size: 5_900_000, status: "error", error: "Mất kết nối, thử lại." },
];

export default function FileDropStates() {
  const [items, setItems] = useState(initial);
  const retry = (id: string) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status: "uploading", error: undefined } : i)));
    setTimeout(() => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status: "done" } : i))), 800);
  };
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <FileDrop
        multiple
        accept={["image/*", ".pdf"]}
        hint="Ảnh hoặc PDF"
        items={items}
        onAdd={() => {}}
        onRemove={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
        onRetry={retry}
      />
      <FileDrop disabled hint="Đang khoá" items={[]} onAdd={() => {}} />
    </div>
  );
}
