import { Accordion } from "@semi/ui";

export default function AccordionFaq() {
  return (
    <Accordion
      defaultValue={["petg"]}
      items={[
        { key: "petg", title: "Vì sao PETG bị kéo sợi?", content: "Giảm nhiệt độ 5–10°C, tăng retraction và bật Z-hop." },
        { key: "warp", title: "Bản in bị cong góc?", content: "Lau bàn bằng cồn, dùng brim 5 mm và tắt quạt ở 3 lớp đầu." },
        { key: "clog", title: "Đầu phun bị tắc phải làm sao?", content: "Chạy cold pull 2–3 lần; nếu vẫn tắc, thay đầu phun." },
      ]}
    />
  );
}
