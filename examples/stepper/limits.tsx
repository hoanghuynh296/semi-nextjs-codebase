import { useState } from "react";
import { Stepper } from "@semi/ui";

export default function StepperLimits() {
  const [boxes, setBoxes] = useState(50);
  return (
    <div className="max-w-xs flex flex-col gap-3">
      <Stepper label="số thùng" unit="thùng" min={0} max={200} step={10} value={boxes} onChange={setBoxes} />
      <Stepper label="số bản in" value={1} onChange={() => undefined} disabled />
    </div>
  );
}
