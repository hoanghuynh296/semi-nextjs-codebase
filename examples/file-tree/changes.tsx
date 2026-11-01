"use client";

import { useState } from "react";
import { FileTree, type FileNode } from "@semi/ui";

const FILES: FileNode[] = [
  {
    name: "src",
    children: [
      { name: "components", children: [{ name: "PrinterCard.tsx", change: "modified" }, { name: "QueueList.tsx", change: "added" }, { name: "OldQueue.tsx", change: "deleted" }] },
      { name: "app.tsx" },
    ],
  },
  { name: "package.json", change: "modified" },
  { name: "README.md" },
];

export default function FileTreeChanges() {
  const [file, setFile] = useState("src/components/PrinterCard.tsx");
  return (
    <div className="grid gap-3 @xl:grid-cols-[240px_1fr]">
      <FileTree label="Tệp đã thay đổi" files={FILES} selected={file} onSelect={setFile} className="rounded-card border border-line bg-panel p-1.5" />
      <div className="rounded-card border border-line p-3 text-label text-muted break-all">{file}</div>
    </div>
  );
}
