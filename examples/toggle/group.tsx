"use client";

import { useState } from "react";
import { ToggleGroup } from "@semi/ui";

export default function ToggleGroupBasic() {
  const [view, setView] = useState<("grid" | "list")[]>(["grid"]);
  const [styles, setStyles] = useState<("bold" | "italic" | "code")[]>(["bold"]);
  return (
    <div className="flex flex-wrap gap-3">
      <ToggleGroup
        label="Chế độ xem"
        value={view}
        onChange={setView}
        options={[
          { key: "grid", icon: "grid", "aria-label": "Lưới" },
          { key: "list", icon: "menu", "aria-label": "Danh sách" },
        ]}
      />
      <ToggleGroup
        type="multiple"
        label="Kiểu chữ"
        value={styles}
        onChange={setStyles}
        options={[
          { key: "bold", label: "Đậm" },
          { key: "italic", label: "Nghiêng" },
          { key: "code", icon: "code", "aria-label": "Code" },
        ]}
      />
    </div>
  );
}
