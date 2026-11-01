"use client";

import { useState } from "react";
import { Button, Loading, PageSkeleton, SkeletonGrid } from "@semi/ui";

export default function SkeletonPage() {
  const [shape, setShape] = useState<"grid" | "page">("grid");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant={shape === "grid" ? "primary" : "secondary"} onClick={() => setShape("grid")}>
          SkeletonGrid
        </Button>
        <Button size="sm" variant={shape === "page" ? "primary" : "secondary"} onClick={() => setShape("page")}>
          PageSkeleton
        </Button>
      </div>
      {shape === "grid" ? (
        <SkeletonGrid count={3} className="grid grid-cols-1 @2xl:grid-cols-3 gap-3" />
      ) : (
        <Loading>
          <PageSkeleton />
        </Loading>
      )}
    </div>
  );
}
