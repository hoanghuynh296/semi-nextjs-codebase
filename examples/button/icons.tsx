import { Button } from "@semi/ui";

export default function ButtonIcons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" icon="plus">
        Thêm máy in
      </Button>
      <Button icon="refresh">Làm mới</Button>
      <Button variant="danger" icon="trash">
        Xoá
      </Button>
      <Button iconOnly icon="settings" aria-label="Cài đặt" title="Cài đặt" />
      <Button iconOnly icon="download" aria-label="Tải xuống" title="Tải xuống" />
    </div>
  );
}
