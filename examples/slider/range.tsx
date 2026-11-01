"use client";

import { useState } from "react";
import { Slider } from "@semi/ui";

export default function SliderRange() {
  const [price, setPrice] = useState<[number, number]>([100, 600]);
  return (
    <Slider
      range
      label="Khoảng giá"
      value={price}
      onChange={setPrice}
      min={0}
      max={1000}
      step={50}
      showValue
      format={(v) => `${v}k ₫`}
      className="max-w-sm"
    />
  );
}
