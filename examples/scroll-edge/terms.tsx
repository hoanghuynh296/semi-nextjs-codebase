"use client";

import { useRef } from "react";
import { SCROLL_EDGE, cn, useScrollEdges } from "@semi/ui";

/** Your own scrolling area on the panel surface: the hook says which edges continue, SCROLL_EDGE draws the fades. */
export default function ScrollEdgeTerms() {
  const ref = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(ref);
  return (
    <div className="relative max-w-md">
      <div
        ref={ref}
        role="region"
        aria-label="Điều khoản sử dụng"
        tabIndex={edges.scrolls ? 0 : undefined}
        className="h-48 overflow-y-auto overscroll-contain space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-control"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} className="text-ui text-body">
            Điều {i + 1}. Người dùng chịu trách nhiệm về nội dung tải lên và đồng ý để hệ thống lưu bản sao trong 30 ngày.
          </p>
        ))}
      </div>
      <span aria-hidden className={cn(SCROLL_EDGE.top, edges.top ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn(SCROLL_EDGE.bottom, edges.bottom ? "opacity-100" : "opacity-0")} />
    </div>
  );
}
