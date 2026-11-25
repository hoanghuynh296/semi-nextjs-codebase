"use client";

import { useState } from "react";
import { Field, MultiCombobox, type MultiComboboxOption } from "@semi/ui";

const OPTIONS: MultiComboboxOption[] = [
  { value: "tieu-den", label: "Hạt tiêu đen", group: "Gia vị Tây Nguyên" },
  { value: "tieu-trang", label: "Hạt tiêu trắng", group: "Gia vị Tây Nguyên" },
  { value: "que-yen-bai", label: "Quế thanh Yên Bái", group: "Gia vị miền Bắc" },
  { value: "hoa-hoi", label: "Hoa hồi Lạng Sơn", group: "Gia vị miền Bắc" },
  { value: "ca-phe", label: "Cà phê Robusta", group: "Nông sản khác" },
];

export default function MultiComboboxGroups() {
  const [selected, setSelected] = useState<string[]>(["tieu-den"]);
  return (
    <div className="max-w-lg">
      <Field label="Danh mục sản phẩm">
        <MultiCombobox label="Danh mục sản phẩm" value={selected} onChange={setSelected} options={OPTIONS} />
      </Field>
    </div>
  );
}
