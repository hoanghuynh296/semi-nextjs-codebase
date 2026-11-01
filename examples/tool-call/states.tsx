import { ToolCall } from "@semi/ui";

export default function ToolCallStates() {
  return (
    <div className="flex flex-col gap-2 max-w-xl">
      <ToolCall
        name="search_printers"
        title="Tìm máy in rảnh"
        icon="search"
        status="done"
        defaultOpen
        input={{ material: "PETG", nozzle: 0.4 }}
        output={[{ id: "x1c-03", name: "X1 Carbon 03", queue: 0 }]}
      />
      <ToolCall name="slice_model" title="Cắt lớp mô hình" icon="layers" status="running" input={{ file: "gia-do.stl", layer: 0.2 }} />
      <ToolCall name="upload_gcode" title="Gửi G-code tới máy in" icon="upload" status="error" error="Máy in đang offline." input={{ printer: "x1c-03" }} />
      <ToolCall name="notify" title="Báo khách hàng" icon="bell" status="pending" />
    </div>
  );
}
