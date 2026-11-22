import { useState } from "react";
import { Field, HintTextarea } from "@semi/ui";

export default function HintTextareaField() {
  const [note, setNote] = useState("");
  return (
    <div className="max-w-md">
      <Field label="Ghi chú nội bộ" hint="Người được nhắc sẽ nhận thông báo.">
        <HintTextarea
          rows={3}
          placeholder="Ghi chú cho đồng nghiệp…"
          value={note}
          onChange={setNote}
          triggers={[
            {
              char: "@",
              hint: "để nhắc đồng nghiệp",
              items: [
                { value: "@ha", label: "Trần Thu Hà", hint: "Mua hàng", icon: "user" },
                { value: "@minh", label: "Lê Văn Minh", hint: "Kho", icon: "user" },
              ],
            },
          ]}
        />
      </Field>
    </div>
  );
}
