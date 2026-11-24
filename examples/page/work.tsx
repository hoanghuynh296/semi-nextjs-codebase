"use client";

import { Button, Card, KpiCard, Page, PageGrid, PageSection, toast } from "@semi/ui";

export default function PageWorkExample() {
  return (
    <Page
      layout="work"
      title="Tổng quan xưởng in"
      actions={
        <Button variant="inverse" icon="plus" onClick={() => toast({ title: "Tạo lệnh in" })}>
          Tạo lệnh in
        </Button>
      }
    >
      <PageSection title="Hôm nay">
        <PageGrid columns={3}>
          <KpiCard label="Đang in" value="8 máy" sub="2 máy sắp xong" featured />
          <KpiCard label="Hoàn thành" value="24 đơn" sub="+4 so với hôm qua" />
          <KpiCard label="Chờ duyệt" value="3 đơn" sub="Cần kiểm tra file" />
        </PageGrid>
      </PageSection>
      <PageSection title="Ghi chú vận hành">
        <Card>
          <p className="text-ui text-body">Ca chiều ưu tiên các đơn giao trong ngày trước 17:00.</p>
        </Card>
      </PageSection>
    </Page>
  );
}
