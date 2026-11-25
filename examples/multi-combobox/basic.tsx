"use client";

import { useState } from "react";
import { Field, MultiCombobox } from "@semi/ui";

const GOODS = [
  { value: "tieu-den", label: "Hạt tiêu đen Đắk Lắk" },
  { value: "que-yen-bai", label: "Quế thanh Yên Bái" },
  { value: "hoa-hoi", label: "Hoa hồi Lạng Sơn" },
  { value: "ca-phe-robusta", label: "Cà phê Robusta Gia Lai" },
  { value: "dieu-binh-phuoc", label: "Hạt điều Bình Phước" },
];

export default function MultiComboboxBasic() {
  const [selected, setSelected] = useState<string[]>(["tieu-den", "que-yen-bai"]);
  return (
    <div className="max-w-lg">
      <Field label="Mặt hàng cung ứng">
        <MultiCombobox label="Mặt hàng cung ứng" value={selected} onChange={setSelected} options={GOODS} />
      </Field>
    </div>
  );
}
