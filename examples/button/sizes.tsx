import { Button } from "@semi/ui";

export default function ButtonSizes() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" icon="edit">
          Sửa (sm)
        </Button>
        <Button icon="edit">Sửa (md)</Button>
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
