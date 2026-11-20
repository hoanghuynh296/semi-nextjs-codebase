"use client";

import React from "react";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { Field } from "../../src/Field";
import { CustomSelect } from "../../src/CustomSelect";
import { Slider } from "../../src/Slider";
import { Badge } from "../../src/Badge";
import { Alert } from "../../src/Feedback";
import { LineChart } from "../../src/Chart";
import { PARAM_NOTES } from "../../brand/params.mjs";
import { SAMPLES } from "../../brand/samples.mjs";
import { compareSamples } from "../../brand/compare.mjs";
import { LAB_SOURCES } from "../LabPreview";
import { Changed, type useLabEditor } from "./shared";

const { tokens, styles } = LAB_SOURCES;
export const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
const SAMPLE_OPTIONS = SAMPLES.map((s) => ({ value: s.id, label: `${s.name} · ${s.brand.primary}` }));
const STATUS_LABEL: Record<string, string> = { danger: "Lỗi", success: "Thành công", warning: "Cảnh báo", info: "Thông tin" };

export type Summary = {
  error?: string;
  fails: string[];
  soft: number;
  pairs: number;
  primary: Record<string, string>;
  brandStep: number;
  themes: Record<string, Record<string, string>>;
  fidelity: Record<string, { fill: number; text: number; deltaE: number }>;
  neutrals: Record<string, Record<string, Record<string, string>>>;
  status: Record<string, { turn: number; from: string; to: string; dark: Record<string, string>; light: Record<string, string> }>;
};
export type CompareRow = { id: string; name: string; why: string; primary: string; before: Summary; after: Summary; moved: number };

/** One scale as ten swatches, the brand's own shade marked; hex values under each (the swatch carries no text). */
export function ScaleRow({ label, scale, step }: { label: string; scale: Record<string, string>; step?: number }) {
  return (
    <div className="space-y-1">
      <span className="text-label text-muted">{label}</span>
      <div className="grid grid-cols-5 @xl:grid-cols-10 gap-1">
        {SHADES.map((s) => (
          <div key={s} className="space-y-0.5 min-w-0">
            <div className={`h-8 rounded-chip border ${String(step) === s ? "border-contrast border-2" : "border-line"}`} style={{ background: scale[s] }} />
            <div className="text-caption text-muted tabular-nums truncate">
              {s} {scale[s]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** What a sample brand gets: button and coloured-text shade per theme, how far from the brand colour, failing pairs. */
export function Outcome({ s }: { s: Summary }) {
  if (s.error) return <Alert tone="danger">{s.error}</Alert>;
  return (
    <div className="flex flex-col gap-1 text-label">
      {(["dark", "light"] as const).map((t) => (
        <span key={t} className="inline-flex flex-wrap items-center gap-2">
          <Badge tone="gray">{t === "dark" ? "Tối" : "Sáng"}</Badge>
          <span className="tabular-nums text-body">
            nút primary-{s.fidelity[t].fill} · chữ màu primary-{s.fidelity[t].text}
          </span>
          <Badge tone={s.fidelity[t].deltaE <= 0.08 ? "green" : "amber"}>ΔE {s.fidelity[t].deltaE.toFixed(2)}</Badge>
        </span>
      ))}
      <span>
        <Badge tone={s.fails.length ? "rose" : "green"} dot>
          {s.fails.length ? `${s.fails.length} cặp chưa đạt AA` : `${s.pairs - s.soft}/${s.pairs} cặp đạt`}
        </Badge>
      </span>
    </div>
  );
}

/** The brand colour generator's parameters (brand/params.mjs), tried on one sample brand before and after. */
export function ColorPanel({ lab }: { lab: ReturnType<typeof useLabEditor> }) {
  const { values, update, changed } = lab;
  const p = values.params;
  const [sample, setSample] = React.useState(SAMPLES[0].id);
  const row = React.useMemo(
    () => (compareSamples({ tokens, styles }, { after: p, samples: SAMPLES.filter((s) => s.id === sample) }) as unknown as CompareRow[])[0],
    [p, sample],
  );
  const slider = (path: string[], label: string, min: number, max: number, step: number, fmt = (v: number) => String(v)) => {
    let v: unknown = values;
    for (const k of path) v = (v as Record<string, unknown>)[k];
    return (
      <div key={path.join(".")} className="space-y-1">
        <Slider label={label} min={min} max={max} step={step} showValue format={fmt} value={v as number} onChange={(x) => update(path, x)} />
        <Changed on={changed(path)} />
      </div>
    );
  };
  const ladderData = SHADES.map((s) => ({ shade: s, before: LAB_SOURCES.params.ladder[s as keyof typeof LAB_SOURCES.params.ladder], after: p.ladder[s] }));

  return (
    <>
      <ShowcaseSection id="lab-color-sample" title="Thử trên một brand mẫu" icon="palette" meta="brand/samples.mjs · trước / sau">
        <p className="text-ui text-muted max-w-3xl">
          Tham số của bộ sinh màu (brand/params.mjs) giống nhau cho mọi thương hiệu: đổi một số là mọi brand kit đổi màu khi build lại. Brand đang xem trước
          (Brand preview) cũng dùng tham số của bản nháp. Xem tất cả brand mẫu ở tab So sánh.
        </p>
        <Field label="Brand mẫu" hint={SAMPLES.find((s) => s.id === sample)?.why}>
          <CustomSelect variant="field" value={sample} onChange={setSample} options={SAMPLE_OPTIONS} />
        </Field>
        {row.before.primary && <ScaleRow label="Trước (tham số hiện tại)" scale={row.before.primary} step={row.before.brandStep} />}
        {row.after.primary && <ScaleRow label="Sau (bản nháp)" scale={row.after.primary} step={row.after.brandStep} />}
        <div className="grid gap-4 @xl:grid-cols-2">
          <div className="space-y-1.5">
            <DemoLabel>Trước</DemoLabel>
            <Outcome s={row.before} />
          </div>
          <div className="space-y-1.5">
            <DemoLabel>Sau</DemoLabel>
            <Outcome s={row.after} />
          </div>
        </div>
        {row.after.fails?.map((f) => (
          <Alert key={f} tone="danger">
            {f}
          </Alert>
        ))}
      </ShowcaseSection>

      <ShowcaseSection id="lab-color-ladder" title="Độ sáng từng shade" icon="sliders" meta="params.ladder · OKLCH L">
        <p className="text-ui text-muted max-w-3xl">{PARAM_NOTES.ladder}. Phải giảm dần từ 50 đến 900.</p>
        <LineChart
          data={ladderData}
          index="shade"
          series={[
            { key: "before", label: "Hiện tại", color: 8 },
            { key: "after", label: "Bản nháp", color: 1 },
          ]}
          label="Độ sáng OKLCH của từng shade, hiện tại và bản nháp"
          height={180}
          format={(v) => v.toFixed(3)}
        />
        <div className="grid gap-4 @xl:grid-cols-2">{SHADES.map((s) => slider(["params", "ladder", s], `primary-${s}`, 0.2, 0.99, 0.005, (v) => v.toFixed(3)))}</div>
      </ShowcaseSection>

      <ShowcaseSection id="lab-color-chroma" title="Độ đậm sắc, nút, màu trung tính, trạng thái" icon="sliders" meta="params.chroma · fillReach · tint · statusGap">
        <div className="grid gap-6 @xl:grid-cols-2">
          <div className="space-y-4">
            <DemoLabel>Độ đậm sắc của thang (chroma)</DemoLabel>
            <p className="text-label text-muted">{PARAM_NOTES.chroma}</p>
            {slider(["params", "chroma", "lighter"], "Shade sáng giữ màu (lighter)", 0.3, 3, 0.05)}
            {slider(["params", "chroma", "darker"], "Shade tối mất màu (darker)", 0, 1, 0.05)}
            {slider(["params", "chroma", "white"], "Điểm trắng (white)", 0.9, 1, 0.005, (v) => v.toFixed(3))}
            <DemoLabel>Nút chính</DemoLabel>
            <p className="text-label text-muted">{PARAM_NOTES.fillReach}</p>
            {slider(["params", "fillReach"], "Được lệch tối đa (ΔE)", 0, 0.5, 0.01, (v) => v.toFixed(2))}
          </div>
          <div className="space-y-4">
            <DemoLabel>Màu trung tính phủ theo màu chính (neutral “tinted”)</DemoLabel>
            <p className="text-label text-muted">
              {PARAM_NOTES.tint}. {PARAM_NOTES.surfaceTint}.
            </p>
            {styles.styles.map((s) => slider(["params", "tint", s.id], `${s.name}: chữ và đường kẻ`, 0, 0.04, 0.001, (v) => v.toFixed(3)))}
            {styles.styles.map((s) => slider(["params", "surfaceTint", s.id], `${s.name}: nền`, 0, 0.012, 0.0005, (v) => v.toFixed(4)))}
            <DemoLabel>Tách màu trạng thái khỏi màu chính</DemoLabel>
            <p className="text-label text-muted">
              {PARAM_NOTES.statusGap}. {PARAM_NOTES.statusTurn}.
            </p>
            {slider(["params", "statusGap"], "Khoảng cách tối thiểu (độ)", 0, 90, 1, (v) => `${v}°`)}
            {Object.keys(p.statusTurn).map((k) => slider(["params", "statusTurn", k], `${STATUS_LABEL[k] ?? k}: xoay tối đa`, 0, 60, 1, (v) => `${v}°`))}
          </div>
        </div>
      </ShowcaseSection>
    </>
  );
}
