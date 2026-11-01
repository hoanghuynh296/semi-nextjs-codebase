"use client";

import { useState } from "react";
import { DatePicker } from "@semi/ui";

export default function DatePickerBasic() {
  const [date, setDate] = useState("2026-11-01");
  return <DatePicker value={date} onChange={setDate} min="2026-10-01" ariaLabel="Ngày in" />;
}
