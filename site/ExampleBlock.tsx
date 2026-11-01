"use client";

import React, { useState } from "react";
import { Pills } from "../src/Pills";
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
          <h3 className="text-title font-semibold text-contrast">{example.title}</h3>
          {example.description && <p className="text-label text-muted max-w-2xl">{example.description}</p>}
        </div>
        {!codeOnly && (
        <Pills
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
        <div className={`@container ${CARD} p-4 sm:p-6 overflow-x-auto ${example.preview === "frame" ? "bg-canvas" : ""}`}>
          <Component />
        </div>
      ) : (
        <CodeBlock code={example.code} />
      )}
    </section>
  );
}
