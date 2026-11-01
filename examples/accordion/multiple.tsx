import { Accordion } from "@semi/ui";

export default function AccordionMultiple() {
  return (
    <Accordion
      type="multiple"
      defaultValue={["network", "storage"]}
      items={[
        { key: "network", title: "Mạng", content: "Wi-Fi: Xuong-A · IP 192.168.1.42" },
        { key: "storage", title: "Bộ nhớ", content: "Đã dùng 12,4 / 32 GB" },
        { key: "firmware", title: "Firmware", content: "1.08 (mới nhất)", disabled: true },
      ]}
    />
  );
}
