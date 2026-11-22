import { useState } from "react";
import { Button, Stepper, WorkspaceLayout, WorkspaceSection } from "@semi/ui";

export default function WorkspaceMinimal() {
  const [copies, setCopies] = useState(2);
  return (
    <WorkspaceLayout
      panel={
        <WorkspaceSection label="Số bản" count={copies} max={10}>
          <Stepper label="số bản in" value={copies} min={1} max={10} onChange={setCopies} />
        </WorkspaceSection>
      }
      action={
        <Button variant="primary" icon="printer" fullWidth>
          In {copies} bản
        </Button>
      }
      result={<div className="rounded-card bg-card p-card text-ui text-muted min-h-40">Bản xem trước của nhãn hiện ở đây.</div>}
    />
  );
}
