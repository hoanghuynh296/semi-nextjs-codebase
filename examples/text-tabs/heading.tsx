"use client";

import { useState } from "react";
import { TextTabs } from "@semi/ui";

const VIEWS = [
  { key: "discover", label: "Khám phá", intro: "Các mẫu in 3D nổi bật được cộng đồng hoàn thiện trong tuần qua." },
  { key: "use-cases", label: "Ứng dụng", intro: "Bộ gá xưởng, hộp điện tử và phụ kiện bàn làm việc sẵn thông số in." },
  { key: "collections", label: "Bộ sưu tập", intro: "Tuyển tập theo vật liệu PLA, PETG chịu nhiệt và TPU đàn hồi." },
] as const;

export default function TextTabsHeading() {
  const [view, setView] = useState<(typeof VIEWS)[number]["key"]>("discover");
  const current = VIEWS.find((v) => v.key === view) ?? VIEWS[0];

  return (
    <TextTabs
      label="Thư viện cộng đồng"
      value={view}
      onChange={(next) => setView(next)}
      items={[...VIEWS]}
    >
      <p className="text-lead text-muted">{current.intro}</p>
    </TextTabs>
  );
}
