# Chat messages

The parts of a conversation, to compose your own chat: UserMessage, AssistantMessage (+ ChatAnswer for a ChatItem), ChatThinking, ChatError, ChatCopyButton, ChatAvatar, ChatIntro, ChatSuggestion(s), ChatList and ChatComposer.

## When to use

- A chat that does not fit AIChat's layout; AI output inside another feature.

## Use something else when

| Need | Use |
|---|---|
| A standard assistant panel | AIChat |

## Import

```tsx
import { UserMessage, AssistantMessage, ChatAnswer, ChatAvatar, ChatCopyButton, ChatError, ChatThinking, ChatIntro, ChatSuggestion, ChatSuggestions, ChatList, ChatComposer, CHAT_CHIP, CHAT_ROW } from "@semi/ui";
```

## Examples

### Messages

```tsx
import { AssistantMessage, ChatCopyButton, ChatError, ChatThinking, Markdown, UserMessage } from "@semi/ui";

const ANSWER = "Giảm quạt xuống **30%** và bật `Z-hop` khi di chuyển.";

export default function ChatMessagesParts() {
  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <UserMessage>Vì sao bản in PETG bị kéo sợi?</UserMessage>
      <AssistantMessage actions={<ChatCopyButton text={ANSWER} />}>
        <Markdown text={ANSWER} />
      </AssistantMessage>
      <AssistantMessage busy>
        <ChatThinking label="Đang đọc cài đặt máy in" />
      </AssistantMessage>
      <ChatError onRetry={() => undefined}>Không kết nối được tới model.</ChatError>
      <ChatError tone="warning">Câu trả lời bị cắt vì quá dài.</ChatError>
    </div>
  );
}
```

### Your own chat from parts

```tsx
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
```

## API

### UserMessage

The user's message, right-aligned. `failed`: its answer failed (shown dimmed, not sent again).

| Prop | Type | Default | Description |
|---|---|---|---|
| `failed` | `boolean` | `false` |  |
| `children` * | `React.ReactNode` |  |  |

### AssistantMessage

An AI answer, left-aligned behind the avatar. `actions` (copy, feedback) show under it once it is done.

| Prop | Type | Default | Description |
|---|---|---|---|
| `busy` | `boolean` | `false` |  |
| `actions` | `React.ReactNode` |  |  |
| `children` * | `React.ReactNode` |  |  |

### ChatAnswer

An answer as most chats show it: the error (with retry), the Markdown text with copy, or "thinking" while empty.

| Prop | Type | Default | Description |
|---|---|---|---|
| `msg` * | `ChatItem` |  |  |
| `onRetry` | `() => void` |  |  |
| `copyable` | `boolean` | `true` |  |

### ChatAvatar

Small sparkles tile in front of every AI answer (pulses while it streams).

| Prop | Type | Default | Description |
|---|---|---|---|
| `busy` | `boolean` | `false` |  |
| `icon` | `IconName` | `"sparkles"` |  |

### ChatCopyButton

Copies `text` (an answer, a code block); shows a check for a moment.

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` * | `string` |  |  |

### ChatError

A failed answer (or an AI note in a warning tone), with an optional retry.

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `'danger' \| 'warning'` | `"danger"` |  |
| `onRetry` | `() => void` |  |  |
| `children` * | `React.ReactNode` |  |  |

### ChatThinking

"Đang suy nghĩ" (or what the AI is doing) with three bouncing dots, while no text has come yet.

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` |  |  |

### ChatIntro

Icon, title and one line above an empty conversation.

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `IconName` | `"sparkles"` |  |
| `title` * | `React.ReactNode` |  |  |
| `children` | `React.ReactNode` |  |  |

### ChatSuggestion

One suggested request (a button), or with `href` a link to another site (opens outside the app).

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `IconName` | `"sparkles"` |  |
| `disabled` | `boolean` |  |  |
| `onClick` | `() => void` |  |  |
| `href` | `string` |  |  |
| `children` * | `React.ReactNode` |  |  |

### ChatSuggestions

A column of ChatSuggestion rows, with an optional small heading.

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `React.ReactNode` |  |  |
| `children` * | `React.ReactNode` |  |  |

### ChatList

The scrolling message list (role="log"). Follows new text only while the reader is at the bottom: scrolled up to
read, it stays put and offers "jump to latest". Streamed tokens are not read out one by one; when `busy` ends the
finished answer (`announcement`, else "answer complete") is announced once. `empty` (only the intro / suggestions
showing) keeps it at the top so the intro is read from its start.

| Prop | Type | Default | Description |
|---|---|---|---|
| `busy` | `boolean` | `false` |  |
| `announcement` | `string` |  |  |
| `empty` | `boolean` | `false` |  |
| `label` | `string` |  | Accessible name of the log (the panel title). |
| `children` * | `React.ReactNode` |  |  |

### ChatComposer

The question field with send / stop, and an optional `toolbar` under it (model picker, attachments). Controlled:
the caller keeps the text (so it can fill it, e.g. from a suggestion). Enter sends, Shift+Enter breaks the line, and
Enter while an input method is composing (Vietnamese Telex / VNI, CJK) only confirms the word. Focus returns to the
field once the answer to a typed question is done (not after one the app started itself: that would pop up the
keyboard on a tablet).

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` * | `string` |  |  |
| `onChange` * | `(text: string) => void` |  |  |
| `onSend` * | `(text: string) => void` |  | Gets the trimmed text; the field is not cleared here. |
| `busy` | `boolean` | `false` |  |
| `onStop` | `() => void` |  | Shown as a Stop button while `busy`. |
| `placeholder` | `string` |  |  |
| `ariaLabel` | `string` |  |  |
| `disabled` | `boolean` | `false` |  |
| `maxLength` | `number` | `4000` |  |
| `rows` | `number` | `1` |  |
| `inputRef` | `RefObject<HTMLTextAreaElement \| null>` |  |  |
| `toolbar` | `React.ReactNode` |  |  |

## Accessibility

- ChatList keeps scroll position while the user reads up and offers “jump to latest”; ChatComposer is a labelled textarea with send / stop buttons.

<!-- GENERATED by scripts/build-docs.mjs from examples/chat-messages/ and the types in src/ -->
