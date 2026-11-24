"use client";

import { Button, PageTitle, RefreshButton, toast } from "@semi/ui";

export default function PageTitleActions() {
  // 1.0 work-page title row: 18/400 UI sans title on the same row as the page's inverse main action
  return (
    <PageTitle
      title="Yêu cầu mua"
      actions={
        <>
          <RefreshButton onRefresh={() => new Promise((r) => setTimeout(r, 600))} />
          <Button variant="inverse" icon="plus" onClick={() => toast({ title: "Tạo yêu cầu" })}>
            Tạo yêu cầu
          </Button>
        </>
      }
    />
  );
}
