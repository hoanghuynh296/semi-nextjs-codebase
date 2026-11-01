"use client";

import { useState } from "react";
import { Switch } from "@semi/ui";

export default function SwitchBasic() {
  const [notify, setNotify] = useState(true);
  const [quiet, setQuiet] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Switch checked={notify} onChange={setNotify} label="Thông báo khi in xong" description="Gửi qua ứng dụng và email." />
      <Switch checked={quiet} onChange={setQuiet} size="sm" label="Chế độ im lặng" />
    </div>
  );
}
