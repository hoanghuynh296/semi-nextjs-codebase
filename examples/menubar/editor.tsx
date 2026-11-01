import { Menubar, toast } from "@semi/ui";

const run = (title: string) => () => toast({ title });

export default function MenubarEditor() {
  return (
    <Menubar
      label="Lệnh của trình chỉnh sửa"
      menus={[
        {
          label: "Tệp",
          items: [
            { label: "Mở…", icon: "folderOpen", shortcut: "⌘O", onSelect: run("Mở tệp") },
            { label: "Lưu", icon: "check", shortcut: "⌘S", onSelect: run("Đã lưu") },
            { label: "Xuất G-code", icon: "download", separator: true, onSelect: run("Xuất G-code") },
          ],
        },
        {
          label: "Sửa",
          items: [
            { label: "Hoàn tác", shortcut: "⌘Z", onSelect: run("Hoàn tác") },
            { label: "Làm lại", shortcut: "⇧⌘Z", onSelect: run("Làm lại"), disabled: true },
          ],
        },
        {
          label: "Xem",
          items: [
            { label: "Vừa khung hình", icon: "focus", onSelect: run("Vừa khung hình") },
            { label: "Hiện lưới", icon: "grid", onSelect: run("Hiện lưới") },
          ],
        },
      ]}
    />
  );
}
