"use client";

import { Button, SearchInput, SplitButton, toast } from "@semi/ui";

// G1: one way to start one job. The other ways to add a customer live under the ▾, not as toolbar buttons.
export default function SplitButtonToolbar() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SearchInput value="" onChange={() => undefined} placeholder="Tìm khách hàng" className="flex-1 min-w-48" />
      <Button iconOnly icon="download" aria-label="Xuất Excel" />
      <SplitButton
        label="Thêm khách hàng"
        icon="plus"
        onClick={() => toast({ title: "Mở biểu mẫu thêm khách hàng" })}
        menuLabel="Cách thêm khác"
        items={[
          { label: "Nhập từ file", icon: "upload", description: "Excel hoặc CSV", onSelect: () => toast({ title: "Chọn file" }) },
          { label: "Tìm trong Data Hub", icon: "search", onSelect: () => toast({ title: "Mở Data Hub" }) },
        ]}
      />
    </div>
  );
}
