"use client";

import { useState } from "react";
import { ActionConfirmation, AssistantMessage, ChatComposer, ContextMeter, Reasoning, Sources, TaskList, ToolCall, UserMessage } from "@semi/ui";

export default function AgentRunTurn() {
  const [ok, setOk] = useState<"pending" | "approved" | "rejected">("pending");
  const [draft, setDraft] = useState("");
  return (
    <div className="flex h-[640px] flex-col bg-panel">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 p-4">
        <UserMessage>Xếp lịch in 20 giá đỡ PETG cho đơn #1042 và báo khách.</UserMessage>
        <Reasoning duration={3}>Cần một máy in rảnh có PETG, ước lượng thời gian rồi gửi email cho khách.</Reasoning>
        <TaskList
          title="Kế hoạch"
          steps={[
            { label: "Tìm máy in rảnh", status: "done" },
            { label: "Ước lượng thời gian in", status: "done" },
            { label: "Gửi email cho khách", status: ok === "approved" ? "done" : ok === "rejected" ? "skipped" : "running" },
          ]}
        />
        <ToolCall name="search_printers" title="Tìm máy in rảnh" icon="search" status="done" input={{ material: "PETG" }} output={[{ id: "x1c-03", queue: 0 }]} />
        <ToolCall name="estimate" title="Ước lượng thời gian" icon="clock" status="done" output="20 bản · 6 giờ 40 phút" />
        <ToolCall name="send_email" title="Gửi email cho khách" icon="send" status={ok === "pending" ? "awaiting" : ok === "approved" ? "done" : "error"} error="Bạn đã từ chối." defaultOpen>
          <ActionConfirmation title="Gửi email cho an@example.com?" icon="send" state={ok} onApprove={() => setOk("approved")} onReject={() => setOk("rejected")}>
            “Đơn #1042 sẽ in xong lúc 17:40 hôm nay.”
          </ActionConfirmation>
        </ToolCall>
        {ok !== "pending" && (
          <AssistantMessage actions={<Sources sources={[{ title: "Lịch máy in", href: "https://example.com/schedule" }]} />}>
            Đã xếp đơn #1042 vào X1 Carbon 03, xong lúc 17:40{ok === "approved" ? " và đã báo khách." : ". Chưa gửi email cho khách."}
          </AssistantMessage>
        )}
      </div>
      <ChatComposer value={draft} onChange={setDraft} onSend={() => setDraft("")} toolbar={<ContextMeter used={48_200} total={200_000} />} />
    </div>
  );
}
