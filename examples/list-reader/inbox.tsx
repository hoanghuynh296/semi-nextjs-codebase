"use client";

import { useState } from "react";
import { Item, ListReaderLayout, ReaderHeader, toast, useDetailParam } from "@semi/ui";

type Thread = { id: string; subject: string; from: string; time: string; preview: string; paragraphs: string[] };

const THREADS: Thread[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m-${i + 1}`,
  subject:
    i === 0
      ? "Báo giá hạt tiêu đen hữu cơ xuất khẩu quý 4 và lịch giao container tại cảng Cát Lái"
      : `Trao đổi đơn hàng #${1040 + i} — xác nhận quy cách đóng gói`,
  from: ["Gia vị Tây Nguyên", "HTX Chư Sê", "Hương Quế Yên Bái", "Nông sản Đắk Lắk"][i % 4],
  time: `${9 + (i % 9)}:${String((i * 13) % 60).padStart(2, "0")}`,
  preview: "Gửi anh chị bảng giá cập nhật theo lô 10 tấn và chứng từ kiểm định mới nhất.",
  paragraphs: Array.from(
    { length: 8 },
    (_, p) =>
      `Đoạn ${p + 1}: Chúng tôi đã kiểm tra tồn kho và lịch tàu dự kiến trong tuần tới. Vui lòng xác nhận số lượng cuối cùng trước 15:00 để bộ phận kho giữ hàng và chuẩn bị hồ sơ xuất xưởng.`,
  ),
}));

export default function ListReaderInboxExample() {
  const detail = useDetailParam("mail");
  const [fallbackId, setFallbackId] = useState<string | null>(THREADS[0].id);
  const openId = detail.openId ?? fallbackId;
  const active = THREADS.find((t) => t.id === openId) ?? null;

  return (
    <div className="h-[440px] flex flex-col min-h-0">
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
            description={`${item.from} · ${item.preview}`}
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
                  { label: "Chuyển tiếp", icon: "send", onSelect: () => toast({ title: "Chuyển tiếp thư" }) },
                  { label: "Lưu trữ", icon: "folder", onSelect: () => toast({ title: "Đã lưu trữ" }) },
                  { label: "Xoá thư", icon: "trash", danger: true, onSelect: () => toast({ title: "Đã xoá", tone: "danger" }) },
                ]}
                action={{
                  label: "Trả lời",
                  icon: "send",
                  onClick: () => toast({ title: `Trả lời ${active.from}` }),
                }}
              />
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                {active.paragraphs.map((text, idx) => (
                  <p key={idx} className="text-ui text-body">
                    {text}
                  </p>
                ))}
              </div>
            </>
          )
        }
      />
    </div>
  );
}
