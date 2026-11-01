"use client";

import { useEffect, useRef, useState } from "react";
import { AIChat, ChatIntro, ChatSuggestion, ChatSuggestions, type ChatItem } from "@semi/ui";

const ANSWER = `Với **PETG**, thử các bước sau:

1. Nhiệt độ đầu phun **240–250°C**, bàn nhiệt 80°C
2. Quạt làm mát 30–50% (cao hơn dễ tách lớp)
3. Bật \`Z-hop\` 0.4 mm để giảm kéo sợi
4. Retraction 0.8 mm ở 40 mm/s, tăng thêm 0.2 mm nếu vẫn còn sợi

Nếu vẫn kéo sợi, sấy cuộn nhựa 65°C trong 4 giờ: PETG hút ẩm nhanh.`;

export default function AIChatWorkspace() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    setBusy(false);
    setMessages((ms) => ms.map((m) => (m.pending ? { ...m, pending: false } : m)));
  };
  useEffect(() => stop, []);
  const send = (text: string) => {
    const id = Date.now();
    setMessages((ms) => [...ms, { id: `u${id}`, role: "user", content: text }, { id, role: "assistant", content: "", pending: true }]);
    setBusy(true);
    let i = 0;
    timer.current = setInterval(() => {
      i = Math.min(ANSWER.length, i + 4);
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, content: ANSWER.slice(0, i), pending: i < ANSWER.length } : m)));
      if (i >= ANSWER.length) stop();
    }, 30);
  };
  return (
    <div className="relative h-[480px] rounded-card bg-canvas border border-line overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-label text-muted">Canvas / workspace</div>
      <AIChat
        title="Trợ lý AI"
        placement="workspace"
        shown
        onClose={() => undefined}
        messages={messages}
        busy={busy}
        onSend={send}
        onStop={stop}
        onRetry={() => send("Thử lại")}
        onNewChat={() => setMessages([])}
        value={draft}
        onValueChange={setDraft}
        placeholder="Hỏi về cài đặt in…"
        widthKey={null}
        empty={
          <>
            <ChatIntro title="Hỏi gì về bản in?">Trợ lý biết máy in, vật liệu và cài đặt slicer của bạn.</ChatIntro>
            <ChatSuggestions label="Gợi ý">
              <ChatSuggestion icon="sparkles" onClick={() => send("Vì sao PETG bị kéo sợi?")}>
                Vì sao PETG bị kéo sợi?
              </ChatSuggestion>
            </ChatSuggestions>
          </>
        }
      />
    </div>
  );
}
