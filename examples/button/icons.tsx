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
      <Button variant="primary" iconOnly icon="plus" aria-label="Thêm mới" title="Thêm mới" />
      <Button iconOnly icon="download" aria-label="Tải xuống" title="Tải xuống" />
    </div>
  );
}
