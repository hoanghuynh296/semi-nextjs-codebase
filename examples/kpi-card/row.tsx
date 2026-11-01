import { KpiCard } from "@semi/ui";

export default function KpiCardRow() {
  return (
    <div className="grid gap-3 grid-cols-2 @3xl:grid-cols-4">
      <KpiCard label="Sản lượng in" value="1.842" sub="+12.4% so với tuần trước" tone="good" icon="box" iconTone="green" />
      <KpiCard label="Doanh thu" value="48,2 tr ₫" sub="+8.6% so với tháng trước" tone="good" icon="coin" iconTone="pink" />
      <KpiCard label="Giờ máy chạy" value="5.420 h" sub="-2.1%" tone="danger" icon="clock" iconTone="sky" />
      <KpiCard label="Tỉ lệ thành công" value="98.7%" icon="check" iconTone="violet" loading={false} />
    </div>
  );
}
