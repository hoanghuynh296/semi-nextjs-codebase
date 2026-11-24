"use client";

import React from "react";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { PageTitle } from "../../src/PageTitle";
import { Button } from "../../src/Button";
import { Field, Input } from "../../src/Field";
import { Checkbox } from "../../src/Choice";
import { CustomSelect } from "../../src/CustomSelect";
import { Alert } from "../../src/Feedback";
import { Table, THead, TBody, TR, TH, TD } from "../../src/Table";
import { Badge } from "../../src/Badge";
import { toast } from "../../src/Toast";
import { KpiCard } from "../../src/KpiCard";
import { CARD } from "../../styles/surfaces";
import sample from "./sample.json";
import type { BrandColor } from "../BrandPreview";
import { FONTS } from "../../brand/generate.mjs";
import { buildBrand, getPreviewBrand, setPreviewBrand, type Brand } from "../BrandPreview";

// Sample brand values live in JSON: they are brand input data, not colours of this page.
const SAMPLE = sample.brand as Brand;
const FONT_OPTIONS = Object.keys(FONTS).map((f) => ({ value: f, label: f }));
const HEX = /^#[0-9a-fA-F]{6}$/;
/** The colour of a brand.json colour field ("#hex" or { color, on }). */
const hexOf = (v: BrandColor | null | undefined) => (typeof v === "string" ? v : (v?.color ?? ""));
const NO_DISPLAY = "";

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: bảng màu`}
          value={HEX.test(value) ? value : hexOf(SAMPLE.primary)}
          onChange={(e) => onChange(e.target.value)}
          className="h-field w-12 shrink-0 cursor-pointer rounded-control border border-control-line bg-field p-1"
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
  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text);
    toast({ title: `Đã copy ${what}`, tone: "success" });
  };
  const brandJson = JSON.stringify(brand, null, 2);
  // What to paste into the agent in an empty brand repo: /semi-brand takes these choices instead of asking for them.
  const prompt = `/semi-brand tạo brand kit từ brand.json này:\n\n\`\`\`json\n${brandJson}\n\`\`\``;

  return (
    <>
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="Brand preview" />
        <p className="text-ui text-muted max-w-3xl">
          Xem một thương hiệu trên toàn bộ Semi trước khi tạo brand kit. Chỉ chọn vài thứ (màu chính, màu phụ, font); chữ trên nút và màu hover do Semi
          tự chọn và kiểm tra đọc rõ. Màu thương hiệu chỉ cho nút chính và vài dấu hiệu chú ý; nền, chữ, mục đang chọn là xám trung tính của Semi. Bật xem trước để mọi trang của docs đổi theo. Ưng ý thì copy lệnh cho agent và dán vào
          /semi-brand trong repo brand trống. Hướng dẫn: docs/BRANDS.md.
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
          <ColorField label="Màu chính" value={hexOf(brand.primary)} onChange={(v) => update({ primary: v })} hint="Màu của nút chính, badge cần chú ý, nhãn “Mới”. Bắt buộc." />
          <div className="space-y-2">
            <Checkbox checked={Boolean(brand.secondary)} onChange={(c) => update({ secondary: c ? sample.secondary : null })} label="Có màu phụ" description="Tuỳ chọn: nút chính thứ hai (bg-secondary)" />
            {brand.secondary && <ColorField label="Màu phụ" value={hexOf(brand.secondary)} onChange={(v) => update({ secondary: v })} />}
          </div>
          <Field label="Font giao diện">
            <CustomSelect variant="field" value={brand.fonts.sans} onChange={(v) => update({ fonts: { ...brand.fonts, sans: v } })} options={FONT_OPTIONS} />
          </Field>
          <Field label="Font hiển thị" hint="Tuỳ chọn: hero, tiêu đề trang đọc, tab lớn. Không chọn: dùng font giao diện">
            <CustomSelect
              variant="field"
              value={brand.fonts.display ?? NO_DISPLAY}
              onChange={(v) => {
                const { display: _, ...rest } = brand.fonts;
                update({ fonts: v === NO_DISPLAY ? rest : { ...rest, display: v } });
              }}
              options={[{ value: NO_DISPLAY, label: "Như font giao diện" }, ...FONT_OPTIONS]}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={on ? "subtle" : "primary"}
            icon={on ? "close" : "eye"}
            disabled={Boolean(error)}
            onClick={() => {
              setPreviewBrand(on ? null : brand);
              setOn(!on);
            }}
          >
            {on ? "Tắt xem trước" : "Xem trước trên mọi trang"}
          </Button>
          <Button variant="subtle" icon="copy" onClick={() => copy(brandJson, "brand.json")}>
            Copy brand.json
          </Button>
          <Button variant="subtle" icon="code" onClick={() => copy(prompt, "lệnh cho agent")}>
            Copy lệnh cho agent
          </Button>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="brand-result" title="Semi sinh ra" icon="sparkles" meta="chữ trên nút · hover · kiểm tra đọc rõ (WCAG AA)">
        {error ? (
          <Alert tone="danger" title="brand.json chưa hợp lệ">
            <span className="whitespace-pre-line">{error.replace(/^brand.json không hợp lệ:\n/, "")}</span>
          </Alert>
        ) : (
          !("error" in result) && (
            <>
              <div className="grid gap-3 @xl:grid-cols-3">
                <KpiCard
                  label="Cặp màu đạt"
                  value={`${result.report.filter((r) => r.ok).length}/${result.report.length}`}
                  icon="check"
                  iconTone="green"
                  tone={result.report.every((r) => r.ok || r.soft) ? "good" : "danger"}
                />
                <div className={`${CARD} p-card space-y-2 @xl:col-span-2`}>
                  <DemoLabel>Màu nút (cùng một màu ở cả hai theme)</DemoLabel>
                  <div className="flex flex-col gap-2 text-ui">
                    {[["Màu chính", "màu chính", result.tokens.primary] as const, ...(result.tokens.secondary ? [["Màu phụ", "màu phụ", result.tokens.secondary] as const] : [])].map(([label, name, f]) => {
                      const ratio = result.report.find((r) => r.check === `chữ trên nút ${name}`)?.ratio;
                      return (
                        <span key={label} className="inline-flex flex-wrap items-center gap-2">
                          <Badge tone="gray">{label}</Badge>
                          <span className="inline-block h-3.5 w-3.5 rounded-control border border-line" style={{ background: f.fill }} />
                          <span className="tabular-nums text-body">
                            {f.fill} · hover {f.hover} · chữ {f.on}
                            {ratio ? ` · ${ratio.toFixed(2)}:1` : ""}
                          </span>
                        </span>
                      );
                    })}
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
                    <TH align="right">Cần</TH>
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
                      <TD align="right" numeric>
                        {r.min}
                      </TD>
                      <TD>
                        <Badge tone={r.ok ? "green" : r.soft ? "amber" : "rose"} dot>
                          {r.ok ? "Đạt" : r.soft ? "Lưu ý" : "Chưa đạt"}
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
