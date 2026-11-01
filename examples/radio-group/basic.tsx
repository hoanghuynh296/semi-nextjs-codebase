"use client";

import { useState } from "react";
import { RadioGroup } from "@semi/ui";

export default function RadioGroupBasic() {
  const [plan, setPlan] = useState<"free" | "pro" | "team">("pro");
  return (
    <RadioGroup
      label="Gói dịch vụ"
      value={plan}
      onChange={setPlan}
      options={[
        { value: "free", label: "Free", description: "1 máy in" },
        { value: "pro", label: "Pro", description: "Tối đa 10 máy" },
        { value: "team", label: "Team", description: "Không giới hạn", disabled: true },
      ]}
    />
  );
}
