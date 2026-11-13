"use client";

import { useState } from "react";
import { Button, CustomSelect, SubpageToolbar, toast } from "@semi/ui";

export default function SubpageToolbarTitleRow() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  return (
    // The title shares the row with the filter and actions; the page has no PageTitle above.
    <SubpageToolbar
      title="Khách hàng"
      left={
        <CustomSelect
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Mọi trạng thái" },
            { value: "new", label: "Mới" },
            { value: "replied", label: "Đã trả lời" },
          ]}
        />
      }
      right={
        <Button icon="upload" onClick={() => toast({ title: "Nhập file" })}>
          Nhập file
        </Button>
      }
      searchValue={q}
      onSearchChange={setQ}
      searchPlaceholder="Tìm khách…"
      onPrimaryAction={() => toast({ title: "Thêm khách" })}
      primaryActionLabel="Thêm khách"
    />
  );
}
