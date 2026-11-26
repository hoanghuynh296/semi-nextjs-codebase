import { Button } from "@semi/ui";

export default function ButtonSizes() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg" variant="inverse" icon="plus">
          Tạo đơn (lg)
        </Button>
        <Button icon="edit">Sửa (md)</Button>
        <Button size="sm" icon="edit">
          Sửa (sm)
        </Button>
        <Button size="pill" variant="inverse" icon="plus">
          Mời (pill)
        </Button>
        <Button size="xs" variant="inverse" shape="round" icon="plus">
          Thêm (xs)
        </Button>
        <Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo, 12 chưa đọc" badge={12} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg" variant="danger" icon="trash">
          Xoá dự án (lg)
        </Button>
        <Button variant="danger">Xoá (md)</Button>
        <Button size="pill" variant="danger-subtle">
          Gỡ (pill)
        </Button>
      </div>
      <div className="flex gap-2 max-w-sm">
        <Button size="modal" className="flex-1">
          Huỷ
        </Button>
        <Button size="modal" variant="primary" className="flex-1">
          Xác nhận
        </Button>
      </div>
    </div>
  );
}
