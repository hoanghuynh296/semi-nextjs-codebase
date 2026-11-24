"use client";

import React from "react";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { Field } from "../../src/Field";
import { Pills } from "../../src/Pills";
import { CustomSelect } from "../../src/CustomSelect";
import { Table, THead, TBody, TR, TH, TD } from "../../src/Table";
import { PageTitle } from "../../src/PageTitle";
import { KpiCard } from "../../src/KpiCard";
import { Button } from "../../src/Button";
import { Slider } from "../../src/Slider";
import { useTheme } from "../../src/ThemeProvider";
import { knownFonts, fontOf, fontValue, typeKeys } from "../../scripts/lab.mjs";
import { LAB_SOURCES } from "../LabPreview";
import { Changed, CommitInput, isNumber, isPx, pxOf, rem, type useLabEditor } from "./shared";

const { tokens } = LAB_SOURCES;
const SIZE_KEYS = (typeKeys(tokens) as string[]).filter((k) => !k.endsWith("--line-height"));
const FONTS = Object.values(knownFonts(tokens) as Record<string, { family: string; variable: string }>);
const FONT_OPTIONS = FONTS.map((f) => ({ value: f.variable, label: f.family }));
/** font-display without a brand display face: the UI sans. */
const DISPLAY_DEFAULT = "var(--font-display-family, var(--semi-font-sans))";
const DISPLAY_OPTIONS = [{ value: "", label: "Font giao diện (mặc định)" }, ...FONT_OPTIONS];
const WEIGHTS = ["400", "500", "600", "700", "800"].map((w) => ({ value: w, label: w }));
const FIGURE = [
  { value: "var(--semi-font-sans)", label: "Font giao diện" },
  { value: "var(--semi-font-display)", label: "Font tiêu đề" },
];
/** The real utility of each size (literal class names, so Tailwind generates them): the sample reads what apps read. */
const SAMPLE_CLASS: Record<string, string> = {
  "text-hero": "text-hero",
  "text-title-xl": "text-title-xl",
  "text-tab-xl": "text-tab-xl",
  "text-section": "text-section",
  "text-figure": "text-figure",
  "text-lead": "text-lead",
  "text-ui": "text-ui",
  "text-input": "text-input",
  "text-chrome": "text-chrome",
  "text-tag": "text-tag",
  "text-badge": "text-badge",
  "text-overline": "text-overline",
  "text-nav-label": "text-nav-label",
};
const DENSITIES = Object.keys(tokens.product.density);
const SCALES = Object.keys(tokens.product.typeScale);

/** Type scale, its overrides per density / type scale, and the fonts and title weight of the one look. */
export function TypePanel({ lab }: { lab: ReturnType<typeof useLabEditor> }) {
  const { values, update, changed } = lab;
  const { resolvedTheme } = useTheme();
  const [density, setDensity] = React.useState("regular");
  const [scale, setScale] = React.useState("even");
  const st = values.shape;

  return (
    <>
      <ShowcaseSection id="lab-type" title="Thang chữ" icon="edit" meta="tokens.json type · cỡ chữ px, line height">
        <p className="text-ui text-muted max-w-3xl">
          Cỡ chữ ghi bằng px (build đổi sang rem). Gõ xong bấm Enter hoặc rời ô để áp dụng; Esc trả lại giá trị cũ. Cột mẫu dùng đúng biến của utility
          (text-ui đọc var(--text-ui)), và khung xem trước bên dưới đặt density / type scale đang chọn.
        </p>
        <div className="grid gap-4 @xl:grid-cols-3">
          <Field label="Xem với density">
            <Pills value={density} onChange={setDensity} options={DENSITIES.map((d) => ({ key: d, label: d }))} />
          </Field>
          <Field label="Xem với type scale">
            <Pills value={scale} onChange={setScale} options={SCALES.map((d) => ({ key: d, label: d }))} />
          </Field>
        </div>
        <div data-theme={resolvedTheme} data-density={density} data-type-scale={scale} className="space-y-4 bg-canvas text-body p-card rounded-card border border-line">
          <Table>
            <THead>
              <TR>
                <TH>Token</TH>
                <TH>Cỡ (px)</TH>
                <TH>Line height</TH>
                <TH>Mẫu</TH>
              </TR>
            </THead>
            <TBody>
              {SIZE_KEYS.map((k) => (
                <TR key={k}>
                  <TD>
                    <span className="inline-flex items-center gap-2">
                      <code className="text-ui text-strong">{k}</code>
                      <Changed on={changed(["type", k]) || changed(["type", `${k}--line-height`])} />
                    </span>
                  </TD>
                  <TD>
                    <CommitInput className="w-24 tabular-nums" aria-label={`${k}: cỡ chữ`} value={values.type[k]} valid={isPx} onCommit={(v) => update(["type", k], v)} />
                  </TD>
                  <TD>
                    <CommitInput
                      className="w-20 tabular-nums"
                      aria-label={`${k}: line height`}
                      value={values.type[`${k}--line-height`] ?? ""}
                      valid={isNumber}
                      onCommit={(v) => update(["type", `${k}--line-height`], v)}
                    />
                  </TD>
                  <TD>
                    <span className={`text-strong ${SAMPLE_CLASS[k] ?? ""}`}>In 3D dễ như bấm nút</span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <DemoLabel>Component thật với giá trị này</DemoLabel>
          <div className="space-y-3" data-density-view>
            <PageTitle title="Đơn hàng hôm nay" />
            <p className="text-ui text-body max-w-2xl">
              Đoạn văn bản giao diện (text-ui). Mỗi cỡ chữ mang line height riêng: 1.5 cho chữ đọc, 1.25 cho tiêu đề; leading-* vẫn ghi đè được.
            </p>
            <div className="grid gap-3 @xl:grid-cols-3">
              <KpiCard label="Doanh thu" value="12.400.000 ₫" sub="+8% so với hôm qua" icon="chart" iconTone="green" />
              <KpiCard label="Đơn mới" value="128" sub="12 chờ xác nhận" icon="cart" iconTone="sky" />
              <div className="flex flex-wrap items-start gap-2">
                <Button variant="primary">Tạo đơn</Button>
                <Button variant="subtle">Xuất file</Button>
              </div>
            </div>
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="lab-type-product" title="Theo density và type scale" icon="sliders" meta="tokens.json product · lựa chọn của từng sản phẩm">
        <div className="grid gap-4 @xl:grid-cols-2">
          {DENSITIES.filter((d) => d !== "regular").map((d) => (
            <div key={d} className="space-y-3">
              <DemoLabel>density “{d}”</DemoLabel>
              <Slider
                label={`Đơn vị khoảng cách (p-4 = 4 × đơn vị) · ${values.density[d].spacing}`}
                min={2.4}
                max={5.2}
                step={0.05}
                showValue
                format={(v) => `${v}px`}
                value={pxOf(values.density[d].spacing)}
                onChange={(v) => update(["density", d, "spacing"], rem(v))}
              />
              {Object.entries(values.density[d].sizes).map(([k, v]) => (
                <Field key={k} label={`${k} khi density ${d}`}>
                  <CommitInput className="w-28 tabular-nums" value={v} valid={isPx} onCommit={(x) => update(["density", d, "sizes", k], x)} />
                </Field>
              ))}
            </div>
          ))}
          {SCALES.filter((s) => Object.keys(values.typeScale[s].sizes).length).map((s) => (
            <div key={s} className="space-y-3">
              <DemoLabel>type scale “{s}”</DemoLabel>
              <div className="grid gap-3 grid-cols-2">
                {Object.entries(values.typeScale[s].sizes).map(([k, v]) => (
                  <Field key={k} label={k}>
                    <CommitInput className="tabular-nums" value={v} valid={isPx} onCommit={(x) => update(["typeScale", s, "sizes", k], x)} />
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="lab-fonts" title="Font và độ đậm" icon="edit" meta="tokens/tokens.json shape">
        <p className="text-ui text-muted max-w-3xl">
          Font mặc định của Semi (brand kit vẫn ghi đè bằng font của thương hiệu; không có font tiêu đề thì font-display là font giao diện). Lab chỉ cho chọn những font docs đã tải; font khác cần thêm vào
          “$fonts” của tokens.json shape và app/layout.tsx. Độ đậm của chữ thường là luật (font-medium / font-semibold, semi-lint chặn bold), không phải token.
        </p>
        <div className="grid gap-4 @xl:grid-cols-2">
          {(["font-sans", "font-display"] as const).map((role) => (
            <Field key={role} label={<span className="inline-flex items-center gap-2">{role === "font-sans" ? "Font giao diện (font-sans)" : "Font tiêu đề (font-display)"} <Changed on={changed(["shape", role])} /></span>}>
              <CustomSelect
                variant="field"
                value={fontOf(st[role]) ?? ""}
                onChange={(v) => update(["shape", role], role === "font-display" && !v ? DISPLAY_DEFAULT : fontValue(role, FONTS.find((f) => f.variable === v)!))}
                options={role === "font-display" ? DISPLAY_OPTIONS : FONT_OPTIONS}
              />
            </Field>
          ))}
          <Field label={<span className="inline-flex items-center gap-2">Độ đậm tiêu đề và số lớn (font-weight-title) <Changed on={changed(["shape", "font-weight-title"])} /></span>}>
            <CustomSelect variant="field" value={st["font-weight-title"]} onChange={(v) => update(["shape", "font-weight-title"], v)} options={WEIGHTS} />
          </Field>
          <Field label={<span className="inline-flex items-center gap-2">Font của số lớn (font-figure) <Changed on={changed(["shape", "font-figure"])} /></span>}>
            <CustomSelect variant="field" value={st["font-figure"]} onChange={(v) => update(["shape", "font-figure"], v)} options={FIGURE} />
          </Field>
        </div>
        <div data-theme={resolvedTheme} className="bg-canvas text-body p-card rounded-card border border-line space-y-2">
          <p className="font-display font-title text-section text-strong">Tiêu đề trang · 1.234.567</p>
          <p className="font-figure font-title text-figure text-strong tabular-nums">98.765.432 ₫</p>
          <p className="font-sans text-ui">Chữ giao diện: nhãn, nút, bảng, đoạn văn ngắn. Aa Ăă Ââ Đđ Êê Ôô Ơơ Ưư 0123456789</p>
        </div>
      </ShowcaseSection>
    </>
  );
}
