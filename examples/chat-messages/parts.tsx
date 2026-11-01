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
