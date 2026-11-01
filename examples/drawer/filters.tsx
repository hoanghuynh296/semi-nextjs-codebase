"use client";

import { useState } from "react";
import { Button, Checkbox, Drawer, Field, Input } from "@semi/ui";

export default function DrawerFilters() {
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  return (
    <>
      <Button icon="filter" onClick={() => setOpen(true)}>
        Bộ lọc
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Bộ lọc"
        footer={
          <>
            <Button size="modal" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button size="modal" variant="primary" onClick={() => setOpen(false)}>
              Áp dụng
            </Button>
          </>
        }
      >
        <Field label="Từ khoá">
          <Input placeholder="Tên, mã đơn…" icon="search" />
        </Field>
        <Checkbox checked={online} onChange={setOnline} label="Chỉ máy đang online" />
      </Drawer>
    </>
  );
}
