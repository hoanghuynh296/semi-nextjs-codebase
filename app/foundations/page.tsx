"use client";

import React, { useMemo, useState } from "react";
import { StorybookShell } from "../StorybookShell";
import { StoryUsage } from "../Showcase";
import { Icon, IconTile, type IconName, type TileTone, TILE_TONES } from "../../src/Icon";
import { ICON_CATALOG, type IconDomain, suggestIcon } from "../../src/iconCatalog";
import { PageTitle } from "../../src/PageTitle";
import { TAG, TONE_DOT } from "../../src/Chip";
import { Pills } from "../../src/Pills";
import { CARD, CARD_HOVER } from "../../styles/surfaces";

const DOMAIN_OPTIONS: { id: string; label: string; count?: number }[] = [
  { id: "all", label: "Tất cả" },
  { id: "core", label: "Core & Shell" },
  { id: "ecommerce", label: "E-Commerce" },
  { id: "developer", label: "Developer & DevOps" },
  { id: "analytics", label: "Analytics & Metrics" },
  { id: "hardware_3d", label: "3D & Hardware" },
  { id: "media", label: "Media & Files" },
];

const TONES: { id: TileTone; label: string }[] = [
  { id: "green", label: "Green (Primary)" },
  { id: "pink", label: "Pink (Filament)" },
  { id: "sky", label: "Sky (Camera/Hours)" },
  { id: "amber", label: "Amber (Peripherals)" },
  { id: "violet", label: "Violet (Automation)" },
  { id: "gray", label: "Gray (Neutral)" },
];

export default function FoundationsPage() {
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [activeTone, setActiveTone] = useState<TileTone>("green");
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [selectedIconName, setSelectedIconName] = useState<IconName | null>("sparkles");

  // Filter icons
  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    const allEntries = Object.entries(ICON_CATALOG);

    return allEntries.filter(([name, meta]) => {
      // Domain filter
      if (selectedDomain !== "all") {
        const itemDomain = meta.domain || "core";
        if (itemDomain !== selectedDomain) return false;
      }

      // Search filter
      if (!q) return true;

      // Smart suggest match
      const suggested = suggestIcon(q);
      if (suggested && suggested === name) return true;

      if (name.toLowerCase().includes(q)) return true;
      if (meta.purpose.toLowerCase().includes(q)) return true;
      if (meta.lucideEquivalent?.toLowerCase().includes(q)) return true;
      if (meta.keywords.some((k) => k.toLowerCase().includes(q))) return true;
      if (meta.intents?.some((i) => i.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [search, selectedDomain]);

  const handleCopy = (name: string) => {
    const snippet = `<Icon name="${name}" />`;
    navigator.clipboard.writeText(snippet);
    setCopiedIcon(name);
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  const selectedMeta = selectedIconName ? ICON_CATALOG[selectedIconName] : null;
  const totalCount = Object.keys(ICON_CATALOG).length;

  return (
    <StorybookShell>
      {/* Page Header */}
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="Foundations & Icon Catalogue" />
        <p className="text-ui text-muted max-w-3xl leading-relaxed">
          Tài liệu tổng quan hệ thống Design Tokens (màu sắc tối, typography, bán kính viền) và công cụ tra cứu{" "}
          <strong className="text-body">{totalCount} icons chuẩn hóa</strong> của hệ sinh thái Semi. Không inline SVG, không dùng glyph unicode.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className={TAG}>
            <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.green}`} />
            <span>{totalCount} Icons chuẩn</span>
          </span>
          <span className={TAG}>
            <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.sky}`} />
            <span>Tailwind CSS 4 @theme</span>
          </span>
          <span className={TAG}>
            <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.violet}`} />
            <span>Dark-first Surfaces</span>
          </span>
          <span className={TAG}>
            <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.amber}`} />
            <span>Stroke 1.75 · 24×24</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: Surfaces & Radius Tokens */}
      <section id="surfaces" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="layers" className="w-4 h-4 text-accent-fg" />
            <span>Dark Surfaces & Tokens Scale</span>
          </h2>
          <span className="text-caption text-muted font-medium">Bento 5-Surface Architecture</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-2">
            <span className="text-caption font-medium text-muted block">bg-canvas</span>
            <div className="text-ui font-semibold text-body">#111111</div>
            <p className="text-caption text-muted leading-normal">Khung ngoài cùng AppShell, lớp bọc toàn trang</p>
          </div>
          <div className="p-3.5 rounded-xl bg-app border border-line space-y-2">
            <span className="text-caption font-medium text-muted block">bg-app</span>
            <div className="text-ui font-semibold text-body">#181818</div>
            <p className="text-caption text-muted leading-normal">Nền chính của content panel, trang nội dung</p>
          </div>
          <div className="p-3.5 rounded-xl bg-panel border border-line space-y-2">
            <span className="text-caption font-medium text-muted block">bg-panel</span>
            <div className="text-ui font-semibold text-body">#262626</div>
            <p className="text-caption text-muted leading-normal">Thẻ Card, Sidebar Bento, Header thanh công cụ</p>
          </div>
          <div className="p-3.5 rounded-xl bg-field border border-line space-y-2">
            <span className="text-caption font-medium text-muted block">bg-field</span>
            <div className="text-ui font-semibold text-body">#2E2E2E</div>
            <p className="text-caption text-muted leading-normal">Thân Modal, popup menu, dropdown panel</p>
          </div>
          <div className="p-3.5 rounded-xl bg-raised border border-line space-y-2">
            <span className="text-caption font-medium text-muted block">bg-raised</span>
            <div className="text-ui font-semibold text-body">#383838</div>
            <p className="text-caption text-muted leading-normal">Trạng thái Hover trên bảng dữ liệu, track fills</p>
          </div>
        </div>

        {/* Radius rule banner */}
        <div className="p-3.5 rounded-xl bg-panel border border-line flex flex-wrap items-center justify-between gap-4 text-label">
          <div className="flex items-center gap-2 text-body">
            <Icon name="info" className="w-4 h-4 text-tone-sky shrink-0" />
            <span>
              <strong>Bán kính viền (Radii):</strong> <code className="text-accent-fg">rounded-lg</code> (Controls 8px) · <code className="text-accent-fg">rounded-xl</code> (Cards 12px) · <code className="text-accent-fg">rounded-2xl</code> (Panels/Modal 16px) · <code className="text-accent-fg">rounded-full</code> (Chips/Pills)
            </span>
          </div>
          <span className="text-caption px-2.5 py-1 rounded bg-red-500/10 text-danger-fg font-medium">
            Không dùng bán kính trung bình (bị chặn bởi linter)
          </span>
        </div>
        <StoryUsage id="surfaces" />
      </section>

      {/* SECTION 2: Typography Scale */}
      <section id="typography" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="code" className="w-4 h-4 text-accent-fg" />
            <span>Typography Scale & Constraints</span>
          </h2>
          <span className="text-caption text-muted">font-medium / font-semibold only</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 p-3 rounded-lg bg-panel/[0.03]">
              <span className="text-caption text-muted block font-medium">Page Title (22px - 26px)</span>
              <div className="font-display text-heading sm:text-heading-lg text-contrast">
                Montserrat Alternates
              </div>
              <p className="text-caption text-muted">Dùng cho tiêu đề trang chính thông qua component PageTitle</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg bg-panel/[0.03]">
              <span className="text-caption text-muted block font-medium">KPI & Figures (18px - 22px)</span>
              <div className="text-heading-sm font-semibold text-contrast tabular-nums">
                12.450.000 ₫ <span className="text-success-fg text-ui font-medium">+15.8%</span>
              </div>
              <p className="text-caption text-muted">Luôn dùng tabular-nums cho số đo, số tiền, giờ in</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg bg-panel/[0.03]">
              <span className="text-caption text-muted block font-medium">Body / UI (11px - 15px)</span>
              <div className="text-ui text-body font-medium leading-relaxed">
                Geist Sans với font-feature-settings &quot;ss02&quot;
              </div>
              <p className="text-caption text-muted">Không dùng các lớp cỡ chữ cũ; tối thiểu là text-caption</p>
            </div>
          </div>
        </div>
        <StoryUsage id="typography" />
      </section>

      {/* SECTION 3: Interactive Icon Catalogue (Core Feature) */}
      <section id="icons" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-title-lg font-semibold text-contrast flex items-center gap-2">
              <Icon name="sparkles" className="w-4 h-4 text-accent-fg" />
              <span>Interactive Icon Explorer</span>
              <span className="text-label font-normal px-2 py-0.5 rounded-full bg-panel/[0.08] text-body">
                {filteredIcons.length} / {totalCount} icons
              </span>
            </h2>
            <p className="text-label text-muted pt-0.5">
              Click bất kỳ icon nào để copy nhanh mã JSX <code className="text-accent-fg">&lt;Icon name=&quot;...&quot; /&gt;</code>
            </p>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-panel border border-line shrink-0">
            <span className="text-caption text-muted px-2 font-medium">Tone Tile:</span>
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTone(t.id)}
                title={t.label}
                className={`w-6 h-6 rounded flex items-center justify-center transition-transform ${TILE_TONES[t.id]} ${activeTone === t.id ? "scale-110 ring-1 ring-white/50" : "opacity-60 hover:opacity-100"}`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: Search + Domain Filters */}
        <div className="p-3.5 rounded-xl bg-panel border border-line space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search bar */}
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm icon (tên, alias, intent: 'checkout', 'database', 'xoá', 'giao hàng')..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-panel/[0.05] border border-line focus:border-primary-400 focus:outline-none text-ui text-contrast placeholder:text-muted font-medium"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                <Icon name="search" className="w-4 h-4" />
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body"
                >
                  <Icon name="close" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick stats pill */}
            <div className="flex items-center gap-2 shrink-0">
              {copiedIcon && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-success-fg text-label font-semibold animate-pulse">
                  <Icon name="check" className="w-3.5 h-3.5" />
                  <span>Đã copy &lt;Icon name=&quot;{copiedIcon}&quot; /&gt;</span>
                </div>
              )}
            </div>
          </div>

          {/* Domain Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-line/60">
            {DOMAIN_OPTIONS.map((dom) => {
              const active = selectedDomain === dom.id;
              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => setSelectedDomain(dom.id)}
                  className={`px-3 py-1 rounded-full text-label font-medium transition-colors ${
                    active
                      ? "bg-raised text-contrast border border-line"
                      : "text-muted hover:text-contrast hover:bg-field border border-transparent"
                  }`}
                >
                  {dom.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout: Grid Icons + Detail Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* Main Grid */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {filteredIcons.map(([name, meta]) => {
              const isSelected = selectedIconName === name;
              const isCopied = copiedIcon === name;

              return (
                <div
                  key={name}
                  onClick={() => {
                    setSelectedIconName(name as IconName);
                    handleCopy(name);
                  }}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center select-none ${
                    isSelected
                      ? "bg-panel/[0.08] border-primary-500/50  ring-1 ring-primary-500/30"
                      : "bg-panel hover:bg-panel/[0.05] border-line hover:border-line-hover"
                  }`}
                  title={`Click để copy <Icon name="${name}" />`}
                >
                  {/* Icon Tile Preview */}
                  <div className="relative">
                    <IconTile name={name as IconName} tone={activeTone} size="md" />
                    {isCopied && (
                      <span className="absolute inset-0 rounded-lg bg-emerald-500/90 text-contrast flex items-center justify-center animate-in fade-in">
                        <Icon name="check" className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Icon Name */}
                  <div className="w-full">
                    <span className="text-label font-medium text-body group-hover:text-accent-fg transition-colors block truncate">
                      {name}
                    </span>
                    <span className="text-caption text-muted block truncate">
                      {meta.lucideEquivalent || meta.category}
                    </span>
                  </div>

                  {/* Domain Tag */}
                  {meta.domain && (
                    <span className="text-caption px-1.5 py-0.5 rounded bg-panel/[0.05] text-muted">
                      {meta.domain}
                    </span>
                  )}
                </div>
              );
            })}

            {filteredIcons.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted space-y-2 bg-panel rounded-xl border border-line">
                <Icon name="search" className="w-6 h-6 mx-auto text-muted" />
                <p className="text-ui font-medium">Không tìm thấy icon nào với từ khoá &quot;{search}&quot;</p>
                <p className="text-caption text-muted">Hãy thử gõ từ khoá tiếng Việt như &quot;xoá&quot;, &quot;thanh toán&quot;, &quot;giao hàng&quot;, &quot;máy chủ&quot;...</p>
              </div>
            )}
          </div>

          {/* Inspector Panel */}
          <div className="lg:col-span-1 sticky top-4 p-4 rounded-xl bg-panel border border-line space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-caption text-muted font-semibold">
                Icon Semantic Inspector
              </span>
              {selectedMeta?.domain && (
                <span className="px-2 py-0.5 rounded-full text-caption font-medium bg-primary-500/15 text-accent-fg">
                  {selectedMeta.domain}
                </span>
              )}
            </div>

            {selectedMeta ? (
              <div className="space-y-4">
                {/* Large Preview */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-panel/[0.03] border border-line/60">
                  <IconTile name={selectedMeta.name} tone={activeTone} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="text-ui-lg font-semibold text-contrast truncate">
                      {selectedMeta.name}
                    </div>
                    <div className="text-caption text-muted truncate">
                      Category: {selectedMeta.category}
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                <div className="space-y-1">
                  <span className="text-caption font-semibold text-body block">Ý định sử dụng (Purpose):</span>
                  <p className="text-label text-body leading-relaxed bg-panel/[0.02] p-2.5 rounded-lg border border-line/50">
                    {selectedMeta.purpose}
                  </p>
                </div>

                {/* Do & Don't */}
                <div className="space-y-2 text-label">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-success-fg space-y-1">
                    <span className="font-semibold flex items-center gap-1.5 text-caption">
                      <Icon name="check" className="w-3.5 h-3.5" />
                      NÊN DÙNG (DO):
                    </span>
                    <p className="text-caption text-success-fg leading-normal">{selectedMeta.do}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-danger-fg space-y-1">
                    <span className="font-semibold flex items-center gap-1.5 text-caption">
                      <Icon name="close" className="w-3.5 h-3.5" />
                      CẤM DÙNG (DON&apos;T):
                    </span>
                    <p className="text-caption text-danger-fg leading-normal">{selectedMeta.dont}</p>
                  </div>
                </div>

                {/* Lucide Equivalent */}
                {selectedMeta.lucideEquivalent && (
                  <div className="space-y-1 text-caption">
                    <span className="font-medium text-muted block">Tên chuẩn Lucide:</span>
                    <code className="px-2 py-1 rounded bg-panel/[0.06] text-tone-sky block text-caption">
                      {selectedMeta.lucideEquivalent}
                    </code>
                  </div>
                )}

                {/* Code snippets */}
                <div className="space-y-1 pt-1">
                  <span className="text-caption font-semibold text-muted block">Mã nguồn JSX:</span>
                  <div
                    onClick={() => handleCopy(selectedMeta.name)}
                    className="p-2.5 rounded-lg bg-canvas border border-line text-caption text-accent-fg hover:border-primary-400 transition-colors cursor-pointer group flex items-center justify-between"
                  >
                    <span>&lt;Icon name=&quot;{selectedMeta.name}&quot; /&gt;</span>
                    <Icon name="copy" className="w-3.5 h-3.5 text-muted group-hover:text-accent-fg" />
                  </div>
                </div>

                {/* Keywords list */}
                <div className="space-y-1">
                  <span className="text-caption font-medium text-muted block">Từ khoá tìm kiếm:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedMeta.keywords.map((kw) => (
                      <span key={kw} className="text-caption px-1.5 py-0.5 rounded bg-panel/[0.05] text-muted">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-label text-muted py-6 text-center">Chọn một icon để xem chi tiết</p>
            )}
          </div>
        </div>
        <StoryUsage id="icons" />
      </section>
    </StorybookShell>
  );
}
