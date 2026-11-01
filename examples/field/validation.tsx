"use client";

import { useState } from "react";
import { Field, Input } from "@semi/ui";

export default function FieldValidation() {
  const [name, setName] = useState("ab");
  const error = name.length > 0 && name.length < 3 ? "Tên cần ít nhất 3 ký tự." : undefined;
  return (
    <Field label="Tên dự án" required error={error}>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
    </Field>
  );
}
