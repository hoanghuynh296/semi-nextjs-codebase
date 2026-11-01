"use client";

import { useState } from "react";
import { Button, Spinner } from "@semi/ui";

export default function ButtonLoading() {
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1200);
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" icon="check" loading={saving} onClick={save}>
        {saving ? "Đang lưu" : "Lưu"}
      </Button>
      <Spinner label="Đang đồng bộ" />
    </div>
  );
}
