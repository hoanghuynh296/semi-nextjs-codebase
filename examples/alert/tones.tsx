import { Alert, Button } from "@semi/ui";

export default function AlertTones() {
  return (
    <div className="grid gap-3 @2xl:grid-cols-2">
      <Alert tone="info" title="Bản cập nhật mới">
        Firmware 1.08 đã sẵn sàng cho 3 máy.
      </Alert>
      <Alert tone="success" title="Đã kết nối">
        Máy X1 Carbon đang online.
      </Alert>
      <Alert tone="warning" title="Sắp hết nhựa" action={<Button size="sm">Đặt thêm</Button>}>
        Cuộn PLA đen còn khoảng 80 g.
      </Alert>
      <Alert tone="danger" title="In thất bại">
        Đầu phun bị tắc ở lớp 132.
      </Alert>
    </div>
  );
}
