"use client";

import React from "react";
import { Page } from "../../../../../../src/Page";

export default function StickyPlainPage() {
  return (
    <Page layout="work" title="Plain page">
      <p data-testid="plain-ready" className="text-ui text-muted">
        No sticky bar mounted here.
      </p>
    </Page>
  );
}
