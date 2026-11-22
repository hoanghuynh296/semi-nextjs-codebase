"use client";

import { useState } from "react";
import { Button } from "../../../../src/Button";
import { DropZone } from "../../../../src/FileDrop";
import { FeatureIntro } from "../../../../src/FeatureIntro";
import { HintTextarea } from "../../../../src/HintTextarea";
import { IconTile } from "../../../../src/Icon";
import { SkeletonTable } from "../../../../src/Skeleton";
import { Stepper, WorkspaceHeader, WorkspaceLayout, WorkspaceSection } from "../../../../src/WorkspaceLayout";

// The workspace page type and the feature intro as a product mounts them (#106): both must prerender on a dynamic
// route (no storage or window during render), and the intro reads "seen" after mount only.
export function Workspace() {
  const [qty, setQty] = useState(3);
  const [msg, setMsg] = useState("");
  return (
    <>
      <WorkspaceLayout
        header={<WorkspaceHeader backHref="/" backLabel="Back to home" title="Request" headingLevel={2} />}
        panel={
          <>
            <WorkspaceSection label="Lines" count={1} max={8}>
              <Stepper label="tons" unit="t" min={1} value={qty} onChange={setQty} />
            </WorkspaceSection>
            <WorkspaceSection label="Files">
              <DropZone title="Drop specs here" onAdd={() => undefined} />
            </WorkspaceSection>
            <WorkspaceSection label="Message">
              <HintTextarea label="Message" value={msg} onChange={setMsg} triggers={[{ char: "@", hint: "to mention", items: [{ value: "@a", label: "Supplier A" }] }]} />
            </WorkspaceSection>
          </>
        }
        action={
          <Button variant="primary" fullWidth>
            Send ({qty})
          </Button>
        }
        result={<SkeletonTable rows={3} columns={3} label="Loading quotes" />}
      />
      <FeatureIntro
        id="prerender-workspace"
        slides={[
          { title: "One screen per request", body: "Lines on the left, quotes on the right.", visual: <IconTile name="layers" size="lg" tone="gray" /> },
          { title: "Mention with @", body: "Suppliers are suggested as you type.", visual: <IconTile name="sparkles" size="lg" tone="gray" /> },
        ]}
      />
    </>
  );
}
