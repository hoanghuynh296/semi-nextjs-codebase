import { useState } from "react";
import { Field, FileDrop, type FileDropItem, type FileRejection } from "@semi/ui";

// Testing an upload (Playwright): the hidden input has the button's name, so
//   await page.getByLabel("Tệp nhập").and(page.locator('input[type="file"]')).setInputFiles("bang-gia.csv");
// (plain getByLabel("Tệp nhập") matches the button too). Or wait for the `filechooser` event after clicking the button.
export default function FileDropBasic() {
  const [items, setItems] = useState<FileDropItem[]>([
    { id: "seed", name: "bang-gia-2026.xlsx", size: 48_200, status: "done" },
  ]);
  const [error, setError] = useState<string>();

  const upload = (files: File[]) => {
    setError(undefined);
    for (const file of files) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setItems((cur) => [...cur, { id, name: file.name, size: file.size, status: "uploading", progress: 0 }]);
      let progress = 0;
      const timer = setInterval(() => {
        progress = Math.min(100, progress + 20);
        setItems((cur) => cur.map((i) => (i.id === id ? { ...i, progress, status: progress === 100 ? "done" : "uploading" } : i)));
        if (progress === 100) clearInterval(timer);
      }, 400);
    }
  };
  const WHY = { type: "sai định dạng", size: "quá 10 MB", directory: "là thư mục", duplicate: "đã có", multiple: "thừa" } as const;
  const reject = (rejections: FileRejection[]) => setError(rejections.map((r) => `${r.file.name}: ${WHY[r.reason]}`).join("; "));

  return (
    <Field label="Tệp nhập" error={error}>
      <FileDrop
        multiple
        accept={[".csv", ".xlsx"]}
        maxSize={10_000_000}
        hint="CSV hoặc XLSX, tối đa 10 MB"
        items={items}
        onAdd={upload}
        onReject={reject}
        onRemove={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
      />
    </Field>
  );
}
