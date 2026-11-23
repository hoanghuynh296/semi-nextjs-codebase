"use client";

import React from "react";
import { PageTitle } from "../../src/PageTitle";
import { Tabs } from "../../src/Tabs";
import { Button } from "../../src/Button";
import { confirmDialog } from "../../src/confirmDialog";
import { diffDraft, emptyDraft } from "../../scripts/lab.mjs";
import { LAB_SOURCES, setLab, type LabDraft } from "../LabPreview";
import { useLabEditor } from "./shared";
import { TypePanel } from "./TypePanel";
import { ShapePanel } from "./ShapePanel";
import { ColorPanel } from "./ColorPanel";
import { ChangesPanel } from "./ChangesPanel";

type Tab = "type" | "shape" | "color" | "changes";

// Design Lab (docs/LAB.md): core values of Semi tried on the whole docs site before an agent writes them.
export default function LabPage() {
  const lab = useLabEditor();
  const [tab, setTab] = React.useState<Tab>("type");
  const count = diffDraft(lab.draft, LAB_SOURCES).length;
  const reset = async () => {
    const ok = await confirmDialog({ title: "Bỏ bản nháp?", message: `${count} thay đổi sẽ mất. File nguồn không bị ảnh hưởng.`, confirmLabel: "Bỏ bản nháp", tone: "danger" });
    if (ok) setLab({ draft: emptyDraft() as LabDraft });
  };

  return (
    <>
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="Design Lab" />
        <p className="text-ui text-muted max-w-3xl">
          Thử giá trị core của Semi trước khi nhờ agent sửa design system: thang chữ, font và hình khối, density, tham số bộ sinh màu của
          brand. Mỗi thay đổi áp dụng ngay trên mọi trang của docs (nút ở góc dưới để tạm tắt và so với bản gốc) và được kiểm tra trên các brand mẫu. Ưng ý thì
          sang tab Thay đổi, copy lệnh cho agent: <code className="text-ui">npm run lab:apply</code> ghi đúng file nguồn. Hướng dẫn: docs/LAB.md.
        </p>
        {lab.paused && (
          <Button variant="secondary" icon="play" onClick={() => setLab({ draft: lab.draft, paused: false })}>
            Bản nháp đang tạm tắt: bật lại
          </Button>
        )}
      </div>
      <Tabs
        label="Phần của Design Lab"
        value={tab}
        onChange={setTab}
        items={[
          { key: "type", label: "Chữ", icon: "edit" },
          { key: "shape", label: "Hình khối", icon: "shapes" },
          { key: "color", label: "Màu", icon: "palette" },
          { key: "changes", label: "Thay đổi", icon: "code", count },
        ]}
      />
      <div className="space-y-6">
        {tab === "type" && <TypePanel lab={lab} />}
        {tab === "shape" && <ShapePanel lab={lab} />}
        {tab === "color" && <ColorPanel lab={lab} />}
        {tab === "changes" && <ChangesPanel lab={lab} onReset={reset} />}
      </div>
    </>
  );
}
