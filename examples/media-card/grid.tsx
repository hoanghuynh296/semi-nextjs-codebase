"use client";

import { useState } from "react";
import { Avatar, Badge, Button, MediaCard } from "@semi/ui";

// Stand-in photos (inline SVG) so the example needs no image files; n turns the hue.
const photo = (n: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><g style="filter:hue-rotate(${n * 47}deg)"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/></g></svg>`,
  );

const ITEMS = [
  { title: "Hướng dẫn in mô hình kiến trúc", meta: "Video · 12 phút", author: "Lan Anh", video: "12:04" },
  { title: "Chậu cây mini in 3D", meta: "Mẫu in", author: "Minh Quân" },
  { title: "Kệ sách gấp gọn cho bàn làm việc", meta: "Mẫu in · Mới", author: "Thu Hà" },
  { title: "Tối ưu đường đi đầu in", meta: "Video · 8 phút", author: "Đức Huy", video: "8:31" },
];

export default function MediaCardGrid() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {/* the grid recipe: as many 220px+ columns as fit, cards share the rest */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6">
        {ITEMS.map((it, i) => (
          <MediaCard
            key={it.title}
            onClick={() => setOpened(it.title)}
            media={<img src={photo(i)} alt="" />}
            title={it.title}
            meta={it.meta}
            topLeft={it.video ? <Badge tone="overlay" icon="video">{it.video}</Badge> : undefined}
            bottomRight={
              it.video ? (
                <Button size="pill" variant="inverse" onClick={() => setOpened(`Lưu: ${it.title}`)}>
                  Lưu
                </Button>
              ) : (
                <Badge tone="overlay" className="gap-1.5 pl-0.5">
                  <Avatar name={it.author} size="sm" className="w-5 h-5" />
                  {it.author}
                </Badge>
              )
            }
          />
        ))}
      </div>
      <p role="status" className="text-ui text-muted">
        {opened ? `Đã mở: ${opened}` : "Chọn một thẻ."}
      </p>
    </div>
  );
}
