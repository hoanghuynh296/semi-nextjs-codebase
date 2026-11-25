"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@semi/ui";

export default function FieldSections() {
  const [model, setModel] = useState("claude-sonnet");
  const [prompt, setPrompt] = useState("");
  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-3">
        <div className="text-overline text-muted">Mô hình</div>
        <Field label="Tên mô hình">
          <Input value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
      </div>
      <div className="space-y-3">
        <div className="text-overline text-muted">Lời nhắc</div>
        <div className="h-64 flex flex-col justify-end rounded-card border border-line bg-panel p-card">
          <Field label="Nội dung trả lời">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Gõ nhiều dòng để tự giãn, kéo mép trên (từ md) để đổi chiều cao…"
              autoGrow
              resizable
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
