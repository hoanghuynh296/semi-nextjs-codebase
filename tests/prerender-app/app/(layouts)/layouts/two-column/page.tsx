"use client";

import React, { useState } from "react";
import { Button } from "../../../../../../src/Button";
import { Card } from "../../../../../../src/Card";
import { Page, PageSection, SubNav, type SubNavSection } from "../../../../../../src/Page";

export default function TwoColumnLayoutPage() {
  const [active, setActive] = useState("inbox");
  const sections: SubNavSection[] = [
    {
      label: "Thư mục",
      items: [
        { id: "inbox", label: "Hộp thư đến", icon: "inbox", meta: 8 },
        { id: "sent", label: "Đã gửi", icon: "send" },
        { id: "folder", label: "Lưu trữ", icon: "folder" },
      ],
    },
    {
      label: "Nhóm thư",
      actions: [{ label: "Tạo nhóm", icon: "plus", onClick: () => setActive("quotes") }],
      items: [
        { id: "suppliers", label: "Nhà cung cấp", icon: "tag", meta: 4 },
        { id: "quotes", label: "Báo giá", icon: "fileText", meta: 6 },
      ],
    },
  ];
  const current = sections.flatMap((s) => s.items).find((i) => i.id === active);
  return (
    <Page
      layout="two-column"
      subNav={<SubNav sections={sections} activeId={active} onSelect={setActive} label="Thư mục hộp thư" />}
      title={current?.label ?? "Hộp thư"}
      actions={<Button variant="inverse" icon="plus">Soạn thư</Button>}
    >
      <PageSection title="Gần đây">
        <Card>
          <p className="text-ui text-body">Đang hiển thị danh mục: {current?.label}.</p>
        </Card>
      </PageSection>
    </Page>
  );
}
