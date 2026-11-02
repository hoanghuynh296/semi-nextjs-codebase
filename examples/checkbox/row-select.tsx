"use client";

import { useState } from "react";
import { Checkbox } from "@semi/ui";

const ORDERS = ["1024", "1025", "1026"];

export default function CheckboxRowSelect() {
  const [picked, setPicked] = useState<string[]>(["1025"]);
  const toggle = (o: string, on: boolean) => setPicked(on ? [...picked, o] : picked.filter((x) => x !== o));
  return (
    <ul className="divide-y divide-divider border border-line rounded-card">
      {ORDERS.map((o) => (
        <li key={o} className="flex items-center gap-3 px-3 py-2.5">
          <Checkbox checked={picked.includes(o)} onChange={(on) => toggle(o, on)} aria-label={`Chọn đơn #${o}`} />
          <span className="text-ui text-body tabular-nums">Đơn #{o}</span>
        </li>
      ))}
    </ul>
  );
}
