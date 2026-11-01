"use client";

import { useEffect, useState } from "react";
import { AssistantMessage, Button, Reasoning } from "@semi/ui";

const STEPS = ["Người dùng hỏi về nhiệt độ in PETG.", "Nhà sản xuất khuyên 230–250°C cho đầu phun 0,4 mm.", "Bàn nhiệt 70–80°C để bám tốt mà không bị dính chặt.", "Nên giảm quạt làm mát để lớp dính nhau hơn."];

export default function ReasoningStreaming() {
  const [shown, setShown] = useState(STEPS.length);
  const busy = shown < STEPS.length;
  useEffect(() => {
    if (!busy) return;
    const id = setTimeout(() => setShown((n) => n + 1), 700);
    return () => clearTimeout(id);
  }, [busy, shown]);
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <Reasoning busy={busy} duration={4}>
        {STEPS.slice(0, shown).join("\n")}
      </Reasoning>
      {!busy && <AssistantMessage>In PETG ở 240°C, bàn nhiệt 75°C và quạt khoảng 30–50%.</AssistantMessage>}
      <div>
        <Button size="sm" variant="secondary" icon="refresh" onClick={() => setShown(0)}>
          Chạy lại
        </Button>
      </div>
    </div>
  );
}
