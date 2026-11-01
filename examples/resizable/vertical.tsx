import { ResizablePanels } from "@semi/ui";

export default function ResizableVertical() {
  return (
    <ResizablePanels direction="vertical" defaultSizes={[50, 30, 20]} className="h-80">
      <div className="p-4 text-label text-muted">Khung xem 3D</div>
      <div className="p-4 text-label text-muted">Lớp</div>
      <div className="p-4 text-label text-muted">Nhật ký</div>
    </ResizablePanels>
  );
}
