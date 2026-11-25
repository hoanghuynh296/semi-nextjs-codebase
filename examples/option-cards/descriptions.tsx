"use client";

import { useState } from "react";
import { Field, OptionCards } from "@semi/ui";

export default function OptionCardsDescriptions() {
  const [delivery, setDelivery] = useState("warehouse");
  return (
    <div className="max-w-xl">
      <Field label="Phương thức giao hàng">
        <OptionCards
          value={delivery}
          onChange={setDelivery}
          options={[
            { value: "warehouse", label: "Giao tại kho", description: "Nhận hàng trực tiếp tại kho Bình Dương.", icon: "truck" },
            { value: "port", label: "FOB cảng Hải Phòng", description: "Nhà cung cấp chịu chi phí đến khi hàng lên tàu.", icon: "globe" },
            { value: "express", label: "Chuyển phát nhanh", description: "Chỉ áp dụng cho mẫu dưới 5 kg.", icon: "zap" },
          ]}
        />
      </Field>
    </div>
  );
}
