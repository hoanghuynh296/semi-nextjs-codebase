import { BarChart } from "@semi/ui";

const DATA = [
  { month: "T6", pla: 120, petg: 80 },
  { month: "T7", pla: 150, petg: 96 },
  { month: "T8", pla: 132, petg: 118 },
  { month: "T9", pla: 178, petg: 104 },
  { month: "T10", pla: 196, petg: 140 },
];

export default function ChartBar() {
  return (
    <BarChart
      label="Bản in theo vật liệu, 5 tháng"
      data={DATA}
      index="month"
      series={[
        { key: "pla", label: "PLA" },
        { key: "petg", label: "PETG" },
      ]}
      format={(v) => `${v} bản`}
    />
  );
}
