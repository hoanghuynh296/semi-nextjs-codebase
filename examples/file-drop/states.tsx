import { FileDrop, type FileDropItem } from "@semi/ui";

const items: FileDropItem[] = [
  { id: "1", name: "anh-san-pham-01.jpg", size: 2_400_000, status: "done" },
  { id: "2", name: "anh-san-pham-02.jpg", size: 3_100_000, status: "uploading", progress: 45 },
  { id: "3", name: "hoa-don-thang-10.pdf", size: 880_000, status: "uploading" },
  { id: "4", name: "anh-san-pham-03.jpg", size: 5_900_000, status: "error", error: "Mất kết nối, thử lại." },
];

export default function FileDropStates() {
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <FileDrop multiple accept={["image/*", ".pdf"]} hint="Ảnh hoặc PDF" items={items} onAdd={() => {}} onRemove={() => {}} onRetry={() => {}} />
      <FileDrop disabled hint="Đang khoá" items={[]} onAdd={() => {}} />
    </div>
  );
}
