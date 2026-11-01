"use client";

import { useState } from "react";
import { Button, Drawer } from "@semi/ui";

type Side = "right" | "left" | "bottom" | "top";

export default function DrawerSides() {
  const [side, setSide] = useState<Side | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      {(["right", "left", "bottom", "top"] as const).map((s) => (
        <Button key={s} onClick={() => setSide(s)}>
          {s}
        </Button>
      ))}
      <Drawer open={side !== null} onClose={() => setSide(null)} side={side ?? "right"} title={`Sheet: ${side ?? ""}`}>
        <p className="text-ui text-body">Nội dung phụ, trang bên dưới vẫn giữ nguyên.</p>
      </Drawer>
    </div>
  );
}
