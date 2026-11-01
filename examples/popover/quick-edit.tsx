"use client";

import { useState } from "react";
import { Button, Field, Input, Popover } from "@semi/ui";

export default function PopoverQuickEdit() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("X1 Carbon 03");
  const [draft, setDraft] = useState(name);
  return (
    <div className="flex items-center gap-3">
      <span className="text-ui font-medium text-contrast">{name}</span>
      <Popover
        label="Đổi tên máy in"
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setDraft(name);
        }}
        trigger={<Button size="sm" icon="edit">Đổi tên</Button>}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setName(draft);
            setOpen(false);
          }}
        >
          <Field label="Tên máy in">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Lưu
            </Button>
          </div>
        </form>
      </Popover>
    </div>
  );
}
