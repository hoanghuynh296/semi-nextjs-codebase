"use client";

import React from "react";
import { ShowcaseSection } from "../Showcase";
import { Button } from "../../src/Button";
import { Alert, EmptyState } from "../../src/Feedback";
import { Table, THead, TBody, TR, TH, TD } from "../../src/Table";
import { diffDraft, encodeDraft, isEmptyDraft, validateDraft } from "../../scripts/lab.mjs";
import { compareSamples, comparisonOk } from "../../brand/compare.mjs";
import { LAB_SOURCES } from "../LabPreview";
import { copyText, type useLabEditor } from "./shared";

/** What the draft changes, file by file, and what to hand to an agent (the patch and the steps around it). */
export function ChangesPanel({ lab, onReset }: { lab: ReturnType<typeof useLabEditor>; onReset: () => void }) {
  const { draft } = lab;
  const rows = diffDraft(draft, LAB_SOURCES) as { file: string; key: string; from: string; to: string | number }[];
  const errors = validateDraft(draft, LAB_SOURCES) as string[];
  const paramsChanged = rows.some((r) => r.file === "brand/params.mjs");
  const samplesOk = React.useMemo(
    () => !paramsChanged || comparisonOk(compareSamples({ tokens: LAB_SOURCES.tokens }, { after: lab.values.params })),
    [paramsChanged, lab.values.params],
  );
  const patch = JSON.stringify(draft, null, 2);
  // What to paste into an agent in this repo: lab:apply writes the sources; the agent does the docs around it.
  const prompt = [
    "Áp dụng bản nháp Design Lab này vào Semi (docs/LAB.md):",
    "1. Lưu JSON bên dưới thành lab-patch.json ở gốc repo, chạy `npm run lab:apply -- lab-patch.json`, rồi xoá file.",
    "2. Làm các việc script in ra (docs, CHANGELOG, DECISIONS) theo AGENTS.md › Change checklist; ghi lý do đổi vào docs/DECISIONS.md.",
    "3. `npm run build:manifest && npm run check`, rồi `npm run build:storybook && npm run build:brand-book && npm run test:ui`.",
    "",
    "```json",
    patch,
    "```",
  ].join("\n");
  const share = () => {
    const url = `${window.location.origin}${window.location.pathname}#lab=${encodeDraft(draft)}`;
    copyText(url, "link chia sẻ bản nháp");
  };

  if (isEmptyDraft(draft))
    return (
      <ShowcaseSection id="lab-changes" title="Thay đổi" icon="code" meta="chưa có gì">
        <EmptyState icon="sliders" title="Bản nháp đang trống" description="Đổi một giá trị ở các tab Chữ, Hình khối hoặc Màu: nó áp dụng ngay trên mọi trang của docs và hiện ở đây." />
      </ShowcaseSection>
    );

  return (
    <ShowcaseSection id="lab-changes" title="Thay đổi" icon="code" meta={`${rows.length} giá trị · ${new Set(rows.map((r) => r.file)).size} file nguồn`}>
      {errors.length > 0 && (
        <Alert tone="danger" title="Bản nháp có giá trị không hợp lệ: lab:apply sẽ từ chối">
          <span className="whitespace-pre-line">{errors.join("\n")}</span>
        </Alert>
      )}
      {!samplesOk && (
        <Alert tone="warning" title="Có brand mẫu mất cặp màu đạt AA">
          Tham số bộ sinh màu mới làm ít nhất một brand mẫu kém đọc rõ hơn (tab So sánh). lab:apply sẽ dừng, không ghi gì.
        </Alert>
      )}
      {paramsChanged && samplesOk && (
        <Alert tone="info" title="Mọi brand kit sẽ đổi màu khi build lại">
          Tham số bộ sinh màu là thay đổi core: CHANGELOG cần ghi chú /semi-brand update cho các brand kit.
        </Alert>
      )}
      <Table>
        <THead>
          <TR>
            <TH>File</TH>
            <TH>Khoá</TH>
            <TH>Hiện tại</TH>
            <TH>Bản nháp</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((r) => (
            <TR key={`${r.file}:${r.key}`}>
              <TD className="text-muted">{r.file}</TD>
              <TD>
                <code className="text-ui text-strong">{r.key}</code>
              </TD>
              <TD className="text-muted break-all">{String(r.from)}</TD>
              <TD className="text-strong break-all">{String(r.to)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon="code" disabled={errors.length > 0} onClick={() => copyText(prompt, "lệnh cho agent")}>
          Copy lệnh cho agent
        </Button>
        <Button variant="secondary" icon="copy" onClick={() => copyText(patch, "patch JSON")}>
          Copy patch JSON
        </Button>
        <Button variant="secondary" icon="external" onClick={share}>
          Copy link chia sẻ
        </Button>
        <Button variant="secondary" icon="reset" onClick={onReset}>
          Bỏ bản nháp
        </Button>
      </div>
    </ShowcaseSection>
  );
}
