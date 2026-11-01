"use client";

import { Badge, BarChart, Card, DonutChart, Item, ItemGroup, KpiCard, PageTitle, Sparkline } from "@semi/ui";

const WEEKS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"].map((w, i) => ({ week: w, online: 22 + i * 3 + (i % 3) * 4, store: 14 + i * 2 - (i % 2) * 3 }));
const LATEST = [
  { id: "SO-1062", customer: "Nguyễn An", total: "1.240.000 ₫", status: ["emerald", "Đã giao"] },
  { id: "SO-1061", customer: "Trần Bình", total: "380.000 ₫", status: ["sky", "Đang đóng gói"] },
  { id: "SO-1060", customer: "Lê Chi", total: "2.150.000 ₫", status: ["amber", "Chờ thanh toán"] },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageTitle title="Tổng quan" />
      <div className="grid gap-3 grid-cols-2 @3xl:grid-cols-4">
        <KpiCard featured label="Doanh thu tuần" value="61,8 tr ₫" sub="+12% so với tuần trước" tone="good" />
        <KpiCard label="Đơn mới" value="148" sub="+9 so với tuần trước" />
        <KpiCard label="Tỉ lệ huỷ" value="1,8%" sub="-0,4 điểm" tone="good" />
      </div>
      <div className="grid gap-3 @4xl:grid-cols-[2fr_1fr]">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-title font-medium text-contrast">Doanh thu theo kênh</h2>
            <Sparkline label="Tổng doanh thu 8 tuần" values={WEEKS.map((w) => w.online + w.store)} />
          </div>
          <BarChart
            stacked
            label="Doanh thu theo kênh, 8 tuần (triệu ₫)"
            data={WEEKS}
            index="week"
            series={[
              { key: "online", label: "Online" },
              { key: "store", label: "Cửa hàng" },
            ]}
            format={(v) => `${v} tr ₫`}
          />
        </Card>
        <Card className="p-4 space-y-3">
          <h2 className="text-title font-medium text-contrast">Đơn theo trạng thái</h2>
          <DonutChart
            label="Đơn theo trạng thái"
            centerLabel="Tổng đơn"
            data={[
              { label: "Đã giao", value: 812 },
              { label: "Đang đóng gói", value: 164 },
              { label: "Chờ thanh toán", value: 96 },
            ]}
          />
        </Card>
      </div>
      <ItemGroup label="Đơn mới nhất" showLabel>
        {LATEST.map((o) => (
          <Item key={o.id} title={o.id} description={o.customer} meta={<span className="tabular-nums">{o.total}</span>} actions={<Badge tone={o.status[0]} dot size="sm">{o.status[1]}</Badge>} href={`#${o.id}`} />
        ))}
      </ItemGroup>
    </div>
  );
}
