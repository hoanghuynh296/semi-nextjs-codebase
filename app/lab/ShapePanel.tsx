"use client";

import React from "react";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { Field, Input } from "../../src/Field";
import { Slider } from "../../src/Slider";
import { Button } from "../../src/Button";
import { Card } from "../../src/Card";
import { Checkbox } from "../../src/Choice";
import { Badge } from "../../src/Badge";
import { KpiCard } from "../../src/KpiCard";
import { useTheme } from "../../src/ThemeProvider";
import { LAB_SOURCES } from "../LabPreview";
import { Changed, CommitInput, pxOf, rem, type useLabEditor } from "./shared";

const RADII: { key: string; label: string; max: number }[] = [
  { key: "radius-chip", label: "Dấu nhỏ: checkbox, code, số đếm (rounded-chip)", max: 16 },
  { key: "radius-control", label: "Nút, ô nhập, chọn, dòng danh sách (rounded-control)", max: 24 },
  { key: "radius-card", label: "Card, popover, menu, toast (rounded-card)", max: 32 },
  { key: "radius-panel", label: "Hero, modal, drawer, sidebar (rounded-panel)", max: 40 },
];
const SIZES: { key: string; label: string }[] = [
  { key: "spacing-control", label: "Chiều cao nút, pill, ô tìm (h-control)" },
  { key: "spacing-field", label: "Chiều cao ô nhập và chọn (h-field)" },
];
const TEXT: { key: string; label: string; hint: string }[] = [
  { key: "shadow-card", label: "Bóng của card (shadow-card)", hint: "box-shadow; dùng var(--semi-shadow-tint) hoặc var(--semi-line) để theo theme" },
  { key: "card-border", label: "Viền card (border-card)", hint: "border; vd. 1px solid var(--semi-line)" },
];
/** Keys the panels above (and the type panel) edit; any other shape token is listed raw under “Token khác”. */
const HANDLED = new Set([...RADII, ...SIZES, ...TEXT].map((x) => x.key).concat(["font-sans", "font-display", "font-figure", "font-weight-title"]));

/** The shape of the one look: radii, control sizes, card shadow and border, and any other shape token as raw CSS. */
export function ShapePanel({ lab }: { lab: ReturnType<typeof useLabEditor> }) {
  const { values, update, changed } = lab;
  const { resolvedTheme } = useTheme();
  const [notify, setNotify] = React.useState(true);
  const st = values.shape;
  const label = (text: string, key: string) => (
    <span className="inline-flex items-center gap-2">
      {text} <Changed on={changed(["shape", key])} />
    </span>
  );
  const others = Object.keys(st).filter((k) => !HANDLED.has(k));

  return (
    <ShowcaseSection id="lab-shape" title="Hình khối" icon="shapes" meta="tokens/tokens.json shape · bo góc, kích thước, bóng, viền">
      <div className="grid gap-6 @3xl:grid-cols-2">
        <div className="space-y-4">
          {RADII.map((r) => (
            <div key={r.key} className="space-y-1">
              <Slider label={r.label} min={0} max={r.max} step={1} showValue format={(v) => `${v}px · ${rem(v)}`} value={pxOf(st[r.key])} onChange={(v) => update(["shape", r.key], rem(v))} />
              <Changed on={changed(["shape", r.key])} />
            </div>
          ))}
          {SIZES.map((r) => (
            <div key={r.key} className="space-y-1">
              <Slider label={r.label} min={24} max={64} step={1} showValue format={(v) => `${v}px`} value={pxOf(st[r.key])} onChange={(v) => update(["shape", r.key], `${v}px`)} />
              <Changed on={changed(["shape", r.key])} />
            </div>
          ))}
          {TEXT.map((t) => (
            <Field key={t.key} label={label(t.label, t.key)} hint={t.hint}>
              <CommitInput value={st[t.key]} valid={(v) => v.length > 0 && !/[;{}]/.test(v)} onCommit={(v) => update(["shape", t.key], v)} />
            </Field>
          ))}
          {others.length > 0 && (
            <div className="space-y-3">
              <DemoLabel>Token shape khác</DemoLabel>
              {others.map((k) => (
                <Field key={k} label={label(k, k)}>
                  <CommitInput value={st[k]} valid={(v) => v.length > 0 && !/[;{}]/.test(v)} onCommit={(v) => update(["shape", k], v)} />
                </Field>
              ))}
            </div>
          )}
        </div>
        <div data-theme={resolvedTheme} className="self-start space-y-3 bg-canvas text-body p-card rounded-panel border border-line">
          <DemoLabel>Xem trước</DemoLabel>
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-title font-semibold text-contrast">Máy in A1</span>
              <Badge tone="green" dot>
                Sẵn sàng
              </Badge>
            </div>
            <Field label="Tên bản in">
              <Input defaultValue="Móc khoá logo PLA đen" />
            </Field>
            <Checkbox checked={notify} onChange={setNotify} label="Gửi thông báo khi in xong" />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon="play">In ngay</Button>
              <Button variant="secondary">Để sau</Button>
            </div>
          </Card>
          <KpiCard label="Bản in đang chạy" value="12" sub="3 máy rảnh" icon="printer" iconTone="green" />
        </div>
      </div>
    </ShowcaseSection>
  );
}
