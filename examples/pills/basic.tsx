"use client";

import { useState } from "react";
import { Pills } from "@semi/ui";

export default function PillsBasic() {
  const [status, setStatus] = useState("all");
  return (
    <Pills
      value={status}
      onChange={setStatus}
      options={[
        { key: "all", label: "Tất cả" },
        { key: "printing", label: "Đang in" },
        { key: "idle", label: "Chờ lệnh" },
        { key: "error", label: "Lỗi" },
      ]}
    />
  );
}
