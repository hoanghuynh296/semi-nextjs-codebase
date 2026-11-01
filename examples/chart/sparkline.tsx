import { KpiCard, Sparkline } from "@semi/ui";

export default function ChartSparkline() {
  return (
    <div className="grid gap-3 @2xl:grid-cols-2">
      <div className="relative">
        <KpiCard label="Doanh thu tuần" value="61,8 tr ₫" sub="+12% so với tuần trước" tone="good" icon="coin" iconTone="green" />
        <Sparkline label="Doanh thu 8 tuần" values={[42, 45, 44, 50, 48, 55, 58, 62]} className="absolute right-4 bottom-4" />
      </div>
      <div className="relative">
        <KpiCard label="Tỉ lệ lỗi" value="1,8%" sub="-0,4 điểm" tone="good" icon="alert" iconTone="pink" />
        <Sparkline label="Tỉ lệ lỗi 8 tuần" values={[3.1, 2.9, 3.4, 2.6, 2.4, 2.2, 2.0, 1.8]} className="absolute right-4 bottom-4" />
      </div>
    </div>
  );
}
