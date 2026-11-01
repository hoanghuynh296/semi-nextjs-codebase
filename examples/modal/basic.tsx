"use client";

import { useState } from "react";
import { Button, Field, Input, Modal } from "@semi/ui";

export default function ModalBasic() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon="sliders" onClick={() => setOpen(true)}>
        Cấu hình in
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Cấu hình in nâng cao"
        description="Áp dụng cho các bản in tiếp theo."
        footer={
          <>
            <Button size="modal" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button size="modal" variant="primary" onClick={() => setOpen(false)}>
              Lưu
            </Button>
          </>
        }
      >
        <Field label="Tốc độ lớp đầu">
          <Input defaultValue="50 mm/s" />
        </Field>
        <Field label="Độ dày lớp">
          <Input defaultValue="0.20 mm" />
        </Field>
      </Modal>
    </>
  );
}
