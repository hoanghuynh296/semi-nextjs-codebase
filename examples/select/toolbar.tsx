"use client";

import { useState } from "react";
import { CustomSelect } from "@semi/ui";

export default function SelectToolbar() {
  const [sort, setSort] = useState("recent");
  return (
    <CustomSelect
      variant="toolbar"
      aria-label="Sắp xếp"
      value={sort}
      onChange={setSort}
      options={[
        { value: "recent", label: "Mới nhất" },
        { value: "name", label: "Tên A–Z" },
        { value: "status", label: "Trạng thái" },
      ]}
    />
  );
}
