"use client";

import React from "react";
import { Page } from "../../../../../../src/Page";

const ITEMS = Array.from({ length: 40 }, (_, i) => `Dòng nội bộ ${i + 1}`);

export default function MotionFixedPage() {
  return (
    <Page layout="work" fixed title="Cuộn nội bộ">
      <div
        data-testid="inner-scroller"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-card border border-line bg-card p-card flex flex-col gap-2"
      >
        {ITEMS.map((label, i) => (
          <div key={i} data-motion-item="" className="px-3 py-2 rounded-control bg-panel text-ui text-strong shrink-0">
            {label}
          </div>
        ))}
      </div>
    </Page>
  );
}
