"use client";

import { useState } from "react";
import { CustomCombobox, Field, type CustomComboboxOption } from "@semi/ui";

const REPOS: CustomComboboxOption[] = [
  { value: "semi-nextjs-codebase", label: "semi-nextjs-codebase", group: "Nền tảng" },
  { value: "semi-brand", label: "semi-brand", group: "Nền tảng" },
  { value: "sales-hub", label: "sales-hub", group: "Ứng dụng" },
  { value: "data-hub", label: "data-hub", group: "Ứng dụng" },
  { value: "feedback-hub", label: "feedback-hub", group: "Ứng dụng" },
];

export default function ComboboxGroups() {
  const [repo, setRepo] = useState("");
  return (
    <div className="max-w-md">
      <Field label="Kho mã nguồn">
        <CustomCombobox value={repo} onChange={setRepo} placeholder="Tìm repo…" options={REPOS} />
      </Field>
    </div>
  );
}
