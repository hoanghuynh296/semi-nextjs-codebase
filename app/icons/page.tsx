"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconTile, type IconName, type TileTone, BRAND_TONES } from "../../src/Icon";
import { ICON_CATALOG, suggestIcon } from "../../src/iconCatalog";
import { PageTitle } from "../../src/PageTitle";
import { TAG } from "../../src/Chip";
import { Badge } from "../../src/Badge";
import { Alert, EmptyState } from "../../src/Feedback";
import { Input } from "../../src/Field";
import { CustomSelect } from "../../src/CustomSelect";
import { ToggleGroup } from "../../src/Toggle";
import { toast } from "../../src/Toast";
import { CARD, SECTION_HEAD, SECTION_TITLE } from "../../styles/surfaces";
import { Card } from "../../src/Card";
import { Button } from "../../src/Button";

const DOMAIN_OPTIONS: { id: string; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "core", label: "Core & Shell" },
  { id: "ecommerce", label: "E-Commerce" },
  { id: "developer", label: "Developer & DevOps" },
  { id: "analytics", label: "Analytics & Metrics" },
  { id: "hardware_3d", label: "3D & Hardware" },
  { id: "media", label: "Media & Files" },
  { id: "brand", label: "Brands & TMĐT VN" },
];

const TONES: { id: TileTone; label: string }[] = [
  { id: "green", label: "Xanh lá" },
  { id: "pink", label: "Hồng" },
  { id: "sky", label: "Xanh trời" },
  { id: "amber", label: "Hổ phách" },
  { id: "violet", label: "Tím" },
  { id: "gray", label: "Xám" },
];

function QuerySync({ onQuery }: { onQuery: (q: string) => void }) {
  const params = useSearchParams();
  const q = params.get("q");
  useEffect(() => {
    if (q !== null) onQuery(q);
  }, [q, onQuery]);
  return null;
}

export default function IconsPage() {
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [activeTone, setActiveTone] = useState<TileTone>("green");
  const [selectedIconName, setSelectedIconName] = useState<IconName | null>("sparkles");

  const handleQueryPrefill = React.useCallback((q: string) => {
    setSearch(q);
    setSelectedDomain("all");
    const trimmed = q.trim();
    if (trimmed && trimmed in ICON_CATALOG) {
      setSelectedIconName(trimmed as IconName);
    }
  }, []);

  // Filter icons
  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    const allEntries = Object.entries(ICON_CATALOG);

    return allEntries.filter(([name, meta]) => {
      if (selectedDomain !== "all") {
        const itemDomain = meta.domain || "core";
        if (itemDomain !== selectedDomain) return false;
      }

      if (!q) return true;

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
    navigator.clipboard?.writeText(snippet).then(
      () => toast({ title: `Đã copy ${snippet}`, tone: "success" }),
      () => toast({ title: "Không copy được: trình duyệt chặn clipboard", tone: "danger" }),
    );
  };

  const selectedMeta = selectedIconName ? ICON_CATALOG[selectedIconName] : null;
  const totalCount = Object.keys(ICON_CATALOG).length;

  return (
    <>
      <Suspense fallback={null}>
        <QuerySync onQuery={handleQueryPrefill} />
      </Suspense>

      <div className="space-y-3">
        <PageTitle title="Icons" />
        <p className="text-ui text-muted max-w-3xl">
          <strong className="text-body font-medium">{totalCount} icon</strong> theo ngữ nghĩa của Semi. Không inline SVG, không dùng glyph unicode — bấm một icon để xem chi tiết và copy{" "}
          <code className="text-body">&lt;Icon name=&quot;…&quot; /&gt;</code>.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={TAG}>{totalCount} icon</span>
          <span className={TAG}>Nét 1.75 · 24×24</span>
          <span className={TAG}>Sáng và tối</span>
        </div>
      </div>

      <section id="icons" className="space-y-4">
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_TITLE}>Tra cứu icon</h2>
          <Badge size="sm">
            {filteredIcons.length} / {totalCount}
          </Badge>
        </div>

        <div className={`${CARD} p-card flex flex-col gap-3 @3xl:flex-row @3xl:items-center`}>
          <div className="flex-1 min-w-0">
            <Input
              icon="search"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              aria-label="Tìm icon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên, alias hoặc ý định: checkout, database, xoá, giao hàng…"
            />
          </div>
          <CustomSelect
            aria-label="Nhóm icon"
            value={selectedDomain}
            onChange={setSelectedDomain}
            options={DOMAIN_OPTIONS.map((d) => ({ value: d.id, label: d.label }))}
          />
          <ToggleGroup
            label="Màu ô icon"
            value={[activeTone]}
            onChange={(v) => v[0] && setActiveTone(v[0])}
            options={TONES.map((t) => ({ key: t.id, label: t.label }))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {filteredIcons.map(([name, meta]) => {
              const isSelected = selectedIconName === name;
              return (
                <Card
                  key={name}
                  active={isSelected}
                  onClick={() => {
                    setSelectedIconName(name as IconName);
                    handleCopy(name);
                  }}
                  title={`Copy <Icon name="${name}" />`}
                  className="flex flex-col items-center justify-center gap-2 text-center"
                >
                  <IconTile name={name as IconName} tone={meta.domain === "brand" ? (BRAND_TONES[name as IconName] || activeTone) : activeTone} size="md" />
                  <span className="w-full">
                    <span className="text-ui font-medium text-strong block truncate">{name}</span>
                    <span className="text-ui text-muted block truncate">{meta.lucideEquivalent || meta.category}</span>
                  </span>
                  {meta.domain && <Badge size="sm">{meta.domain}</Badge>}
                </Card>
              );
            })}

            {filteredIcons.length === 0 && (
              <EmptyState
                className="col-span-full"
                icon="search"
                title={`Không có icon nào khớp “${search}”`}
                description="Thử từ khoá tiếng Việt như “xoá”, “thanh toán”, “giao hàng”, “máy chủ”."
              />
            )}
          </div>

          <div className={`${CARD} p-card lg:col-span-1 sticky top-4 space-y-4`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-ui font-medium text-strong">Chi tiết icon</h3>
              {selectedMeta?.domain && (
                <Badge size="sm" tone="green">
                  {selectedMeta.domain}
                </Badge>
              )}
            </div>

            {selectedMeta ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <IconTile name={selectedMeta.name} tone={selectedMeta.domain === "brand" ? (BRAND_TONES[selectedMeta.name] || activeTone) : activeTone} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="text-lead font-medium text-strong truncate">{selectedMeta.name}</div>
                    <div className="text-ui text-muted truncate">Nhóm: {selectedMeta.category}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-ui font-medium text-muted block">Dùng để</span>
                  <p className="text-ui text-body">{selectedMeta.purpose}</p>
                </div>

                <Alert tone="success" title="Nên dùng">
                  {selectedMeta.do}
                </Alert>
                <Alert tone="danger" title="Không dùng">
                  {selectedMeta.dont}
                </Alert>

                {selectedMeta.lucideEquivalent && (
                  <div className="space-y-1">
                    <span className="text-ui font-medium text-muted block">Tên trong Lucide</span>
                    <code className="text-ui text-body">{selectedMeta.lucideEquivalent}</code>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-ui font-medium text-muted block">JSX</span>
                  <Button icon="copy" fullWidth onClick={() => handleCopy(selectedMeta.name)} aria-label={`Copy <Icon name="${selectedMeta.name}" />`}>
                    <code className="truncate">&lt;Icon name=&quot;{selectedMeta.name}&quot; /&gt;</code>
                  </Button>
                </div>

                <div className="space-y-1">
                  <span className="text-ui font-medium text-muted block">Từ khoá tìm kiếm</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedMeta.keywords.map((kw) => (
                      <Badge key={kw} size="sm">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-ui text-muted py-6 text-center">Chọn một icon để xem chi tiết</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
