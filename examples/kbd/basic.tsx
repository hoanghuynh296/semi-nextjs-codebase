import { Kbd } from "@semi/ui";

export default function KbdBasic() {
  return (
    <p className="flex flex-wrap items-center gap-2 text-ui text-body">
      Mở bảng lệnh <Kbd keys={["⌘", "K"]} /> · Gửi <Kbd keys={["Ctrl", "Enter"]} /> · Đóng <Kbd>Esc</Kbd>
    </p>
  );
}
