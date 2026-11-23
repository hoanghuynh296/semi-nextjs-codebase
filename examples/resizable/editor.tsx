import { ResizablePanels } from "@semi/ui";

export default function ResizableEditor() {
  return (
    <ResizablePanels defaultSizes={[35, 65]} className="h-64">
      <div className="p-4 text-ui text-muted">Danh sách đơn</div>
      <div className="p-4 text-ui text-muted">Chi tiết đơn đang chọn</div>
    </ResizablePanels>
  );
}
