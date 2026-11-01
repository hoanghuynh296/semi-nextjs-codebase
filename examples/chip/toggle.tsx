"use client";

import { useState } from "react";
import { Chip } from "@semi/ui";

const MATERIALS = [
  { key: "pla", label: "PLA", tone: "green" },
  { key: "petg", label: "PETG", tone: "sky" },
  { key: "tpu", label: "TPU", tone: "pink" },
] as const;

export default function ChipToggle() {
  const [on, setOn] = useState<string[]>(["pla"]);
  const toggle = (k: string) => setOn((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]));
  return (
    <div className="flex flex-wrap gap-2">
      {MATERIALS.map((m) => (
        <Chip key={m.key} tone={m.tone} active={on.includes(m.key)} onClick={() => toggle(m.key)}>
          {m.label}
        </Chip>
      ))}
    </div>
  );
}
