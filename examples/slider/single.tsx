"use client";

import { useState } from "react";
import { Slider } from "@semi/ui";

export default function SliderSingle() {
  const [infill, setInfill] = useState(20);
  return <Slider label="Độ đặc (infill)" value={infill} onChange={setInfill} step={5} showValue format={(v) => `${v}%`} className="max-w-sm" />;
}
