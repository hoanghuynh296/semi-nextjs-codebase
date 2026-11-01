import { BarChart } from "@semi/ui";

const DATA = [
  { day: "T2", web: 32, shop: 18, partner: 9 },
  { day: "T3", web: 41, shop: 22, partner: 12 },
  { day: "T4", web: 28, shop: 25, partner: 8 },
  { day: "T5", web: 47, shop: 19, partner: 14 },
  { day: "T6", web: 53, shop: 31, partner: 16 },
  { day: "T7", web: 61, shop: 44, partner: 20 },
  { day: "CN", web: 38, shop: 40, partner: 11 },
];

export default function ChartStacked() {
  return (
    <BarChart
      stacked
      label="Đơn hàng theo kênh, 7 ngày"
      data={DATA}
      index="day"
      series={[
        { key: "web", label: "Website" },
        { key: "shop", label: "Cửa hàng" },
        { key: "partner", label: "Đối tác" },
      ]}
    />
  );
}
