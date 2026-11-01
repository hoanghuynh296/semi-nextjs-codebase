import { DonutChart } from "@semi/ui";

export default function ChartDonut() {
  return (
    <DonutChart
      label="Đơn theo trạng thái"
      centerLabel="Tổng đơn"
      data={[
        { label: "Đã giao", value: 812 },
        { label: "Đang in", value: 164 },
        { label: "Chờ thanh toán", value: 96 },
        { label: "Huỷ", value: 31 },
      ]}
    />
  );
}
