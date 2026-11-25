"use client";

import { useState } from "react";
import { Button, CustomSelect, Drawer, Field, HintTextarea, Input, Modal, Textarea, type HintToken } from "@semi/ui";

const SNIPPETS: HintToken[] = [
  { value: "/vat", insert: "Giá chưa gồm VAT 8%.", label: "Giá chưa gồm VAT", hint: "Điều khoản thuế" },
  { value: "/mau", insert: "Xin nhận 1 kg mẫu kiểm tra.", label: "Xin mẫu kiểm tra", hint: "Mẫu 1 kg" },
  { value: "/giao", insert: "Giao tại kho Bình Dương.", label: "Địa chỉ kho", hint: "Kho nhận hàng" },
];

export default function T6FormsFixture() {
  const [hintOpen, setHintOpen] = useState(false);
  const [hintVal, setHintVal] = useState("");
  const [noAutoModal, setNoAutoModal] = useState(false);
  const [noAutoDrawer, setNoAutoDrawer] = useState(false);
  const [alreadyFocusedModal, setAlreadyFocusedModal] = useState(false);
  const [disabledSelectModal, setDisabledSelectModal] = useState(false);
  const [replyVal, setReplyVal] = useState("Dòng 1\nDòng 2\nDòng 3");

  return (
    <main className="p-6 space-y-6 max-w-2xl mx-auto">
      <style>{`
        .fixed { position: fixed; }
        .inset-0 { inset: 0; }
        .flex { display: flex; }
        .items-end { align-items: flex-end; }
        .justify-center { justify-content: center; }
        .overflow-y-auto { overflow-y: auto; }
        .max-h-60 { max-height: 15rem; }
      `}</style>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setHintOpen(true)}>Mở modal gợi ý</Button>
        <Button onClick={() => setNoAutoModal(true)}>Mở modal tắt autofocus</Button>
        <Button onClick={() => setNoAutoDrawer(true)}>Mở drawer tắt autofocus</Button>
        <Button onClick={() => setAlreadyFocusedModal(true)}>Mở modal đã focus sẵn</Button>
        <Button onClick={() => setDisabledSelectModal(true)}>Mở modal bỏ qua combobox disabled</Button>
      </div>

      <Modal open={hintOpen} onClose={() => setHintOpen(false)} title="Gửi báo giá">
        <div style={{ height: "65vh" }} aria-hidden />
        <HintTextarea
          label="Lời nhắn trong modal"
          placeholder="Gõ / để mở gợi ý…"
          value={hintVal}
          onChange={setHintVal}
          triggers={[{ char: "/", hint: "chèn nhanh", items: SNIPPETS }]}
        />
      </Modal>

      <Modal open={noAutoModal} onClose={() => setNoAutoModal(false)} title="Modal tắt autofocus" autoFocusFirstField={false}>
        <Field label="Trường một">
          <Input defaultValue="Một" />
        </Field>
      </Modal>

      <Drawer open={noAutoDrawer} onClose={() => setNoAutoDrawer(false)} title="Drawer tắt autofocus" autoFocusFirstField={false}>
        <Field label="Trường drawer">
          <Input defaultValue="Hai" />
        </Field>
      </Drawer>

      <Modal open={alreadyFocusedModal} onClose={() => setAlreadyFocusedModal(false)} title="Modal đã focus sẵn">
        <Field label="Trường đầu">
          <Input defaultValue="Đầu" />
        </Field>
        <Field label="Trường thứ hai">
          <Input autoFocus defaultValue="Thứ hai" />
        </Field>
      </Modal>

      <Modal open={disabledSelectModal} onClose={() => setDisabledSelectModal(false)} title="Modal bỏ qua combobox disabled">
        <Field label="Trạng thái khoá">
          <CustomSelect
            disabled
            value="a"
            onChange={() => {}}
            options={[
              { value: "a", label: "Mặc định" },
              { value: "b", label: "Khác" },
            ]}
          />
        </Field>
        <Field label="Ô tiếp theo">
          <Input defaultValue="Sẵn sàng" />
        </Field>
      </Modal>

      <div className="h-72 flex flex-col justify-end rounded-card border border-line bg-panel p-card" data-testid="reply-box-fixture">
        <Field label="Ô kéo đổi chiều cao">
          <Textarea value={replyVal} onChange={(e) => setReplyVal(e.target.value)} autoGrow resizable />
        </Field>
      </div>
    </main>
  );
}
