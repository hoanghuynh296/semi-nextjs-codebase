"use client";

import React from "react";
import { Input } from "../../src/Field";
import { Badge } from "../../src/Badge";
import { toast } from "../../src/Toast";
import { mergedValues, setDraftValue } from "../../scripts/lab.mjs";
import { LAB_SOURCES, setLab, useLab, type LabDraft } from "../LabPreview";

export type Values = {
  type: Record<string, string>;
  density: Record<string, { spacing?: string; sizes: Record<string, string> }>;
  typeScale: Record<string, { sizes: Record<string, string> }>;
  styles: Record<string, Record<string, string>>;
  params: {
    ladder: Record<string, number>;
    chroma: Record<string, number>;
    fillReach: number;
    tint: Record<string, number>;
    surfaceTint: Record<string, number>;
    statusGap: number;
    statusTurn: Record<string, number>;
  };
};
export type Path = string[];
export type Update = (path: Path, value: string | number | undefined) => void;

/** The draft, its values laid over the sources, and a setter by path (a value equal to the source's drops out). */
export function useLabEditor() {
  const { draft, paused } = useLab();
  const values = React.useMemo(() => mergedValues(draft, LAB_SOURCES) as unknown as Values, [draft]);
  const update: Update = (path, value) => setLab({ draft: setDraftValue(draft, path, value, LAB_SOURCES) as LabDraft, paused });
  const changed = (path: Path) => {
    let node: unknown = draft;
    for (const p of path) node = (node as Record<string, unknown> | undefined)?.[p];
    return node !== undefined;
  };
  return { draft, paused, values, update, changed };
}

/** px of a CSS length (rem at 16px). */
export const pxOf = (v: string | undefined) => (v ? parseFloat(v) * (/rem$/.test(v) ? 16 : 1) : 0);
export const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`;

export function copyText(text: string, what: string) {
  void navigator.clipboard?.writeText(text);
  toast({ title: `Đã copy ${what}`, tone: "success" });
}

/** A mark next to a value the draft changes. */
export const Changed = ({ on }: { on: boolean }) =>
  on ? (
    <Badge size="sm" tone="gray" dot>
      đã đổi
    </Badge>
  ) : null;

/**
 * A text input that commits on blur or Enter (typing "1" on the way to "15" does not resize the whole site), and only
 * when `valid` accepts the text; Escape puts the current value back.
 */
export function CommitInput({
  value,
  onCommit,
  valid = () => true,
  ...rest
}: { value: string; onCommit: (v: string) => void; valid?: (v: string) => boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [text, setText] = React.useState(value);
  React.useEffect(() => setText(value), [value]);
  const commit = () => {
    const v = text.trim();
    if (v !== value && valid(v)) onCommit(v);
    else setText(value);
  };
  return (
    <Input
      {...rest}
      value={text}
      aria-invalid={!valid(text.trim()) || undefined}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setText(value);
      }}
      spellCheck={false}
    />
  );
}

export const isPx = (v: string) => /^\d+(\.\d+)?px$/.test(v);
export const isNumber = (v: string) => /^\d+(\.\d+)?$/.test(v);
