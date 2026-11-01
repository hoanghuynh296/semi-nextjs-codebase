"use client";

import { useState } from "react";
import { CustomCombobox, Field } from "@semi/ui";

export default function ComboboxBasic() {
  const [material, setMaterial] = useState("pla_matte");
  return (
    <Field label="Vật liệu">
      <CustomCombobox
        value={material}
        onChange={setMaterial}
        placeholder="Tìm loại nhựa…"
        options={[
          { value: "pla_matte", label: "eSUN PLA Matte Black" },
          { value: "petg_hf", label: "Bambu PETG-HF White" },
          { value: "abs_fire", label: "Polymaker ABS Fire Red" },
          { value: "tpu_95a", label: "Inland TPU 95A Orange" },
        ]}
      />
    </Field>
  );
}
