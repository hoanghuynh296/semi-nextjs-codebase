"use client";

import { useState } from "react";
import { AIChat, Button, Modal, type ChatItem } from "@semi/ui";

export default function AIChatOverModal() {
  const [modal, setModal] = useState(false);
  const [chat, setChat] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  return (
    <>
      <Button icon="layers" onClick={() => setModal(true)}>
        Mở lỗi máy in
      </Button>
      <Modal open={modal} onClose={() => setModal(false)} title="Lỗi máy in: HMS 0300-0100" description="Mở trợ lý AI ngay trên modal">
        <p className="text-ui text-body">placement=&quot;screen&quot; phủ cả trang: Esc chỉ đóng trợ lý, modal bên dưới vẫn giữ.</p>
        <Button variant="primary" icon="sparkles" onClick={() => setChat(true)}>
          Hỏi AI về lỗi này
        </Button>
      </Modal>
      {chat && (
        <AIChat
          title="Trợ lý AI"
          placement="screen"
          shown={chat}
          onClose={() => setChat(false)}
          messages={messages}
          busy={false}
          onSend={(text) => setMessages((ms) => [...ms, { id: Date.now(), role: "user", content: text }])}
          onStop={() => undefined}
          onRetry={() => undefined}
          onNewChat={() => setMessages([])}
          widthKey={null}
        />
      )}
    </>
  );
}
