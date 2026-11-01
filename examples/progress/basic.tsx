import { Progress } from "@semi/ui";

export default function ProgressBasic() {
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <Progress label="Tiến độ in" value={64} showValue />
      <Progress label="Dung lượng" value={92} tone="danger" showValue />
      <Progress label="Đang xử lý" />
      <Progress label="Đã tải" value={30} tone="success" size="sm" />
    </div>
  );
}
