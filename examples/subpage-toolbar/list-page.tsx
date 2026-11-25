"use client";

import { useState } from "react";
import { SegmentedControl, SubpageToolbar, toast } from "@semi/ui";

export default function SubpageToolbarListPage() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  return (
    <SubpageToolbar
      left={
        <SegmentedControl
          label="Trạng thái máy in"
          value={status}
          onChange={setStatus}
          options={[
            { key: "all", label: "Tất cả" },
            { key: "printing", label: "Đang in" },
            { key: "idle", label: "Chờ lệnh" },
          ]}
        />
      }
      searchValue={q}
      onSearchChange={setQ}
      searchPlaceholder="Tìm máy in…"
      onRefresh={() => new Promise((r) => setTimeout(r, 800))}
      onPrimaryAction={() => toast({ title: "Thêm máy in" })}
      primaryActionLabel="Thêm máy in"
    />
  );
}
