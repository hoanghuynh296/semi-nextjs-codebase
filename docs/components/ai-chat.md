# AI chat

AIChat is the ready-made assistant panel: ChatPanel (side panel or full screen, resizable, keyboard inset) around ChatView (list + composer). UI only: the app keeps the messages, streams the answer and calls the model.

## When to use

- Every AI conversation in a Semi app (assistant beside a workspace, help over a modal).

## Use something else when

| Need | Use |
|---|---|
| A different layout of the same parts | ChatPanel + ChatView + the message parts (Chat messages doc) |

## Import

```tsx
import { AIChat, ChatPanel, ChatView, type ChatItem } from "@semi/ui";
```

## Examples

### Assistant beside a workspace

Type and press Enter: a fake assistant streams an answer; Stop, retry and new chat work.

```tsx
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
```

### Over a modal

placement="screen" opens the assistant as a dialog over everything; Escape closes only the chat.

```tsx
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
```

## API

### AIChat

ChatPanel + ChatView + ChatComposer with the messages drawn the standard way. The app owns `messages` and `busy`;
the composer text is kept here unless `value` / `onValueChange` are passed (to fill it from a suggestion).

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` * | `string` |  |  |
| `icon` | `IconName` |  |  |
| `placement` | `'workspace' \| 'screen'` |  |  |
| `shown` | `boolean` |  |  |
| `onClose` * | `() => void` |  |  |
| `loading` | `boolean` | `false` |  |
| `setup` | `React.ReactNode` |  |  |
| `messages` * | `M[]` |  |  |
| `busy` * | `boolean` |  |  |
| `onSend` * | `(text: string) => void` |  |  |
| `onStop` | `() => void` |  |  |
| `onRetry` | `(m: M) => void` |  | Retry for a failed answer (gets that message). |
| `onNewChat` | `() => void` |  | Clears the conversation; the button shows once there is a message. |
| `placeholder` | `string` |  |  |
| `empty` | `React.ReactNode` |  | Shown while there is no message (ChatIntro, ChatSuggestions). |
| `listEnd` | `React.ReactNode` |  | Under the last message (follow-up choices, a note). |
| `toolbar` | `React.ReactNode` |  | Under the field (model picker, attachments). |
| `actions` | `React.ReactNode` |  |  |
| `renderUser` | `(m: M) => ReactNode` |  |  |
| `renderAnswer` | `(m: M) => ReactNode` |  |  |
| `composer` | `boolean` | `true` | false hides the composer (read-only conversation). |
| `value` | `string` |  |  |
| `onValueChange` | `(text: string) => void` |  |  |
| `widthKey` | `null \| string` |  |  |

### ChatPanel

The side panel an AI conversation opens in. `placement="workspace"`: inside the nearest positioned parent, beside
the content (a tool's canvas, the page). `"screen"`: over the whole page as a dialog, also above an open Modal.
Phones always get the full screen. Resizable from `sm` (remembered per `widthKey`); Escape and × close it.
Keep it mounted with `shown={false}` while it slides out, then unmount.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` * | `string` |  |  |
| `icon` | `IconName` | `"sparkles"` |  |
| `placement` | `'workspace' \| 'screen'` | `"workspace"` |  |
| `shown` | `boolean` | `true` | false while the panel animates out. |
| `onClose` * | `() => void` |  |  |
| `onNewChat` | `() => void` |  | Shows the "new chat" button (pass it only once there is a conversation). |
| `newChatDisabled` | `boolean` | `false` |  |
| `actions` | `React.ReactNode` |  | Extra header buttons, before "new chat" and close. |
| `resizable` | `boolean` | `true` |  |
| `defaultWidth` | `number` | `CHAT_PANEL_WIDTH` |  |
| `widthKey` | `null \| string` | `"semi-chat-panel-width"` | localStorage key of the width; null = do not remember. |
| `children` * | `React.ReactNode` |  | Usually a ChatView. |

### ChatView

Loading skeleton, `setup` (e.g. "AI is not set up" + a settings button) in place of the chat, or the list above the composer.

| Prop | Type | Default | Description |
|---|---|---|---|
| `loading` | `boolean` | `false` |  |
| `setup` | `React.ReactNode` |  |  |
| `busy` | `boolean` |  |  |
| `announcement` | `string` |  |  |
| `label` | `string` |  |  |
| `empty` | `boolean` |  | Only the intro is showing (see ChatList). |
| `composer` | `React.ReactNode` |  |  |
| `children` * | `React.ReactNode` |  |  |

## Accessibility

- The list announces one message per finished answer; Enter sends, Shift+Enter breaks the line, IME composition is safe; placement="screen" is a dialog where Escape closes only the chat.

## Notes

- The model picker goes in toolbar (ChatModelPicker); provider and model lists are app data.

<!-- GENERATED by scripts/build-docs.mjs from examples/ai-chat/ and the types in src/ -->
