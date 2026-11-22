"use client";

import { Button, confirmDelete, Field, FormActions, Input, toast, useUnsavedGuard } from "@semi/ui";
import { useState } from "react";

export default function FormActionsDestructive() {
  const [name, setName] = useState("Bambu X1C");
  const [saved, setSaved] = useState("Bambu X1C");
  const { confirmLeave } = useUnsavedGuard(name !== saved);

  const remove = async () => {
    if (await confirmDelete({ name: saved, message: "Lịch sử in của máy cũng bị xoá." })) toast.success("Đã xoá máy in");
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
          <Button variant="danger" icon="trash" onClick={() => confirmLeave(remove)}>
            Xoá máy in
          </Button>
        }
      />
    </form>
  );
}
