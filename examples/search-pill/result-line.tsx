"use client";

import { useState } from "react";
import { ResultLine, SearchPill } from "@semi/ui";

const SORTS = [
  { value: "recent", label: "Mới thêm" },
  { value: "volume", label: "Sản lượng năm" },
  { value: "name", label: "Tên A–Z" },
];

export default function SearchPillResultLine() {
  const [q, setQ] = useState("tiêu đen");
  const [sort, setSort] = useState("recent");
  return (
    <div className="flex flex-col gap-2 w-full">
      <SearchPill value={q} onChange={setQ} label="Tìm khách hàng" shortcut="⌘K" />
      <ResultLine query={q} count={q ? 128 : 1240} unit="khách hàng" sort={{ value: sort, onChange: setSort, options: SORTS }} />
    </div>
  );
}
