import { Button } from "@semi/ui";

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary">Lưu</Button>
      <Button>Huỷ</Button>
      <Button variant="danger">Xoá</Button>
      <Button variant="ghost">Xem thêm</Button>
      <Button disabled>Không khả dụng</Button>
    </div>
  );
}
