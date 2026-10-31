"use client";

import React, { useState } from "react";
import { StorybookShell } from "../StorybookShell";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { PageTitle, PageTabsTitle } from "../../src/PageTitle";
import { PageActions, PageActionsProvider, PageActionsSlot } from "../../src/PageActions";
import { AppHeader } from "../../src/AppHeader";
import { SidePanel } from "../../src/SidePanel";
import { Markdown } from "../../src/Markdown";
import { Loading, PageSkeleton, Skeleton, SkeletonGrid } from "../../src/Skeleton";
import { Button } from "../../src/Button";
import { HEADER_ICON_BTN, HEADER_ICON_OFF, headerPrimary } from "../../styles/appChrome";
import { Icon } from "../../src/Icon";

const AI_TEXT = `## Gợi ý cài đặt
Với **PETG**, giảm tốc độ quạt xuống 30% và tăng nhiệt độ đầu phun lên 245°C.

- Bật \`Z-hop\` khi di chuyển
- Lớp đầu tiên: 0.24 mm

Xem thêm tại https://example.com/petg-guide`;

export default function PatternsPage() {
  const [view, setView] = useState<"printers" | "jobs">("printers");
  const [collapsed, setCollapsed] = useState(false);
  const [skeleton, setSkeleton] = useState<"grid" | "page">("grid");

  return (
    <StorybookShell>
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="Layout Patterns" />
        <p className="text-ui text-muted max-w-3xl leading-relaxed">
          Khung trang dùng chung: AppShell + MobileTabBar (chính trang Storybook này, thu nhỏ cửa sổ dưới 768px để thấy tab bar), AppHeader cho
          ứng dụng công cụ, SidePanel, PageTabsTitle, PageActions, Markdown và các skeleton.
        </p>
      </div>

      <ShowcaseSection id="page-tabs" title="PageTabsTitle · PageActions" icon="layers" meta="2–4 sibling pages · actions in the header slot">
        <PageActionsProvider>
          <div className="flex items-end gap-3 rounded-xl bg-canvas border border-line p-4">
            <PageTabsTitle
              tabs={[
                { key: "printers", label: "Máy in" },
                { key: "jobs", label: "Job in" },
              ]}
              value={view}
              onChange={setView}
            />
            <PageActionsSlot className="ml-auto" />
          </div>
          <PageActions>
            <Button variant="primary" iconOnly icon="plus" aria-label={view === "printers" ? "Thêm máy in" : "Tạo job"} />
          </PageActions>
        </PageActionsProvider>
        <p className="text-label text-muted">Nút &quot;+&quot; được khai báo trong nội dung trang nhưng hiển thị ở slot của header (portal).</p>
      </ShowcaseSection>

      <ShowcaseSection id="app-header" title="AppHeader (tool apps)" icon="sliders" meta="logo + title go home · one primary action">
        <div className="rounded-xl border border-line overflow-hidden">
          <AppHeader title="Phối màu" productName="Semi" logoIcon="palette" homeHref="#">
            <button type="button" className={`${HEADER_ICON_BTN} ${HEADER_ICON_OFF}`} aria-label="Trợ lý AI" title="Trợ lý AI">
              <Icon name="sparkles" className="w-4 h-4" />
            </button>
            <button type="button" className={headerPrimary(true)}>
              Xong
            </button>
          </AppHeader>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="side-panel" title="SidePanel" icon="sidebar" meta="320px · collapses to a rail">
        <div className="h-64 flex rounded-xl border border-line overflow-hidden bg-canvas">
          <SidePanel collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)}>
            <div className="p-3 space-y-2">
              <DemoLabel>Cài đặt lát cắt</DemoLabel>
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          </SidePanel>
          <div className="flex-1 flex items-center justify-center text-label text-muted">Canvas / 3D view</div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="markdown" title="Markdown (AI text)" icon="sparkles" meta="paragraphs · lists · bold · code · links">
        <Markdown text={AI_TEXT} />
      </ShowcaseSection>

      <ShowcaseSection id="skeletons" title="Skeletons" icon="clock" meta="Loading wrapper announces the region (role=status)">
        <div className="flex gap-2">
          <Button size="sm" variant={skeleton === "grid" ? "primary" : "secondary"} onClick={() => setSkeleton("grid")}>
            SkeletonGrid
          </Button>
          <Button size="sm" variant={skeleton === "page" ? "primary" : "secondary"} onClick={() => setSkeleton("page")}>
            PageSkeleton
          </Button>
        </div>
        {skeleton === "grid" ? (
          <SkeletonGrid count={3} className="grid grid-cols-1 md:grid-cols-3 gap-3" />
        ) : (
          <Loading>
            <PageSkeleton />
          </Loading>
        )}
      </ShowcaseSection>
    </StorybookShell>
  );
}
