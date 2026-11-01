"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../src/Icon";
import { CARD_HOVER, SECTION_HEAD, SECTION_TITLE } from "../styles/surfaces";
import { DOCS, GROUPS } from "../examples/registry.generated";

/** Every component doc by group, each card with its first example live (the gallery a brand preview shows too). */
export function ComponentIndex() {
  return (
    <div className="@container space-y-8">
      {GROUPS.map((group) => {
        const docs = DOCS.filter((d) => d.group === group);
        if (!docs.length) return null;
        return (
          <section key={group} className="space-y-3">
            <div className={SECTION_HEAD}>
              <h2 className={SECTION_TITLE}>{group}</h2>
              <span className="text-caption text-muted tabular-nums">{docs.length}</span>
            </div>
            <div className="grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {docs.map((d) => {
                // The first example that can render inline (AppShell and root layouts fill the viewport: code only).
                const First = d.examples.find((e) => e.preview !== "none")?.Component;
                return (
                  <div key={d.id} className={`${CARD_HOVER} flex flex-col overflow-hidden`}>
                    <div className="relative h-40 overflow-hidden border-b border-line p-4 flex items-center justify-center" inert>
                      <div className="max-w-full">{First ? <First /> : <Icon name="code" className="w-8 h-8 text-muted" />}</div>
                    </div>
                    <Link href={`/components/${d.id}/`} className="p-4 space-y-1 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-b-card">
                      <div className="text-title font-semibold text-contrast">{d.title}</div>
                      <p className="text-label text-muted line-clamp-2">{d.description}</p>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
