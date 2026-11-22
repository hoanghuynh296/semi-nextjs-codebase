"use client";

import { useState } from "react";
import { Button, Field, FormActions, Input, Modal } from "@semi/ui";

export default function FormActionsModal() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button icon="edit" onClick={() => setOpen(true)}>
        Đổi tên máy in
      </Button>
      <Modal
        open={open}
        onClose={close}
        title="Đổi tên máy in"
        closeOnBackdrop={false}
        footer={<FormActions placement="modal" onCancel={close} onSubmit={close} />}
      >
        <Field label="Tên máy in" required>
          <Input defaultValue="Bambu X1C" />
        </Field>
      </Modal>
    </>
  );
}
