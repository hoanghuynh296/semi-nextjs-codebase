"use client";

import { Command, toast } from "@semi/ui";

export default function CommandInline() {
  return (
    <div className="h-72 max-w-md rounded-card border border-line bg-panel overflow-hidden">
      <Command
        items={[
          { id: "pla", label: "PLA đen", group: "Vật liệu", icon: "box", onSelect: () => toast({ title: "PLA đen" }) },
          { id: "petg", label: "PETG trong", group: "Vật liệu", icon: "box", onSelect: () => toast({ title: "PETG trong" }) },
          { id: "x1", label: "X1 Carbon 03", group: "Máy in", icon: "printer", onSelect: () => toast({ title: "X1 Carbon 03" }) },
          { id: "a1", label: "A1 Mini 01", group: "Máy in", icon: "printer", disabled: true, onSelect: () => undefined },
        ]}
        placeholder="Tìm vật liệu, máy in…"
      />
    </div>
  );
}
