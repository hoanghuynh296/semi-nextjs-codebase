"use client";

import React from "react";
import { ShowcaseSection } from "../Showcase";
import { Slider } from "../../src/Slider";
import { Badge } from "../../src/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../../src/Table";
import { PARAM_NOTES } from "../../brand/params.mjs";
import { compareSamples } from "../../brand/compare.mjs";
import { LAB_SOURCES } from "../LabPreview";
import { Changed, type useLabEditor } from "./shared";

type Summary = { error?: string; fails?: string[] };
type CompareRow = { id: string; name: string; primary: string; before: Summary; after: Summary; moved?: number };
const NOTES = PARAM_NOTES as Record<string, string>;

const outcome = (s: Summary) => (s.error ? "lỗi" : `${s.fails?.length ?? 0} cặp chưa đạt`);

/**
 * The brand generator's parameters (brand/params.mjs). Since 1.0 the generator derives only the text on each brand fill
 * and its hover; surfaces and text are the same neutrals for every brand. Each sample brand shows before → after.
 */
export function ColorPanel({ lab }: { lab: ReturnType<typeof useLabEditor> }) {
  const { values, update, changed } = lab;
  const params = values.params as unknown as Record<string, unknown>;
  const numeric = Object.entries(params).filter((e): e is [string, number] => typeof e[1] === "number");
  const source = LAB_SOURCES.params as Record<string, unknown>;
  const rows = React.useMemo(() => compareSamples({ tokens: LAB_SOURCES.tokens }, { after: params }) as unknown as CompareRow[], [params]);

  return (
    <>
      <ShowcaseSection id="lab-color" title="Bộ sinh màu brand" icon="palette" meta="brand/params.mjs">
        <p className="text-ui text-muted max-w-3xl">
          Bộ sinh màu chỉ còn chọn chữ trên màu brand (primary, secondary) và màu hover của chúng. Bề mặt, chữ và đường kẻ là màu trung tính chung cho mọi
          brand (tokens.json), không sinh từ màu brand.
        </p>
        <div className="grid gap-4 @xl:grid-cols-2">
          {numeric.map(([k, v]) => {
            const base = typeof source[k] === "number" ? (source[k] as number) : v;
            const max = Math.max(base * 3, 0.1);
            return (
              <div key={k} className="space-y-1">
                <Slider label={k} min={0} max={max} step={max / 60} showValue format={(x) => x.toFixed(3)} value={v} onChange={(x) => update(["params", k], +x.toFixed(4))} />
                <p className="text-caption text-muted">{NOTES[k]}</p>
                <Changed on={changed(["params", k])} />
              </div>
            );
          })}
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="lab-compare" title="Brand mẫu" icon="layers" meta="brand/samples.mjs · trước → sau">
        <Table>
          <THead>
            <TR>
              <TH>Brand</TH>
              <TH>Màu</TH>
              <TH>Trước</TH>
              <TH>Sau</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{r.name}</TD>
                <TD>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="size-4 rounded-chip border border-line" style={{ background: r.primary }} />
                    <code className="text-caption">{r.primary}</code>
                  </span>
                </TD>
                <TD>{outcome(r.before)}</TD>
                <TD>
                  <Badge tone={r.after.error || (r.after.fails?.length ?? 0) > (r.before.fails?.length ?? 0) ? "red" : "green"}>{outcome(r.after)}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ShowcaseSection>
    </>
  );
}
