// Pure helpers of FileDrop (no React): accept matching, size format and the accept / reject split. Kept apart so
// they run under `node --test` (lint/test/filedrop.test.mjs).

export type FileRejectReason = "type" | "size" | "directory" | "duplicate" | "multiple";

export interface FileRejection {
  file: File;
  reason: FileRejectReason;
}

/** Whether `file` matches the `accept` list (MIME types, "type/*" wildcards or ".ext"); no list accepts everything. */
export function matchesAccept(file: Pick<File, "name" | "type">, accept?: string[]): boolean {
  if (!accept || accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((raw) => {
    const a = raw.trim().toLowerCase();
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.endsWith("/*")) return type.startsWith(a.slice(0, -1));
    return type === a;
  });
}

/** Human size: 1.2 MB. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

/**
 * Split a picked / dropped batch. Checked in order per file: directory, type, size, duplicate (same name + size as an
 * existing item or an earlier file of the batch), then, with `multiple` off, every valid file after the first is
 * rejected as "multiple".
 */
export function classifyFiles(
  files: File[],
  opts: { accept?: string[]; maxSize?: number; multiple?: boolean; existing?: Array<{ name: string; size: number }>; directories?: ReadonlySet<File> },
): { accepted: File[]; rejected: FileRejection[] } {
  const seen = new Set((opts.existing ?? []).map((i) => `${i.name}\0${i.size}`));
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    const key = `${file.name}\0${file.size}`;
    let reason: FileRejectReason | undefined;
    if (opts.directories?.has(file)) reason = "directory";
    else if (!matchesAccept(file, opts.accept)) reason = "type";
    else if (opts.maxSize !== undefined && file.size > opts.maxSize) reason = "size";
    else if (seen.has(key)) reason = "duplicate";
    else if (!opts.multiple && accepted.length >= 1) reason = "multiple";
    if (reason) rejected.push({ file, reason });
    else {
      accepted.push(file);
      seen.add(key);
    }
  }
  return { accepted, rejected };
}
