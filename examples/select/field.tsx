"use client";

import { useState } from "react";
import { CustomSelect, Field } from "@semi/ui";

export default function SelectField() {
  const [printer, setPrinter] = useState("x1c");
  return (
    <Field label="Máy in">
      <CustomSelect
        variant="field"
        value={printer}
        onChange={setPrinter}
        options={[
          { value: "x1c", label: "Bambu Lab X1-Carbon" },
          { value: "p1s", label: "Bambu Lab P1S" },
          { value: "a1", label: "Bambu Lab A1 Mini" },
        ]}
      />
    </Field>
  );
}
