import { ContextMenu, IconTile, toast } from "@semi/ui";

export default function ContextMenuFile() {
  return (
    <ContextMenu
      label="Thao tác tệp"
      items={[
        { label: "Mở", icon: "external", onSelect: () => toast({ title: "Mở tệp" }) },
        { label: "Nhân bản", icon: "copy", shortcut: "⌘D", onSelect: () => toast({ title: "Đã nhân bản", tone: "success" }) },
        { label: "Xoá", icon: "trash", danger: true, separator: true, onSelect: () => toast({ title: "Đã xoá", tone: "danger" }) },
      ]}
    >
      <div className="flex w-64 items-center gap-3 rounded-card border border-line bg-field p-3">
        <IconTile name="fileCode" tone="sky" />
        <div className="min-w-0">
          <div className="text-ui font-medium text-contrast truncate">vo-hop-dieu-khien.gcode</div>
          <div className="text-caption text-muted">Chuột phải (hoặc giữ) để mở menu</div>
        </div>
      </div>
    </ContextMenu>
  );
}
