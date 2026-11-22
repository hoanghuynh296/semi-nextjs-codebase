import { useState } from "react";
import { DropZone, WorkspaceSection, type FileDropItem } from "@semi/ui";

export default function DropZoneBasic() {
  const [items, setItems] = useState<FileDropItem[]>([]);
  return (
    <div className="max-w-sm rounded-panel bg-panel-3 p-4">
      <WorkspaceSection label="Quy cách đính kèm" count={items.length} max={5}>
        <DropZone
          title="Kéo tệp quy cách vào đây"
          hint="PDF, ảnh mẫu hoặc Excel, tối đa 10 MB"
          accept={[".pdf", "image/*", ".xlsx"]}
          maxSize={10_000_000}
          multiple
          items={items}
          onAdd={(files) => setItems((cur) => [...cur, ...files.map((f) => ({ id: `${f.name}-${f.size}`, name: f.name, size: f.size, status: "done" as const }))])}
          onRemove={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
        />
      </WorkspaceSection>
    </div>
  );
}
