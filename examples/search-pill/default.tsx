"use client";

import { useState } from "react";
import { SearchPill } from "@semi/ui";

export default function SearchPillDefault() {
  const [q, setQ] = useState("");
  return (
    <div className="flex flex-col gap-2 w-full">
      <SearchPill value={q} onChange={setQ} label="Tìm khách hàng" placeholder="Tìm khách, quốc gia, mặt hàng…" focusKey="/" />
      <p className="text-label text-muted">
        Đang tìm: <span className="text-contrast">{q || "—"}</span> (gõ xong 250 ms mới gửi; Esc để xoá; phím / để vào ô tìm)
      </p>
    </div>
  );
}
