"use client";

import { useState } from "react";
import { AppShell, Button, Item, ListReaderLayout, Page, ReaderHeader, SubNav, toast, useDetailParam, type SubNavSection } from "@semi/ui";

type Thread = { id: string; subject: string; from: string; time: string; paragraphs: string[] };

const THREADS: Thread[] = Array.from({ length: 24 }, (_, i) => ({
  id: `m-${i + 1}`,
  subject:
    i === 0
      ? "Báo giá hạt tiêu đen hữu cơ xuất khẩu quý 4, lịch giao container tại cảng Cát Lái và điều kiện thanh toán L/C trả ngay cho lô hàng đầu tiên"
      : `Trao đổi đơn hàng #${1040 + i} — xác nhận quy cách đóng gói`,
  from: ["Gia vị Tây Nguyên", "HTX Chư Sê", "Hương Quế Yên Bái", "Nông sản Đắk Lắk"][i % 4],
  time: `${9 + (i % 9)}:${String((i * 13) % 60).padStart(2, "0")}`,
  paragraphs: Array.from(
    { length: 18 },
    (_, p) =>
      `Đoạn ${p + 1}: Chúng tôi đã kiểm tra tồn kho và lịch tàu dự kiến trong tuần tới. Vui lòng xác nhận số lượng cuối cùng trước 15:00 để bộ phận kho giữ hàng và chuẩn bị hồ sơ xuất xưởng.`,
  ),
}));

/** Full-height ListReaderLayout inside AppShell page="fixed" + Page layout="two-column" fixed (zero calc()). */
export default function ListReaderInShell() {
  const detail = useDetailParam("open");
  const [folder, setFolder] = useState("inbox");
  const [fallbackId, setFallbackId] = useState<string | null>(THREADS[0].id);
  const openId = detail.openId ?? fallbackId;
  const active = THREADS.find((t) => t.id === openId) ?? null;

  const sections: SubNavSection[] = [
    {
      label: "Thư mục",
      items: [
        { id: "inbox", label: "Hộp thư đến", icon: "inbox", meta: THREADS.length },
        { id: "sent", label: "Đã gửi", icon: "send" },
        { id: "archive", label: "Lưu trữ", icon: "folder" },
      ],
    },
  ];

  return (
    <AppShell
      page="fixed"
      productName="Sales Hub"
      logoIcon="mail"
      activeId="inbox"
      sections={[
        {
          items: [
            { id: "inbox", label: "Hộp thư", icon: "mail", href: "/demo/list-reader/" },
            { id: "orders", label: "Đơn hàng", icon: "bag", href: "/demo/list-reader/" },
          ],
        },
      ]}
      header={{ account: { name: "Hoàng Huỳnh", detail: "Quản trị" } }}
    >
      <Page
        layout="two-column"
        fixed
        subNav={<SubNav sections={sections} activeId={folder} onSelect={setFolder} label="Thư mục hộp thư" />}
        title="Hộp thư"
        actions={
          <Button variant="inverse" icon="plus" onClick={() => toast.info("Soạn thư mới")}>
            Soạn thư
          </Button>
        }
      >
        <ListReaderLayout
          open={active !== null}
          openKey={active?.id}
          recordTitle={active?.subject}
          onClose={() => {
            setFallbackId(null);
            if (detail.openId) detail.close();
          }}
          listLabel="Danh sách thư"
          readerLabel="Nội dung thư"
          list={THREADS.map((item) => (
            <Item
              key={item.id}
              title={item.subject}
              description={item.from}
              meta={item.time}
              selected={active?.id === item.id}
              onClick={() => {
                setFallbackId(item.id);
                detail.open(item.id);
              }}
            />
          ))}
          reader={
            active && (
              <>
                <ReaderHeader
                  title={active.subject}
                  meta={`${active.from} · ${active.time}`}
                  moreActions={[
                    { label: "Chuyển tiếp", icon: "send", onSelect: () => toast.info("Chuyển tiếp") },
                    { label: "Lưu trữ", icon: "folder", onSelect: () => toast.info("Đã lưu trữ") },
                  ]}
                  action={{ label: "Trả lời", icon: "send", onClick: () => toast.success("Mở khung trả lời") }}
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
    </AppShell>
  );
}
