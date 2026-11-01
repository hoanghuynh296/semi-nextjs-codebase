"use client";

import { useState } from "react";
import { ChatComposer, ChatIntro, ChatList, UserMessage } from "@semi/ui";

export default function ChatMessagesCompose() {
  const [items, setItems] = useState<string[]>([]);
  const [text, setText] = useState("");
  return (
    <div className="flex h-80 max-w-xl flex-col rounded-card border border-line bg-panel">
      <ChatList label="Ghi chú" empty={items.length === 0}>
        {items.length === 0 ? (
          <ChatIntro title="Ghi chú cho đơn in">Viết gì đó rồi Enter.</ChatIntro>
        ) : (
          items.map((t, i) => <UserMessage key={i}>{t}</UserMessage>)
        )}
      </ChatList>
      <div className="p-2">
        <ChatComposer
          value={text}
          onChange={setText}
          onSend={(t) => {
            setItems((v) => [...v, t]);
            setText("");
          }}
          placeholder="Viết ghi chú…"
        />
      </div>
    </div>
  );
}
