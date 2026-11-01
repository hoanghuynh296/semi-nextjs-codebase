"use client";

import { useState } from "react";
import { Calendar } from "@semi/ui";

export default function CalendarSingle() {
  const [day, setDay] = useState("2026-11-12");
  return <Calendar value={day} onChange={setDay} min="2026-11-01" />;
}
