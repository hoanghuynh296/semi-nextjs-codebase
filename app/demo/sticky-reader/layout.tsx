"use client";

import React, { useMemo, useState } from "react";
import {
  AppShell,
  BarActions,
  Button,
  Item,
  ListReaderLayout,
  Page,
  ReaderHeader,
  SearchPill,
  StickyContextBar,
  SubNav,
  useDetailParam,
  type BarAction,
  type SubNavSection,
} from "../../../src";

type Mail = { id: string; subject: string; from: string; time: string; paragraphs: string[] };
const MAILS: Mail[] = Array.from({ length: 30 }, (_, i) => ({
  id: `m-${i + 1}`,
  subject: `Thư trao đổi #${i + 1} — báo giá và lịch giao hàng`,
  from: ["Gia vị Tây Nguyên", "HTX Chư Sê", "Hương Quế Yên Bái"][i % 3],
  time: `${8 + (i % 10)}:30`,
  paragraphs: Array.from(
    { length: 24 },
    (_, p) => `Đoạn ${p + 1}: Nội dung chi tiết của thư #${i + 1} với bảng kê quy cách và thời gian giao hàng dự kiến.`,
  ),
}));

export default function StickyReaderDemoLayout({ children }: { children: React.ReactNode }) {
  const detail = useDetailParam("open");
  const [folder, setFolder] = useState("inbox");
  const [q, setQ] = useState("");
  const [actionLog, setActionLog] = useState("");
  const filtered = useMemo(
    () => (q ? MAILS.filter((m) => `${m.subject} ${m.from}`.toLowerCase().includes(q.toLowerCase())) : MAILS),
    [q],
  );
  // the first mail shows until the reader is closed with Back (an app's own onBack, #188)
  const [fallback, setFallback] = useState(true);
  const active = filtered.find((m) => m.id === detail.openId) ?? (fallback ? (filtered[0] ?? null) : null);

  const sections: SubNavSection[] = [
    {
      label: "Thư mục",
      items: [
        { id: "inbox", label: "Hộp thư đến", icon: "inbox", meta: MAILS.length },
        { id: "sent", label: "Đã gửi", icon: "send" },
      ],
    },
    // a link item: in the SubNav sheet (narrow widths, #196) it navigates and closes the sheet
    { label: "Liên kết", items: [{ id: "list-demo", label: "Hộp thư mẫu", icon: "mail", href: "/demo/list-reader/" }] },
  ];

  const barActions: BarAction[] = [
    { key: "refresh", label: "Làm mới", icon: "refresh", onSelect: () => setActionLog("refresh") },
    { key: "compose", label: "Soạn thư", icon: "plus", primary: true, onSelect: () => setActionLog("compose") },
  ];

  return (
    <AppShell
      flush
      page="scroll"
      productName="Semi Sticky"
      sections={[
        {
          label: "Workspace",
          items: [
            { id: "list", label: "Đơn hàng", icon: "bag", href: "/demo/sticky-list" },
            { id: "reader", label: "Hộp thư", icon: "inbox", href: "/demo/sticky-reader" },
          ],
        },
      ]}
      activeId="reader"
      header={{ account: { name: "Hoang Huynh", detail: "Owner" } }}
    >
      <Page
        layout="two-column"
        subNav={<SubNav sections={sections} activeId={folder} onSelect={setFolder} label="Thư mục" />}
        title="Hộp thư"
        actions={
          <Button variant="inverse" icon="plus" onClick={() => setActionLog("compose")}>
            Soạn thư
          </Button>
        }
        toolbar={
          <StickyContextBar label="Tìm thư">
            <SearchPill
              value={q}
              onChange={setQ}
              label="Tìm thư"
              focusKey="/"
              debounce={0}
              trailing={<BarActions actions={barActions} />}
            />
          </StickyContextBar>
        }
      >
        <output data-testid="reader-action-log" className="sr-only">
          {actionLog}
        </output>
        <ListReaderLayout
          open={active !== null}
          openKey={active?.id}
          recordTitle={active?.subject}
          onClose={detail.close}
          listLabel="Danh sách thư"
          readerLabel="Nội dung thư"
          list={filtered.map((m) => (
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
                  onBack={() => {
                    setFallback(false);
                    if (detail.openId) detail.close();
                  }}
                  title={active.subject}
                  meta={`${active.from} · ${active.time}`}
                  moreActions={[{ label: "Lưu trữ", icon: "folder", onSelect: () => setActionLog(`archive:${active.id}`) }]}
                  action={{ label: "Trả lời", icon: "send", onClick: () => setActionLog(`reply:${active.id}`) }}
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
      {children}
    </AppShell>
  );
}
