"use client";

import React, { useEffect, useRef, useState } from "react";
import { StorybookShell } from "../StorybookShell";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { PageTitle } from "../../src/PageTitle";
import { Button } from "../../src/Button";
import { Modal } from "../../src/Modal";
import { CustomSelect } from "../../src/CustomSelect";
import { EmptyState } from "../../src/Feedback";
import { Markdown } from "../../src/Markdown";
import {
  AIChat,
  AssistantMessage,
  CHAT_CHIP,
  ChatCopyButton,
  ChatError,
  ChatIntro,
  ChatSuggestion,
  ChatSuggestions,
  ChatThinking,
  UserMessage,
  type ChatItem,
} from "../../src/Chat";

const ANSWER = `Với **PETG**, thử các bước sau:

1. Nhiệt độ đầu phun **240–250°C**, bàn nhiệt 80°C
2. Quạt làm mát 30–50% (cao hơn dễ tách lớp)
3. Bật \`Z-hop\` 0.4 mm để giảm kéo sợi

Nếu vẫn kéo sợi, tăng retraction thêm 0.5 mm mỗi lần.`;

/** ChatSuggestion with href renders ExternalLink. */
const GUIDE_URL = "https://example.com/guide";
const SUGGESTIONS = ["Vì sao bản in PETG bị kéo sợi?", "Gợi ý cài đặt cho PLA lụa", "Giải thích thông số Z-hop"];

/** Fake streaming: types ANSWER out in small chunks; the second question of a chat fails once to show retry. */
function useFakeAssistant() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const asked = useRef(0);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setBusy(false);
    setMessages((ms) => ms.map((m) => (m.pending ? { ...m, pending: false } : m)));
  };
  useEffect(() => stop, []);

  const answer = (fail: boolean) => {
    const id = Date.now();
    setBusy(true);
    setMessages((ms) => [...ms, { id, role: "assistant", content: "", pending: true }]);
    let i = 0;
    setTimeout(() => {
      if (fail) {
        setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, pending: false, error: "Không kết nối được tới model (hết thời gian chờ)." } : m)));
        setBusy(false);
        return;
      }
      timer.current = setInterval(() => {
        i = Math.min(ANSWER.length, i + 6);
        const done = i >= ANSWER.length;
        setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, content: ANSWER.slice(0, i), pending: !done } : m)));
        if (done) stop();
      }, 30);
    }, 700);
  };

  const send = (text: string) => {
    asked.current += 1;
    setMessages((ms) => [...ms, { id: `u${Date.now()}`, role: "user", content: text }]);
    answer(asked.current === 2);
  };
  const retry = (m: ChatItem) => {
    setMessages((ms) => ms.filter((x) => x !== m));
    answer(false);
  };
  const reset = () => {
    stop();
    asked.current = 0;
    setMessages([]);
  };
  return { messages, busy, send, stop, retry, reset };
}

function DemoChat({ placement, shown, onClose }: { placement: "workspace" | "screen"; shown: boolean; onClose: () => void }) {
  const chat = useFakeAssistant();
  const [model, setModel] = useState("sonnet");
  const [draft, setDraft] = useState("");
  return (
    <AIChat
      title="Trợ lý AI"
      placement={placement}
      shown={shown}
      onClose={onClose}
      messages={chat.messages}
      busy={chat.busy}
      onSend={chat.send}
      onStop={chat.stop}
      onRetry={chat.retry}
      onNewChat={chat.reset}
      value={draft}
      onValueChange={setDraft}
      placeholder="Hỏi về cài đặt in…"
      widthKey={null}
      toolbar={
        <CustomSelect
          value={model}
          onChange={setModel}
          aria-label="Model AI"
          options={[
            { value: "sonnet", label: "Claude Sonnet 5.5" },
            { value: "opus", label: "Claude Opus 5.5" },
            { value: "haiku", label: "Claude Haiku 5.5" },
          ]}
        />
      }
      empty={
        <>
          <ChatIntro title="Hỏi gì về bản in?">Trợ lý biết máy in, vật liệu và cài đặt slicer hiện tại của bạn.</ChatIntro>
          <ChatSuggestions label="Gợi ý">
            {SUGGESTIONS.map((s) => (
              <ChatSuggestion key={s} icon="sparkles" onClick={() => chat.send(s)}>
                {s}
              </ChatSuggestion>
            ))}
            <ChatSuggestion icon="fileText" href={GUIDE_URL}>
              Hướng dẫn in PETG (trang ngoài)
            </ChatSuggestion>
          </ChatSuggestions>
        </>
      }
    />
  );
}

export default function ChatPage() {
  const [panel, setPanel] = useState(true);
  const [modal, setModal] = useState(false);
  const [overModal, setOverModal] = useState(false);

  return (
    <StorybookShell>
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="AI Chat" />
        <p className="text-ui text-muted max-w-3xl leading-relaxed">
          Bộ chat AI chuẩn (tách từ 3D Noobs Studio). Chỉ có UI: app tự giữ tin nhắn, stream câu trả lời và gọi model; component chỉ vẽ và báo lại gửi,
          dừng, thử lại. Dùng sẵn <code className={CHAT_CHIP}>AIChat</code> hoặc ghép từng phần.
        </p>
      </div>

      <ShowcaseSection id="ai-chat" title="AIChat (workspace panel)" icon="sparkles" meta="resizable from sm · full screen on phones · Esc closes">
        <div className="flex gap-2">
          <Button size="sm" variant={panel ? "secondary" : "primary"} icon="sparkles" onClick={() => setPanel((v) => !v)}>
            {panel ? "Đóng trợ lý" : "Mở trợ lý"}
          </Button>
          <Button size="sm" icon="layers" onClick={() => setModal(true)}>
            Mở trên Modal
          </Button>
        </div>
        <div className="relative h-[560px] rounded-xl bg-canvas border border-line overflow-hidden" data-testid="chat-workspace">
          <div className="absolute inset-0 flex items-center justify-center text-label text-muted">Canvas / workspace</div>
          {panel && <DemoChat placement="workspace" shown={panel} onClose={() => setPanel(false)} />}
        </div>
        <p className="text-label text-muted">
          Gõ câu hỏi rồi Enter (Shift+Enter xuống dòng). Câu hỏi thứ hai cố ý lỗi để thấy nút thử lại. Cuộn lên khi đang stream: danh sách không bị kéo xuống.
        </p>
      </ShowcaseSection>

      <ShowcaseSection id="chat-parts" title="Parts" icon="layers" meta="compose your own chat from these">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <DemoLabel>UserMessage · AssistantMessage · ChatCopyButton</DemoLabel>
            <div className="flex flex-col gap-4 rounded-xl bg-canvas border border-line p-4">
              <UserMessage>Vì sao bản in PETG bị kéo sợi?</UserMessage>
              <AssistantMessage actions={<ChatCopyButton text={ANSWER} />}>
                <Markdown text={ANSWER} />
              </AssistantMessage>
              <UserMessage failed>Câu hỏi có câu trả lời lỗi</UserMessage>
            </div>
          </div>
          <div className="space-y-3">
            <DemoLabel>ChatThinking · ChatError · CHAT_CHIP</DemoLabel>
            <div className="flex flex-col gap-4 rounded-xl bg-canvas border border-line p-4">
              <AssistantMessage busy>
                <ChatThinking label="Đang đọc cài đặt máy in" />
              </AssistantMessage>
              <ChatError onRetry={() => undefined}>Không kết nối được tới model.</ChatError>
              <ChatError tone="warning">Câu trả lời bị cắt vì quá dài.</ChatError>
              <div className="flex flex-wrap gap-1.5">
                {["Bắt đầu in", "In xong", "Lỗi máy in"].map((c) => (
                  <span key={c} className={CHAT_CHIP}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3 lg:col-span-2">
            <DemoLabel>Setup state (AIChat setup=…): AI not configured</DemoLabel>
            <EmptyState
              icon="settings"
              title="Chưa cài đặt AI"
              description="Nhập API key và chọn model ở trang cài đặt."
              action={
                <Button variant="primary" icon="settings">
                  Mở cài đặt AI
                </Button>
              }
            />
          </div>
        </div>
      </ShowcaseSection>

      <Modal open={modal} onClose={() => setModal(false)} title="Lỗi máy in: HMS 0300-0100" description="Mở trợ lý AI ngay trên modal">
        <p className="text-ui text-body">Trợ lý mở dạng placement=&quot;screen&quot;: phủ cả trang, Esc chỉ đóng trợ lý, modal bên dưới vẫn giữ.</p>
        <Button variant="primary" icon="sparkles" onClick={() => setOverModal(true)}>
          Hỏi AI về lỗi này
        </Button>
      </Modal>
      {overModal && <DemoChat placement="screen" shown={overModal} onClose={() => setOverModal(false)} />}
    </StorybookShell>
  );
}
