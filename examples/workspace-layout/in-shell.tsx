"use client";

import { useState } from "react";
import { AppShell, Button, Stepper, WorkspaceHeader, WorkspaceLayout, WorkspaceSection } from "@semi/ui";

const LINES = ["Tiêu đen 500 g/l", "Quế chẻ", "Hồi khô", "Thảo quả", "Gừng sấy"];

// In the app's shell: AppShell (here with the phone tab bar, mobileNav="tabs") renders in layout.tsx, the workspace in
// the page. On a phone the main action stays above the tab bar while the panel is in view.
export default function WorkspaceInShell() {
  const [qty, setQty] = useState(LINES.map(() => 2));
  return (
    <AppShell
      productName="Sales Hub"
      logoIcon="bag"
      mobileNav="tabs"
      mobileTabIds={["inbox", "purchasing", "suppliers"]}
      activeId="purchasing"
      sections={[
        {
          items: [
            { id: "inbox", label: "Hộp thư", icon: "mail", href: "/demo/workspace/" },
            { id: "purchasing", label: "Mua hàng", icon: "bag", href: "/demo/workspace/" },
            { id: "suppliers", label: "Nhà cung cấp", icon: "truck", href: "/demo/workspace/" },
          ],
        },
      ]}
    >
      <WorkspaceLayout
        header={<WorkspaceHeader backHref="/demo/workspace/" backLabel="Về Mua hàng" title="YC-014 Tiêu đen cho Seoul Spice" description="Cần hàng trước 15/12" />}
        panel={
          <WorkspaceSection label="Mặt hàng" count={LINES.length} max={8}>
            {LINES.map((name, i) => (
              <div key={name} className="rounded-card bg-card p-3 flex flex-col gap-2">
                <div className="text-ui font-medium text-strong">{name}</div>
                <Stepper label={`số tấn ${name}`} unit="tấn" min={1} value={qty[i]} onChange={(v) => setQty(qty.map((q, j) => (j === i ? v : q)))} />
              </div>
            ))}
          </WorkspaceSection>
        }
        action={
          <Button variant="primary" icon="send" fullWidth>
            Gửi hỏi giá
          </Button>
        }
        result={<div className="rounded-card bg-card p-card text-ui text-muted min-h-60">Báo giá của nhà cung cấp hiện ở đây khi về.</div>}
      />
    </AppShell>
  );
}
