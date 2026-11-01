import { KpiCard } from "@semi/ui";

export default function KpiCardRow() {
  return (
    <div className="grid gap-3 grid-cols-2 @3xl:grid-cols-4">
      <KpiCard featured label="Doanh thu tháng" value="48,2 tr ₫" sub="+8,6% so với tháng trước" tone="good" />
      <KpiCard label="Đơn mới" value="1.842" sub="+12% so với tuần trước" />
      <KpiCard label="Đơn trễ" value="14" sub="3 đơn quá 2 ngày" tone="danger" icon="clock" iconTone="amber" />
    </div>
  );
}
