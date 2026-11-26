"use client";

import React, { useState } from "react";
import { Icon } from "../src/Icon";
import { RecordCrumbContext } from "../src/RouteHeader";
import { SegmentedControl } from "../src/SegmentedControl";
import { CARD } from "../styles/surfaces";
import { cn, FOCUS_RING } from "../styles/utils";
import type { DocExample } from "../examples/registry.generated";
import { CodeBlock } from "./CodeBlock";

/**
 * The crumb store an example preview sees: a no-op, so a preview (ListReaderLayout `recordTitle`, `useRecordCrumb`)
 * never adds a crumb to, or retitles, the route header of the docs page around it (#206). An example that renders its
 * own AppShell still gets that shell's store.
 */
const NO_CRUMB = { label: null, set: () => undefined };

/** Height of the live frame of a full-screen example (`preview: "none"`). */
const FRAME_HEIGHT = "h-[560px]";

/**
 * One example: live preview, or its exact source (the file an agent copies). An example that fills the viewport
 * (`preview: "none"`: AppShell, a root layout, a route file) is previewed in an iframe of `frameHref`, a full-screen
 * route of the site that renders it alone; without `frameHref` (a site with no such route) it is shown as code.
 */
export function ExampleBlock({ example, id, frameHref }: { example: DocExample; id: string; frameHref?: string }) {
  const fullScreen = example.preview === "none";
  const codeOnly = fullScreen && !frameHref;
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
          <div className="flex flex-wrap items-center gap-3">
            {fullScreen && frameHref && (
              <a
                href={frameHref}
                target="_blank"
                rel="noopener"
                data-example-fullscreen=""
                className={cn("inline-flex items-center gap-1 h-8 px-1 rounded-control text-ui font-medium text-strong hover:underline underline-offset-2", FOCUS_RING)}
              >
                Mở toàn màn hình
                <Icon name="external" className="w-3.5 h-3.5" />
              </a>
            )}
            <SegmentedControl
              label="Chế độ xem ví dụ"
              value={view}
              onChange={setView}
              options={[
                { key: "preview", label: "Xem trước" },
                { key: "code", label: "Code" },
              ]}
            />
          </div>
        )}
      </div>
      {view === "code" ? (
        <CodeBlock code={example.code} />
      ) : fullScreen && frameHref ? (
        <div data-example-preview="" data-example-frame="" className={`${CARD} overflow-hidden bg-canvas`}>
          <iframe src={frameHref} title={`Ví dụ: ${example.title}`} loading="lazy" className={`block w-full ${FRAME_HEIGHT} border-0 bg-canvas`} />
        </div>
      ) : (
        <div data-density-view data-example-preview="" className={`@container ${CARD} p-card sm:p-panel overflow-x-auto ${example.preview === "frame" ? "bg-canvas" : ""}`}>
          <RecordCrumbContext.Provider value={NO_CRUMB}>
            <Component />
          </RecordCrumbContext.Provider>
        </div>
      )}
    </section>
  );
}
