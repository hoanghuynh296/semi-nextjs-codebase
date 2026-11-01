"use client";

import React from "react";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { PageTitle } from "../../src/PageTitle";
import { Button } from "../../src/Button";
import { Field, Input } from "../../src/Field";
import { Checkbox } from "../../src/Choice";
import { Pills } from "../../src/Pills";
import { CustomSelect } from "../../src/CustomSelect";
import { Alert } from "../../src/Feedback";
import { Table, THead, TBody, TR, TH, TD } from "../../src/Table";
import { Badge } from "../../src/Badge";
import { toast } from "../../src/Toast";
import { KpiCard } from "../../src/KpiCard";
import { CARD } from "../../styles/surfaces";
import styleList from "../../tokens/styles.json";
import sample from "./sample.json";
import { FONTS } from "../../brand/generate.mjs";
import { buildBrand, getPreviewBrand, setPreviewBrand, type Brand } from "../BrandPreview";

// Sample brand values live in JSON: they are brand input data, not colours of this page.
const SAMPLE = sample.brand as Brand;
const FONT_OPTIONS = Object.keys(FONTS).map((f) => ({ value: f, label: f }));
const HEX = /^#[0-9a-fA-F]{6}$/;

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: bảng màu`}
          value={HEX.test(value) ? value : SAMPLE.primary}
          onChange={(e) => onChange(e.target.value)}
          className="h-field w-12 shrink-0 cursor-pointer rounded-control border border-line bg-field p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} className="tabular-nums" />
      </div>
    </Field>
  );
}

export default function BrandPage() {
  const [brand, setBrand] = React.useState<Brand>(SAMPLE);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const stored = getPreviewBrand();
    if (stored) {
      setBrand(stored);
      setOn(true);
    }
  }, []);
  const result = React.useMemo(() => buildBrand(brand), [brand]);
  const error = "error" in result ? result.error : null;
  const update = (next: Partial<Brand>) => {
    const b = { ...brand, ...next };
    setBrand(b);
    if (on && !("error" in buildBrand(b))) setPreviewBrand(b);
  };
  const toggleStyle = (id: string, checked: boolean) => {
    const allowed = checked ? [...brand.styles.allowed, id] : brand.styles.allowed.filter((s) => s !== id);
    if (!allowed.length) return;
    update({ styles: { allowed, default: allowed.includes(brand.styles.default) ? brand.styles.default : allowed[0] } });
  };
  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text);
    toast({ title: `Đã copy ${what}`, tone: "success" });
  };
  const brandJson = JSON.stringify(brand, null, 2);
  const command = `node <plugin>/skills/semi-brand/scripts/brand.mjs create --cwd . --name "${brand.name}" --package "${brand.package}" --primary "${brand.primary}"${
    brand.secondary ? ` --secondary "${brand.secondary}"` : ""
  } --neutral ${brand.neutral}${brand.palettes && brand.neutral === "preset" ? ` --palette ${Object.entries(brand.palettes).map(([k, v]) => `${k}=${v}`).join(",")}` : ""} --style ${brand.styles.default} --allow ${brand.styles.allowed.join(",")} --sans "${brand.fonts.sans}" --display "${brand.fonts.display}"`;

  return (
    <>
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="Brand preview" />
        <p className="text-ui text-muted max-w-3xl leading-relaxed">
          Xem một thương hiệu trên toàn bộ Semi trước khi tạo brand kit. Chỉ chọn vài thứ (màu chính, màu phụ, màu trung tính, style, font); thang màu, màu
          nút cho nền sáng / tối và màu trung tính của từng style do Semi tự sinh và kiểm tra đọc rõ. Bật xem trước để mọi trang Storybook đổi theo. Hướng dẫn:
          docs/BRANDS.md.
        </p>
      </div>

      <ShowcaseSection id="brand-choices" title="Lựa chọn của thương hiệu" icon="palette" meta="brand.json · những gì người dùng tự quyết">
        <div className="grid gap-4 @xl:grid-cols-2">
          <Field label="Tên thương hiệu">
            <Input value={brand.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Package" hint="Tên sản phẩm cài, vd. @3dnoobs/brand">
            <Input value={brand.package} onChange={(e) => update({ package: e.target.value })} spellCheck={false} />
          </Field>
          <ColorField label="Màu chính" value={brand.primary} onChange={(v) => update({ primary: v })} hint="Màu của thương hiệu (logo). Bắt buộc." />
          <div className="space-y-2">
            <Checkbox checked={Boolean(brand.secondary)} onChange={(c) => update({ secondary: c ? sample.secondary : null })} label="Có màu phụ" description="Tuỳ chọn: secondary-50 … 900, text-secondary-fg" />
            {brand.secondary && <ColorField label="Màu phụ" value={brand.secondary} onChange={(v) => update({ secondary: v })} />}
          </div>
          <Field label="Màu trung tính">
            <Pills
              value={brand.neutral}
              onChange={(v) => update({ neutral: v })}
              options={[
                { key: "tinted", label: "Phủ theo màu chính" },
                { key: "preset", label: "Có sẵn của style" },
              ]}
            />
          </Field>
          <Field label="Style được phép" hint="Mỗi sản phẩm chọn một trong số này">
            <div className="flex flex-wrap gap-4 pt-1">
              {styleList.styles.map((s) => (
                <Checkbox key={s.id} checked={brand.styles.allowed.includes(s.id)} onChange={(c) => toggleStyle(s.id, c)} label={s.name} />
              ))}
            </div>
          </Field>
          <Field label="Style mặc định">
            <Pills
              value={brand.styles.default}
              onChange={(v) => update({ styles: { ...brand.styles, default: v } })}
              options={brand.styles.allowed.map((id) => ({ key: id, label: styleList.styles.find((s) => s.id === id)!.name }))}
            />
          </Field>
          {brand.neutral === "preset" &&
            brand.styles.allowed.map((id) => {
              const st = styleList.styles.find((s) => s.id === id)!;
              return (
                <Field key={id} label={`Palette của ${st.name}`}>
                  <CustomSelect
                    variant="field"
                    value={brand.palettes?.[id] ?? st.palettes[0].id}
                    onChange={(v) => update({ palettes: { ...brand.palettes, [id]: v } })}
                    options={st.palettes.map((p) => ({ value: p.id, label: p.name }))}
                  />
                </Field>
              );
            })}
          <Field label="Font giao diện">
            <CustomSelect variant="field" value={brand.fonts.sans} onChange={(v) => update({ fonts: { ...brand.fonts, sans: v } })} options={FONT_OPTIONS} />
          </Field>
          <Field label="Font tiêu đề">
            <CustomSelect variant="field" value={brand.fonts.display} onChange={(v) => update({ fonts: { ...brand.fonts, display: v } })} options={FONT_OPTIONS} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={on ? "secondary" : "primary"}
            icon={on ? "close" : "eye"}
            disabled={Boolean(error)}
            onClick={() => {
              setPreviewBrand(on ? null : brand);
              setOn(!on);
            }}
          >
            {on ? "Tắt xem trước" : "Xem trước trên mọi trang"}
          </Button>
          <Button variant="secondary" icon="copy" onClick={() => copy(brandJson, "brand.json")}>
            Copy brand.json
          </Button>
          <Button variant="secondary" icon="code" onClick={() => copy(command, "lệnh tạo brand kit")}>
            Copy lệnh tạo kit
          </Button>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="brand-result" title="Semi sinh ra" icon="sparkles" meta="thang màu · màu nút · kiểm tra đọc rõ (WCAG AA)">
        {error ? (
          <Alert tone="danger" title="brand.json chưa hợp lệ">
            <span className="whitespace-pre-line">{error.replace(/^brand.json không hợp lệ:\n/, "")}</span>
          </Alert>
        ) : (
          !("error" in result) && (
            <>
              {[["Màu chính", result.tokens.primary], ...(result.tokens.secondary ? [["Màu phụ", result.tokens.secondary] as const] : [])].map(([label, sc]) => (
                <div key={label as string} className="space-y-1.5">
                  <DemoLabel>{label as string}</DemoLabel>
                  <div className="grid grid-cols-5 @xl:grid-cols-10 gap-1.5">
                    {Object.entries(sc as Record<string, string>).map(([shade, hex]) => (
                      <div key={shade} className="space-y-1">
                        <div className="h-10 rounded-control border border-line" style={{ background: hex }} />
                        <div className="text-caption text-muted tabular-nums">
                          {shade} · {hex}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="grid gap-3 @xl:grid-cols-3">
                <KpiCard
                  label="Cặp màu đạt AA"
                  value={`${result.report.filter((r) => r.ok).length}/${result.report.length}`}
                  icon="check"
                  iconTone="green"
                  tone={result.report.every((r) => r.ok) ? "good" : "danger"}
                />
                <div className={`${CARD} p-4 space-y-2 @xl:col-span-2`}>
                  <DemoLabel>Màu nút chính</DemoLabel>
                  <div className="flex flex-wrap gap-2 text-label">
                    {(["dark", "light"] as const).map((t) => (
                      <span key={t} className="inline-flex items-center gap-2">
                        <Badge tone="gray">{t === "dark" ? "Tối" : "Sáng"}</Badge>
                        <span className="tabular-nums text-body">
                          {result.tokens.themes[t]["color-accent"]} / chữ {result.tokens.themes[t]["color-on-accent"]}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {result.warnings.map((w) => (
                <Alert key={w} tone="warning">
                  {w}
                </Alert>
              ))}
              <Table>
                <THead>
                  <TR>
                    <TH>Kiểm tra</TH>
                    <TH>Cặp</TH>
                    <TH align="right">Tỉ lệ</TH>
                    <TH>Kết quả</TH>
                  </TR>
                </THead>
                <TBody>
                  {result.report.map((r) => (
                    <TR key={r.check}>
                      <TD>{r.check}</TD>
                      <TD className="text-muted">{r.pair}</TD>
                      <TD align="right" numeric>
                        {r.ratio.toFixed(2)}
                      </TD>
                      <TD>
                        <Badge tone={r.ok ? "green" : "rose"} dot>
                          {r.ok ? "Đạt" : "Chưa đạt"}
                        </Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </>
          )
        )}
      </ShowcaseSection>
    </>
  );
}
