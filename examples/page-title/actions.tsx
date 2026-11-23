"use client";

import { Button, PageTitle, RefreshButton, toast } from "@semi/ui";

export default function PageTitleActions() {
  // a list page's title row: the page's one action on the right; below sm it wraps under the title
  return (
    <PageTitle
      title="Yêu cầu mua"
      actions={
        <>
          <RefreshButton onRefresh={() => new Promise((r) => setTimeout(r, 600))} />
          <Button variant="primary" icon="plus" onClick={() => toast({ title: "Tạo yêu cầu" })}>
            Tạo yêu cầu
          </Button>
        </>
      }
    />
  );
}
