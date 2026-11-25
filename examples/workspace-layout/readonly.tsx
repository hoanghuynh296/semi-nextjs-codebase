"use client";

import { Card, WorkspaceHeader, WorkspaceLayout, WorkspaceSection } from "@semi/ui";

export default function WorkspaceReadOnly() {
  // Read-only viewer: omit `action` so no empty pinned bar is rendered at the bottom of the panel.
  return (
    <WorkspaceLayout
      header={<WorkspaceHeader title="YC-014 Tiêu đen" description="Chỉ xem · Sale Member" backHref="#requests" backLabel="Về Mua hàng" headingLevel={2} />}
      panel={
        <>
          <WorkspaceSection label="Mặt hàng" count={2}>
            <Card className="flex flex-col gap-1">
              <span className="text-ui font-medium text-strong">Tiêu đen 550g/l</span>
              <span className="text-chrome text-muted tabular-nums">12 tấn · Giao tại Cát Lái</span>
            </Card>
          </WorkspaceSection>
          <WorkspaceSection label="Người phụ trách">
            <p className="text-ui text-body">Nguyễn Minh An</p>
          </WorkspaceSection>
        </>
      }
      result={
        <Card className="flex flex-col gap-2">
          <h3 className="text-lead font-medium text-strong">Bảng so sánh báo giá</h3>
          <p className="text-ui text-muted">3 nhà cung cấp đã gửi giá. Chờ quản lý chốt đơn.</p>
        </Card>
      }
    />
  );
}
