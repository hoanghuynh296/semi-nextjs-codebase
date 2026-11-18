import { useState } from "react";
import { Field, FileDrop, type FileDropItem } from "@semi/ui";

export default function FileDropSingle() {
  const [items, setItems] = useState<FileDropItem[]>([]);
  const [error, setError] = useState<string>();
  return (
    <Field label="Hợp đồng (PDF)" error={error}>
      <FileDrop
        accept={["application/pdf", ".pdf"]}
        hint="Một tệp PDF"
        items={items}
        onAdd={(files) => {
          setError(undefined);
          setItems(files.map((f) => ({ id: f.name, name: f.name, size: f.size, status: "done" })));
        }}
        onReject={(r) => setError(r.map((x) => x.file.name).join(", ") + " không được thêm")}
        onRemove={() => setItems([])}
      />
    </Field>
  );
}
