"use client";

// "Soi component" in the docs header (#194): turns the component inspector on / off (also the I key); remembered.
import React from "react";
import { Switch } from "../../src/Choice";
import { setInspectorOn, useInspectorOn } from "./store";

export function InspectorToggle() {
  const on = useInspectorOn();
  return (
    <span className="hidden md:inline-flex mr-2" title="Rê chuột lên một phần của ví dụ để xem tên component (phím I)">
      <Switch size="sm" checked={on} onChange={setInspectorOn} label="Soi component" />
    </span>
  );
}
