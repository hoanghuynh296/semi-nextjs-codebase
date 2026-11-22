import { Skeleton, SkeletonRows } from "@semi/ui";

// The shape of a records page: a toolbar row, then rows. Use it as a Suspense fallback or inside loading.tsx.
export default function SkeletonListShape() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 flex-1 sm:max-w-xs" />
        <Skeleton className="h-9 w-20" />
      </div>
      <SkeletonRows count={4} label="Đang tải đơn hàng" />
    </div>
  );
}
