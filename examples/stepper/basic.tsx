import { useState } from "react";
import { Stepper } from "@semi/ui";

export default function StepperBasic() {
  const [tons, setTons] = useState(12);
  return (
    <div className="max-w-xs">
      <Stepper label="số tấn tiêu đen" unit="tấn" min={1} value={tons} onChange={setTons} />
    </div>
  );
}
