"use client";

import { useState } from "react";
import { Checkbox } from "@semi/ui";

export default function CheckboxBasic() {
  const [auto, setAuto] = useState(true);
  return <Checkbox checked={auto} onChange={setAuto} label="Tự động in khi rảnh" description="Máy nhận job tiếp theo trong hàng đợi." />;
}
