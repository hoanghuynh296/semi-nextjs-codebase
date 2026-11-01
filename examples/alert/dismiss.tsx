"use client";

import { useState } from "react";
import { Alert, Button } from "@semi/ui";

export default function AlertDismiss() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Alert tone="warning" title="Mất kết nối camera" onDismiss={() => setOpen(false)}>
      Ảnh sẽ cập nhật lại khi máy online.
    </Alert>
  ) : (
    <Button size="sm" onClick={() => setOpen(true)}>
      Hiện lại
    </Button>
  );
}
