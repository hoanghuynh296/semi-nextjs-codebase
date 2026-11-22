"use client";

import { Button, confirmDialog, Field, FormActions, Input, toast, useUnsavedGuard } from "@semi/ui";
import { useState } from "react";

export default function FormActionsDestructive() {
  const [name, setName] = useState("Bambu X1C");
  const [saved, setSaved] = useState("Bambu X1C");
  const { confirmLeave } = useUnsavedGuard(name !== saved);

  const remove = async () => {
    if (await confirmDialog({ title: "Xoá máy in này?", message: "Lịch sử in của máy cũng bị xoá.", confirmLabel: "Xoá", tone: "danger" })) toast({ title: "Đã xoá máy in", tone: "success" });
  };

  return (
    <form
      data-form="destructive"
      className="w-full max-w-2xl flex flex-col gap-stack"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(name);
      }}
    >
      <Field label="Tên máy in" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <FormActions
        onCancel={() => confirmLeave(() => setName(saved))}
        destructive={
          <Button variant="danger" icon="trash" onClick={remove}>
            Xoá máy in
          </Button>
        }
      />
    </form>
  );
}
