"use client";

import React, { useState } from "react";
import { Button } from "../../../../../src/Button";
import { useDetailParam } from "../../../../../src/DetailOverlay";
import { Item } from "../../../../../src/Item";
import { ListReaderLayout, ReaderHeader } from "../../../../../src/ListReader";
import { Page, SubNav, type SubNavSection } from "../../../../../src/Page";

type Mail = { id: string; subject: string; from: string; time: string; paragraphs: string[] };
const MAILS: Mail[] = Array.from({ length: 24 }, (_, i) => ({
  id: `m-${i + 1}`,
  subject:
    i === 0
      ? "Báo giá hạt tiêu đen hữu cơ quý 4 và lịch giao container chi tiết tại cảng Cát Lái"
      : `Thư trao đổi #${i + 1} — xác nhận đơn hàng`,
  from: ["Gia vị Tây Nguyên", "HTX Chư Sê", "Hương Quế Yên Bái"][i % 3],
  time: `${8 + (i % 10)}:30`,
  paragraphs: Array.from(
    { length: 20 },
    (_, p) => `Đoạn ${p + 1}: Nội dung chi tiết của thư #${i + 1} với bảng kê quy cách và thời gian giao hàng dự kiến.`,
  ),
}));

export default function ReaderLayoutPage() {
  const detail = useDetailParam("open");
  const [folder, setFolder] = useState("inbox");
  const [actionLog, setActionLog] = useState("");
  const active = MAILS.find((m) => m.id === detail.openId) ?? null;

  const sections: SubNavSection[] = [
    {
      label: "Thư mục",
      items: [
        { id: "inbox", label: "Hộp thư đến", icon: "inbox", meta: MAILS.length },
        { id: "sent", label: "Đã gửi", icon: "send" },
      ],
    },
  ];

  return (
    <Page
      layout="two-column"
      fixed
      subNav={<SubNav sections={sections} activeId={folder} onSelect={setFolder} label="Thư mục" />}
      title="Hộp thư"
      actions={<Button variant="inverse" icon="plus" onClick={() => setActionLog("compose")}>Soạn thư</Button>}
    >
      {actionLog && <span data-testid="reader-action-log" className="sr-only">{actionLog}</span>}
      <ListReaderLayout
        open={active !== null}
        openKey={active?.id}
        recordTitle={active?.subject}
        onClose={detail.close}
        listLabel="Danh sách thư"
        readerLabel="Nội dung thư"
        list={MAILS.map((m) => (
          <Item
            key={m.id}
            title={m.subject}
            description={m.from}
            meta={m.time}
            selected={active?.id === m.id}
            onClick={() => detail.open(m.id)}
          />
        ))}
        reader={
          active && (
            <>
              <ReaderHeader
                title={active.subject}
                meta={`${active.from} · ${active.time}`}
                moreActions={[
                  { label: "Chuyển tiếp", icon: "send", onSelect: () => setActionLog(`forward:${active.id}`) },
                  { label: "Lưu trữ", icon: "folder", onSelect: () => setActionLog(`archive:${active.id}`) },
                ]}
                action={{
                  label: "Trả lời",
                  icon: "send",
                  onClick: () => setActionLog(`reply:${active.id}`),
                }}
              />
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                {active.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-ui text-body">
                    {p}
                  </p>
                ))}
              </div>
            </>
          )
        }
      />
    </Page>
  );
}
