import { Button } from "@semi/ui";

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Huỷ</Button>
      <Button variant="primary">Lưu</Button>
      <Button variant="outline">Xuất file</Button>
      <Button variant="danger">Xoá</Button>
      <Button variant="ghost">Xem thêm</Button>
      <Button disabled>Không khả dụng</Button>
    </div>
  );
}
