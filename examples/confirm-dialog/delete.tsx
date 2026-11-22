"use client";

import { Button, confirmDelete, toast } from "@semi/ui";

// An irreversible action: the dialog names the object, the button is red ("Xoá"), Huỷ is the safe default.
// Success is a toast afterwards, never a second dialog.
export default function ConfirmDeleteExample() {
  const remove = async () => {
    if (await confirmDelete({ name: "Máy in xưởng 3", message: "Lịch sử in của máy cũng bị xoá." })) toast.success("Đã xoá máy in");
  };
  return (
    <Button variant="danger" icon="trash" onClick={remove}>
      Xoá máy in
    </Button>
  );
}
