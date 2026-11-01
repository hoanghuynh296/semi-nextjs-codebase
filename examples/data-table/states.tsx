"use client";

import { useState } from "react";
import { Button, DataTable } from "@semi/ui";

export default function DataTableStates() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setLoading((v) => !v)}>
        {loading ? "Xem trạng thái rỗng" : "Xem đang tải"}
      </Button>
      <DataTable
        label="Máy in"
        rows={[] as { id: string; name: string }[]}
        columns={[{ key: "name", header: "Tên máy" }]}
        getRowId={(r) => r.id}
        loading={loading}
        pageSize={4}
      />
    </div>
  );
}
