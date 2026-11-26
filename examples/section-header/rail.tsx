"use client";

import { useRef, useState } from "react";
import { Badge, Button, Icon, MediaCard, SectionHeader } from "@semi/ui";

// Stand-in photos (inline SVG) so the example needs no image files; n turns the hue.
const photo = (n: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><g style="filter:hue-rotate(${n * 47}deg)"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/></g></svg>`,
  );

const ITEMS = Array.from({ length: 7 }, (_, i) => ({ title: `Video hướng dẫn ${i + 1}`, length: `${4 + i}:2${i}` }));

export default function SectionHeaderRail() {
  const rail = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <section aria-labelledby="rail-head" className="flex flex-col gap-4 min-w-0">
      <SectionHeader
        id="rail-head"
        title="Video mới"
        actions={
          <Button variant="ghost">
            Xem tất cả <Icon name="chevron" className="w-3.5 h-3.5" />
          </Button>
        }
        pager={{ target: rail }}
      />
      {/* the rail recipe: one row that scrolls sideways and snaps; 75% wide cards on phones, 3 then 4 per view */}
      <div ref={rail} data-rail="" className="flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain">
        {ITEMS.map((it, i) => (
          <MediaCard
            key={it.title}
            className="snap-start shrink-0 basis-[75%] sm:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]"
            onClick={() => setOpened(it.title)}
            media={<img src={photo(i)} alt="" />}
            title={it.title}
            meta="Video"
            topLeft={<Badge tone="overlay" className="tabular-nums">{it.length}</Badge>}
          />
        ))}
      </div>
      <p role="status" className="text-ui text-muted">
        {opened ? `Đã mở: ${opened}` : "Chọn một video."}
      </p>
    </section>
  );
}
