import { useState } from "react";
import { HintTextarea } from "@semi/ui";

export default function HintTextareaBasic() {
  const [msg, setMsg] = useState("Chào anh chị, bên em cần báo giá cho ");
  return (
    <div className="max-w-md">
      <HintTextarea
        label="Lời nhắn gửi nhà cung cấp"
        value={msg}
        onChange={setMsg}
        triggers={[
          {
            char: "@",
            hint: "để nhắc nhà cung cấp",
            items: [
              { value: "@taynguyen", label: "Gia vị Tây Nguyên", hint: "Đắk Lắk", icon: "truck" },
              { value: "@chuse", label: "HTX Tiêu Chư Sê", hint: "Gia Lai", icon: "truck" },
              { value: "@yenbai", label: "Hương Quế Yên Bái", hint: "Yên Bái", icon: "truck" },
            ],
          },
          {
            char: "/",
            hint: "để chèn mẫu",
            items: [
              { value: "/fob", label: "Hỏi giá FOB", hint: "Giá FOB Hải Phòng, hạn giao", icon: "fileText" },
              { value: "/mau", label: "Xin mẫu", hint: "Gửi 1 kg mẫu trước khi chốt", icon: "fileText" },
            ],
          },
        ]}
      />
    </div>
  );
}
