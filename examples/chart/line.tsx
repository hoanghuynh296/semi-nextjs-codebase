import { LineChart } from "@semi/ui";

const DATA = Array.from({ length: 12 }, (_, i) => ({
  week: `Tuần ${i + 1}`,
  revenue: Math.round(40 + i * 4 + 10 * Math.sin(i / 1.6)),
  cost: Math.round(28 + i * 2 + 6 * Math.cos(i / 2)),
}));

export default function ChartLine() {
  return (
    <LineChart
      area
      label="Doanh thu và chi phí, 12 tuần (triệu ₫)"
      data={DATA}
      index="week"
      formatIndex={(w) => w.replace("Tuần ", "T")}
      series={[
        { key: "revenue", label: "Doanh thu" },
        { key: "cost", label: "Chi phí" },
      ]}
      format={(v) => `${v} tr ₫`}
    />
  );
}
