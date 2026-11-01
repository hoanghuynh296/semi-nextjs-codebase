"use client";

import { useState } from "react";
import { Toggle } from "@semi/ui";

export default function ToggleBasic() {
  const [pinned, setPinned] = useState(false);
  return (
    <Toggle pressed={pinned} onPressedChange={setPinned} icon="pin">
      {pinned ? "Đã ghim" : "Ghim"}
    </Toggle>
  );
}
