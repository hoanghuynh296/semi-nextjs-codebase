"use client";

import React from "react";
import { ShowcaseSection } from "../Showcase";
import { Field } from "../../src/Field";
import { Pills } from "../../src/Pills";
import { Button } from "../../src/Button";
import { Badge } from "../../src/Badge";
import { Checkbox } from "../../src/Choice";
import { KpiCard } from "../../src/KpiCard";
import { compareSamples, comparisonOk } from "../../brand/compare.mjs";
import { LAB_SOURCES } from "../LabPreview";
import { Outcome, ScaleRow, type CompareRow, type Summary } from "./ColorPanel";
import type { useLabEditor } from "./shared";

const { tokens, styles } = LAB_SOURCES;
const src = (key: string) => `--semi-${key.replace(/^color-/, "")}`;

/** The variables a generated brand sets for one theme and style (as brandCss writes them), for a scoped specimen. */
function specimenVars(s: Summary, theme: "dark" | "light", style: string): React.CSSProperties {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.themes[theme])) vars[src(k)] = v;
  for (const [k, v] of Object.entries(s.neutrals[style]?.[theme] ?? {})) vars[src(k)] = v;
  for (const e of Object.values(s.status)) for (const [k, v] of Object.entries(e[theme])) vars[src(k)] = v;
  for (const [k, v] of Object.entries(s.primary)) vars[`--color-primary-${k}`] = v;
  return vars as React.CSSProperties;
}

/** A few components in one theme with a generated brand: the button, coloured text, a checked box, status text. */
function Specimen({ s, theme, style }: { s: Summary; theme: "dark" | "light"; style: string }) {
  const [on, setOn] = React.useState(true);
  return (
    <div data-theme={theme} data-style={style} style={specimenVars(s, theme, style)} className="bg-canvas text-body p-3 rounded-card border border-line space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary">
          Lưu
        </Button>
        <Button size="sm" variant="secondary">
          Huỷ
        </Button>
        <span className="text-label font-medium text-accent-fg">Xem chi tiết</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-label">
        <Checkbox checked={on} onChange={setOn} label="Đã chọn" />
        <span className="text-danger-fg">Lỗi</span>
        <span className="text-success-fg">Xong</span>
        <span className="text-warning-fg">Cảnh báo</span>
      </div>
    </div>
  );
}

/** Every sample brand with the current and the draft generator parameters, side by side. */
export function ComparePanel({ lab }: { lab: ReturnType<typeof useLabEditor> }) {
  const p = lab.values.params;
  const [style, setStyle] = React.useState<string>(styles.default);
  const [onlyMoved, setOnlyMoved] = React.useState(false);
  const rows = React.useMemo(() => compareSamples({ tokens, styles }, { after: p }) as unknown as CompareRow[], [p]);
  const ok = comparisonOk(rows);
  const lost = rows.filter((r) => r.after.error || r.after.fails.length > r.before.fails.length).length;
  const shown = onlyMoved ? rows.filter((r) => r.moved > 0 || JSON.stringify(r.before.fidelity) !== JSON.stringify(r.after.fidelity)) : rows;

  return (
    <ShowcaseSection id="lab-compare" title="So sánh trên các brand mẫu" icon="layers" meta={`brand/samples.mjs · ${rows.length} brand · cũng chạy bằng semi-brand compare`}>
      <p className="text-ui text-muted max-w-3xl">
        Mỗi brand mẫu khó theo một kiểu (rất sáng, rất tối, trùng màu lỗi, ít sắc). Một tham số giúp brand này có thể làm hỏng brand khác: bản nháp chỉ nên
        giao cho agent khi không brand nào mất cặp màu đạt AA. Khung mẫu dùng màu sinh ra cho đúng theme và style đang chọn.
      </p>
      <div className="grid gap-3 @xl:grid-cols-3">
        <KpiCard label="Brand mất cặp màu đạt" value={String(lost)} icon={ok ? "check" : "alert"} iconTone={ok ? "green" : "rose"} tone={ok ? "good" : "danger"} />
        <KpiCard label="Brand đổi thang màu" value={String(rows.filter((r) => r.moved > 0).length)} sub={`trên ${rows.length} brand mẫu`} icon="palette" iconTone="violet" />
        <div className="space-y-3">
          <Field label="Màu trung tính của style">
            <Pills value={style} onChange={setStyle} options={styles.styles.map((s) => ({ key: s.id, label: s.name }))} />
          </Field>
          <Checkbox checked={onlyMoved} onChange={setOnlyMoved} label="Chỉ brand có thay đổi" />
        </div>
      </div>
      <div className="space-y-6">
        {shown.map((r) => (
          <div key={r.id} className="space-y-3 pt-4 border-t border-line first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-title font-semibold text-contrast">{r.name}</span>
              <code className="text-label text-muted">{r.primary}</code>
              {r.moved > 0 && <Badge tone="amber">thang lệch tới ΔE {r.moved.toFixed(2)}</Badge>}
              {r.after.fails?.length > r.before.fails?.length && <Badge tone="rose">mất cặp đạt AA</Badge>}
            </div>
            <p className="text-label text-muted">{r.why}</p>
            {r.before.primary && <ScaleRow label="Trước" scale={r.before.primary} step={r.before.brandStep} />}
            {r.after.primary && <ScaleRow label="Sau" scale={r.after.primary} step={r.after.brandStep} />}
            <div className="grid gap-3 @xl:grid-cols-2">
              <Outcome s={r.before} />
              <Outcome s={r.after} />
            </div>
            {!r.after.error && (
              <div className="grid gap-3 @xl:grid-cols-2">
                <Specimen s={r.after} theme="dark" style={style} />
                <Specimen s={r.after} theme="light" style={style} />
              </div>
            )}
          </div>
        ))}
      </div>
    </ShowcaseSection>
  );
}
