"use client";

import { useState } from "react";
import { Button, Card, Page, PageSection, SubNav, toast, type SubNavSection } from "@semi/ui";

export default function PageTwoColumnExample() {
  const [active, setActive] = useState("inbox");
  const sections: SubNavSection[] = [
    {
      label: "Thư mục",
      items: [
        { id: "inbox", label: "Hộp thư đến", icon: "inbox", meta: 12 },
        { id: "sent", label: "Đã gửi", icon: "send" },
        { id: "archive", label: "Lưu trữ", icon: "folder" },
      ],
    },
    {
      label: "Nhóm thư",
      actions: [{ label: "Tạo nhóm thư", icon: "plus", onClick: () => toast({ title: "Tạo nhóm thư mới" }) }],
      items: [
        { id: "suppliers", label: "Nhà cung cấp", icon: "tag", meta: 4 },
        { id: "quotes", label: "Báo giá", icon: "fileText", meta: 7 },
      ],
    },
  ];
  const current = sections.flatMap((s) => s.items).find((i) => i.id === active);
  return (
    <Page
      layout="two-column"
      subNav={<SubNav sections={sections} activeId={active} onSelect={setActive} label="Thư mục hộp thư" />}
      title={current?.label ?? "Hộp thư"}
      actions={
        <Button variant="inverse" icon="plus" onClick={() => toast({ title: "Soạn thư mới" })}>
          Soạn thư
        </Button>
      }
    >
      <PageSection title="Danh sách gần đây">
        <Card>
          <p className="text-ui text-body">Đang xem mục: {current?.label}.</p>
        </Card>
      </PageSection>
    </Page>
  );
}
