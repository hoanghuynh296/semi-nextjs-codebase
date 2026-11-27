"use client";

import { useState } from "react";
import { Button, Modal } from "@semi/ui";

const TITLE = "Xoá khoá học “Tiếng Anh giao tiếp cho người mới bắt đầu – lớp buổi tối thứ Ba và thứ Năm” cùng toàn bộ bài tập đã nộp?";

/** A long title wraps (3 lines, then the chevron shows the rest); a long body scrolls with a soft edge where it continues. */
export default function ModalLongContent() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon="trash" onClick={() => setOpen(true)}>
        Xoá khoá học
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="max-w-md"
        title={TITLE}
        footer={
          <>
            <Button size="modal" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button size="modal" variant="danger" onClick={() => setOpen(false)}>
              Xoá
            </Button>
          </>
        }
      >
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i} className="text-ui text-body">
            Bài tập {i + 1}: bài nộp của 24 học viên và nhận xét của giáo viên sẽ bị xoá.
          </p>
        ))}
      </Modal>
    </>
  );
}
