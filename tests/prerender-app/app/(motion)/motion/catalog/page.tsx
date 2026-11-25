"use client";

import React from "react";
import { Page, PageGrid, PageSection } from "../../../../../../src/Page";
import { Card } from "../../../../../../src/Card";

const CARDS = Array.from({ length: 14 }, (_, i) => ({
  id: `C-${i + 1}`,
  title: `Vật liệu ${i + 1}`,
  desc: `Mô tả ngắn cho mục ${i + 1}`,
}));

export default function MotionCatalogPage() {
  return (
    <Page layout="work" title="Danh mục" intro="Danh sách vật liệu chuẩn 1.0">
      <PageSection title="Thẻ sản phẩm">
        <PageGrid columns={3}>
          {CARDS.map((c) => (
            <Card key={c.id} className="p-card">
              <div className="text-lead font-medium text-strong">{c.title}</div>
              <div className="text-ui text-muted">{c.desc}</div>
            </Card>
          ))}
        </PageGrid>
      </PageSection>
    </Page>
  );
}
