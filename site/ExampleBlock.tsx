"use client";

import React, { useState } from "react";
import { SegmentedControl } from "../src/SegmentedControl";
import { CARD } from "../styles/surfaces";
import type { DocExample } from "../examples/registry.generated";
import { CodeBlock } from "./CodeBlock";

/** One example: live preview, or its exact source (the file an agent copies). */
export function ExampleBlock({ example, id }: { example: DocExample; id: string }) {
  const codeOnly = example.preview === "none"; // fills the viewport (AppShell, root layout): shown as code
  const [view, setView] = useState<"preview" | "code">(codeOnly ? "code" : "preview");
  const { Component } = example;
  return (
    <section id={`${id}-${example.file}`} className="space-y-2 scroll-mt-6" data-example={`${id}/${example.file}`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          {/* h2, not h3: a preview may hold a page h1 (PageTitle), and the next example title must not skip a level */}
          <h2 className="text-lead font-semibold text-strong">{example.title}</h2>
          {example.description && <p className="text-ui text-muted max-w-2xl">{example.description}</p>}
        </div>
        {!codeOnly && (
        <SegmentedControl
          label="Chế độ xem ví dụ"
          value={view}
          onChange={setView}
          options={[
            { key: "preview", label: "Xem trước" },
            { key: "code", label: "Code" },
          ]}
        />
        )}
      </div>
      {view === "preview" ? (
        <div data-density-view data-example-preview="" className={`@container ${CARD} p-card sm:p-panel overflow-x-auto ${example.preview === "frame" ? "bg-canvas" : ""}`}>
          <Component />
        </div>
      ) : (
        <CodeBlock code={example.code} />
      )}
    </section>
  );
}
