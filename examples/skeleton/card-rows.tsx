import { SkeletonCard, SkeletonRows } from "@semi/ui";

export default function SkeletonCardRows() {
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <SkeletonCard />
      <SkeletonRows count={3} />
    </div>
  );
}
