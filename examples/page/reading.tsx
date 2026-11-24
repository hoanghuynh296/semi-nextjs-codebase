"use client";

import { Card, Page, PageGrid, PageSection } from "@semi/ui";

const ITEMS = [
  { title: "Nhựa PLA+", detail: "Dễ in, ít cong vênh cho mô hình trưng bày." },
  { title: "Nhựa PETG", detail: "Chịu nhiệt tốt hơn, phù hợp vỏ thiết bị." },
  { title: "Nhựa ABS", detail: "Bền cơ học cao, cần buồng in kín." },
];

export default function PageReadingExample() {
  return (
    <Page
      layout="reading"
      title="Thư viện vật liệu"
      titleVariant="reading"
      intro="Chọn đúng vật liệu giúp bản in bền và ổn định kích thước ngay từ lần đầu."
    >
      <PageSection title="Vật liệu phổ biến" editorial>
        <PageGrid columns={3}>
          {ITEMS.map((item) => (
            <Card key={item.title} className="flex flex-col gap-2">
              <h3 className="text-lead font-medium text-strong">{item.title}</h3>
              <p className="text-ui text-muted">{item.detail}</p>
            </Card>
          ))}
        </PageGrid>
      </PageSection>
    </Page>
  );
}
