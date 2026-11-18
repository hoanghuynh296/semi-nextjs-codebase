"use client";

// File picker + dropzone with a row per file (docs/components/file-drop.md). Controlled: `items` is the app's list,
// the component only reports accepted files (onAdd), rejected ones (onReject), remove and retry.
//   <Field label="Tệp nhập" error={err}>
//     <FileDrop accept={[".csv"]} maxSize={10_000_000} items={items} onAdd={upload} onReject={showRejected} />
//   </Field>
import React, { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { useField } from "./Field";
import { Progress } from "./Feedback";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn, FOCUS_RING } from "../styles/utils";
import { classifyFiles, formatFileSize, type FileRejection } from "./fileDropUtils";

export { matchesAccept, formatFileSize, classifyFiles } from "./fileDropUtils";
export type { FileRejection, FileRejectReason } from "./fileDropUtils";

export interface FileDropItem {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  status: "idle" | "uploading" | "done" | "error";
  /** 0–100 while uploading; omit for an indeterminate bar. */
  progress?: number;
  /** Shown under the name when status is "error". */
  error?: string;
}

export interface FileDropProps {
  items: FileDropItem[];
  /** Only the files that passed every check (see `onReject`); a batch never repeats a name + size. */
  onAdd: (files: File[]) => void;
  /** Everything not added, with its reason: "type" / "size" (`accept`, `maxSize`), "directory" (a dropped folder),
   * "duplicate" (same name + size as an item or an earlier file of the batch), "multiple" (extra files while
   * `multiple` is off). The app decides whether to show them (e.g. as a Field error). */
  onReject?: (rejections: FileRejection[]) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** MIME types, wildcards ("image/*") or extensions (".csv"). Omit to accept everything. */
  accept?: string[];
  /** Largest file in bytes. */
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  /** Main line of the drop area (default from the locale). */
  title?: React.ReactNode;
  /** Second line, e.g. "CSV or XLSX, up to 10 MB". */
  hint?: React.ReactNode;
  /** Set by the surrounding Field when omitted. */
  id?: string;
  invalid?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

export function FileDrop({
  items,
  onAdd,
  onReject,
  onRemove,
  onRetry,
  accept,
  maxSize,
  multiple = false,
  disabled = false,
  title,
  hint,
  id,
  invalid,
  "aria-describedby": describedBy,
  className,
}: FileDropProps) {
  const t = useSemiLocale();
  const field = useField();
  const auto = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const [live, setLive] = useState({ text: "", n: 0 });
  const buttonId = id ?? field?.id ?? `filedrop-${auto}`;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const described = describedBy ?? field?.describedBy;

  const announce = (text: string) => setLive((cur) => ({ text, n: cur.n + 1 }));

  const handle = (list: FileList | File[] | null, directories?: ReadonlySet<File>) => {
    if (!list || disabled) return;
    const { accepted, rejected } = classifyFiles(Array.from(list), { accept, maxSize, multiple, existing: items, directories });
    const parts: string[] = [];
    if (accepted.length) {
      onAdd(accepted);
      parts.push(t.filesAdded(accepted.length));
    }
    if (rejected.length) {
      onReject?.(rejected);
      parts.push(t.filesRejected(rejected.length));
    }
    if (parts.length) announce(parts.join(". "));
  };

  // Announce newly failed uploads (an effect, so render stays pure).
  const knownFailed = useRef<Set<string>>(new Set());
  useEffect(() => {
    const now = items.filter((i) => i.status === "error");
    const fresh = now.filter((i) => !knownFailed.current.has(i.id));
    knownFailed.current = new Set(now.map((i) => i.id));
    if (fresh.length) setLive((cur) => ({ text: fresh.map((i) => t.fileUploadFailed(i.name)).join(". "), n: cur.n + 1 }));
  }, [items, t]);

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

  return (
    // Drag handlers sit on the wrapper: a disabled <button> gets no drag events, and a drop nobody cancels would make
    // the browser open the file.
    <div
      className={cn("min-w-0", className)}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current++;
        if (!disabled) setOver(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = disabled ? "none" : "copy";
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (disabled) return;
        const dirs = new Set<File>();
        const files = Array.from(e.dataTransfer.files);
        Array.from(e.dataTransfer.items ?? []).forEach((it, i) => {
          if (it.kind === "file" && it.webkitGetAsEntry?.()?.isDirectory && files[i]) dirs.add(files[i]);
        });
        handle(files, dirs);
      }}
    >
      <button
        type="button"
        id={buttonId}
        disabled={disabled}
        aria-describedby={described}
        aria-invalid={isInvalid || undefined}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-1 rounded-card border border-dashed px-4 py-6 text-center transition-colors",
          FOCUS_RING,
          over ? "border-accent-line bg-accent-subtle text-contrast" : "border-line bg-field text-muted hover:border-line-hover",
          isInvalid && !over && "border-danger-border",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line",
        )}
      >
        <Icon name="upload" className="w-5 h-5 shrink-0" />
        <span className="text-ui text-contrast">{title ?? t.fileDropTitle}</span>
        {hint && <span className="text-label text-muted">{hint}</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept?.join(",")}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
      <div role="status" aria-live="polite" className="sr-only">
        {live.text}
        {live.n % 2 === 0 ? "" : "\u00a0"}
      </div>
      {items.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-control border border-line bg-field px-3 py-2 min-w-0">
              <Icon name="file" className={cn("w-4 h-4 shrink-0", item.status === "error" ? "text-danger-fg" : "text-muted")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-ui text-contrast truncate">{item.name}</span>
                  <span className="text-label text-muted tabular-nums shrink-0">{formatFileSize(item.size)}</span>
                </div>
                {item.status === "uploading" && (
                  <Progress size="sm" className="mt-1.5" value={item.progress} aria-label={`${t.fileUploading}: ${item.name}`} />
                )}
                {item.status === "error" && <p className="text-label text-danger-fg mt-0.5">{item.error ?? t.fileFailed}</p>}
              </div>
              {item.status === "done" && <Icon name="check" className="w-4 h-4 shrink-0 text-success-fg" title={t.fileDone} />}
              {item.status === "error" && onRetry && (
                <Button variant="secondary" size="sm" icon="refresh" onClick={() => onRetry(item.id)}>
                  {t.fileRetry}
                </Button>
              )}
              {onRemove && (
                <Button variant="ghost" size="sm" iconOnly icon="close" aria-label={t.fileRemove(item.name)} onClick={() => onRemove(item.id)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
