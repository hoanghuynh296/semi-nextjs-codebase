import { TaskList } from "@semi/ui";

export default function TaskListPlan() {
  return (
    <TaskList
      className="max-w-md"
      title="In 20 giá đỡ cho đơn #1042"
      steps={[
        { label: "Kiểm tra tệp mô hình", status: "done" },
        { label: "Chọn máy in còn trống", status: "done", detail: "X1 Carbon 03, PETG đen" },
        { label: "Cắt lớp và ước lượng thời gian", status: "running" },
        { label: "Đặt lịch in", status: "pending" },
        { label: "Gửi báo giá cho khách", status: "skipped", detail: "Khách đã thanh toán trước" },
      ]}
    />
  );
}
