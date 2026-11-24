"use client";

import React from "react";
import { Card } from "../../../../../src/Card";
import { Page, PageGrid, PageSection } from "../../../../../src/Page";

export default function ReadingLayoutPage() {
  return (
    <Page
      layout="reading"
      title="Thư viện vật liệu"
      titleVariant="reading"
      intro="Chọn vật liệu phù hợp giúp bản in đạt độ chính xác và độ bền ổn định."
    >
      <PageSection title="Vật liệu phổ biến">
        <PageGrid columns={3}>
          {["PLA+", "PETG", "ABS"].map((name) => (
            <Card key={name} className="flex flex-col gap-2">
              <h3 className="text-lead font-medium text-strong">{name}</h3>
              <p className="text-ui text-muted">Nhiệt độ đầu phun và độ bám bàn in tiêu chuẩn.</p>
            </Card>
          ))}
        </PageGrid>
      </PageSection>
      <PageSection title="Hướng dẫn bảo quản">
        <Card>
          <p className="text-ui text-body">Giữ cuộn nhựa trong hộp hút ẩm dưới 20% RH để tránh nổ bọt khi in.</p>
        </Card>
      </PageSection>
    </Page>
  );
}
