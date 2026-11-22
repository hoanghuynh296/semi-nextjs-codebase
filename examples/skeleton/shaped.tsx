import { SkeletonDetail, SkeletonList, SkeletonTable } from "@semi/ui";

// Shaped like what loads: list rows, table rows, a record's detail. No spinners in lists (L16).
export default function SkeletonShaped() {
  return (
    <div className="flex flex-col gap-section">
      <div className="rounded-card bg-card">
        <SkeletonList rows={4} columns={2} label="Đang tải hộp thư" />
      </div>
      <SkeletonTable rows={4} columns={5} numeric={[4]} label="Đang tải đơn hàng" />
      <SkeletonDetail fields={4} side label="Đang tải nhà cung cấp" />
    </div>
  );
}
