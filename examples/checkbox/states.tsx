"use client";

import { useState } from "react";
import { Checkbox } from "@semi/ui";

export default function CheckboxStates() {
  const [all, setAll] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Checkbox checked={all} indeterminate={!all} onChange={setAll} label="Chọn tất cả" />
      <Checkbox checked={false} onChange={() => undefined} label="Không khả dụng" disabled />
    </div>
  );
}
