"use client";

import { useState } from "react";
import { FIELD_INPUT, Field, NumberInput } from "@semi/ui";

export default function NumberInputBasic() {
  const [temp, setTemp] = useState("220");
  return (
    <Field label="Nhiệt độ đầu phun" hint="Trên màn hình cảm ứng mở bàn phím số.">
      <NumberInput className={FIELD_INPUT} value={temp} onChange={(e) => setTemp(e.target.value)} unit="°C" integer numpadLabel="Nhiệt độ" />
    </Field>
  );
}
