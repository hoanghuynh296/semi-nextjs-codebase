"use client";

// What an AI agent is doing, shown inside a chat or a run log (docs/DESIGN_SYSTEM.md §14b): its reasoning, the tools it
// calls, the sources it read, its plan, the actions it needs approved, the files it touched and how full its context
// is. UI only: the app runs the agent and passes its state in; these parts draw it and report approve / reject / select.
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Badge } from "./Badge";
import { Button, Spinner } from "./Button";
import { CodeBlock } from "./CodeBlock";
import { ExternalLink } from "./ExternalLink";
import { Icon, type IconName } from "./Icon";
import { Tooltip } from "./Overlay";
import { STATUS_ICON } from "./Toast";
import { useSemiLocale } from "./locale";
import type { SemanticTone } from "../styles/surfaces";
import { FOCUS_RING, cn } from "../styles/utils";

const DISCLOSURE_ROW = cn("w-full flex items-center gap-2 text-left rounded-control transition", FOCUS_RING);
const chevron = (open: boolean) => <Icon name="chevronDown" className={cn("w-3.5 h-3.5 text-muted shrink-0 transition-transform", !open && "-rotate-90")} />;

// ─── Reasoning ───────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The model's reasoning above its answer. Open while `busy` (the text streams in), folded to “Đã suy luận trong 12
 * giây” once it is done; people can open it again. A toggle by the user wins over the automatic open / close.
 */
export function Reasoning({
  busy = false,
  duration,
  defaultOpen,
  className,
  children,
}: {
  /** The model is still reasoning. */
  busy?: boolean;
  /** Seconds it took, shown once done. */
  duration?: number;
  /** Start open (default: open only while busy). */
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  const [open, setOpen] = useState(defaultOpen ?? busy);
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) setOpen(busy || Boolean(defaultOpen));
  }, [busy, defaultOpen]);
  const id = useId();
  return (
    <div className={cn("self-start w-full", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          touched.current = true;
          setOpen(!open);
        }}
        className={cn(DISCLOSURE_ROW, "w-auto py-1 text-label text-muted hover:text-contrast")}
      >
        <Icon name="sparkles" className={cn("w-3.5 h-3.5 shrink-0", busy && "text-accent-fg motion-safe:animate-pulse")} />
        <span>{busy ? t.reasoning : t.reasoned(duration)}</span>
        {chevron(open)}
      </button>
      <div id={id} hidden={!open} className="mt-1 ml-1.5 border-l border-line pl-3 text-label text-muted leading-relaxed whitespace-pre-wrap break-words">
        {children}
      </div>
    </div>
  );
}

// ─── Tool call ───────────────────────────────────────────────────────────────────────────────────────────────────

export type ToolCallStatus = "pending" | "running" | "done" | "error" | "awaiting";
const TOOL_TONE: Record<ToolCallStatus, SemanticTone> = { pending: "gray", running: "sky", done: "emerald", error: "rose", awaiting: "amber" };

function StatusBadge({ status }: { status: ToolCallStatus }) {
  const t = useSemiLocale();
  return (
    <Badge tone={TOOL_TONE[status]} size="sm" className="shrink-0">
      <span className="inline-flex items-center gap-1">
        {status === "running" && <Spinner className="w-3 h-3" />}
        {t.toolStatus[status]}
      </span>
    </Badge>
  );
}

const asText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

/**
 * One tool the agent called: a row with its name and status that opens to show the input (arguments) and the output.
 * Strings show as they are, anything else as formatted JSON; `error` shows in place of the output.
 */
export function ToolCall({
  name,
  title,
  icon = "wrench",
  status,
  input,
  output,
  error,
  defaultOpen = false,
  className,
  children,
}: {
  /** The tool's id ("search_files"). */
  name: string;
  /** What it does in words ("Tìm tệp cấu hình"); the row shows it instead of the name. */
  title?: React.ReactNode;
  icon?: IconName;
  status: ToolCallStatus;
  /** Arguments: a string or any JSON value. */
  input?: unknown;
  /** Result: a string or any JSON value. */
  output?: unknown;
  /** Error message when status is "error". */
  error?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Anything else under the output (a preview, an ActionConfirmation). */
  children?: React.ReactNode;
}) {
  const t = useSemiLocale();
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cn("w-full rounded-card border border-line bg-panel", className)}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={cn(DISCLOSURE_ROW, "px-3 py-2 hover:bg-raised rounded-card")}>
        <Icon name={icon} className="w-4 h-4 text-muted shrink-0" />
        <span className="flex-1 min-w-0 truncate text-ui font-medium text-contrast">{title ?? name}</span>
        <StatusBadge status={status} />
        {chevron(open)}
      </button>
      <div id={id} hidden={!open} className="border-t border-divider p-3 space-y-3">
        {title && <div className="text-caption text-muted break-all">{name}</div>}
        {input !== undefined && <CodeBlock title={t.toolInput} code={asText(input)} />}
        {status === "error" && error ? (
          <div role="alert" className={cn("rounded-control border px-3 py-2 text-label text-body", STATUS_ICON.danger.surface)}>
            {error}
          </div>
        ) : (
          output !== undefined && <CodeBlock title={t.toolOutput} code={asText(output)} />
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Sources ─────────────────────────────────────────────────────────────────────────────────────────────────────

export interface Source {
  title: string;
  href: string;
  /** A line under the title (the quoted passage, the page's summary). */
  description?: string;
}

const host = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

/** “3 nguồn” under an answer, opening to the numbered list of pages it used (numbers match its `Citation`s). */
export function Sources({ sources, defaultOpen = false, className }: { sources: Source[]; defaultOpen?: boolean; className?: string }) {
  const t = useSemiLocale();
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  if (!sources.length) return null;
  return (
    <div className={className}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={cn(DISCLOSURE_ROW, "w-auto py-1 text-label text-muted hover:text-contrast")}>
        <Icon name="fileText" className="w-3.5 h-3.5 shrink-0" />
        <span>{t.sources(sources.length)}</span>
        {chevron(open)}
      </button>
      <ol id={id} hidden={!open} className="mt-1 space-y-1">
        {sources.map((s, i) => (
          <li key={s.href + i}>
            <ExternalLink href={s.href} className={cn("flex gap-2.5 rounded-control px-2 py-1.5 hover:bg-raised transition", FOCUS_RING)}>
              <span className="w-5 h-5 shrink-0 rounded-chip bg-field border border-line text-caption text-muted tabular-nums flex items-center justify-center">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-label font-medium text-contrast truncate">{s.title}</span>
                <span className="block text-caption text-muted truncate">{s.description ?? host(s.href)}</span>
              </span>
            </ExternalLink>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A numbered citation inside answer text, linking to its source; hover or focus shows the title. */
export function Citation({ n, source }: { /** 1-based, matching the Sources list. */ n: number; source: Source }) {
  const t = useSemiLocale();
  return (
    <Tooltip content={`${source.title} · ${host(source.href)}`}>
      <ExternalLink
        href={source.href}
        aria-label={`${t.source(n)}: ${source.title}`}
        className={cn("inline-flex items-center justify-center min-w-4 h-4 px-1 mx-0.5 align-[0.15em] rounded-chip bg-field border border-line text-caption leading-none text-muted hover:text-contrast tabular-nums no-underline", FOCUS_RING)}
      >
        {n}
      </ExternalLink>
    </Tooltip>
  );
}

// ─── Plan / task list ────────────────────────────────────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface TaskStep {
  label: string;
  status: TaskStatus;
  /** A line under the step (what it found, why it failed). */
  detail?: React.ReactNode;
}

function TaskMark({ status }: { status: TaskStatus }) {
  const box = "w-4 h-4 shrink-0 rounded-full flex items-center justify-center";
  if (status === "running") return <Spinner className="w-4 h-4 text-accent-fg shrink-0" />;
  if (status === "done")
    return (
      <span className={cn(box, "bg-accent text-on-accent")}>
        <Icon name="check" className="w-2.5 h-2.5" />
      </span>
    );
  if (status === "error")
    return (
      <span className={cn(box, "border", STATUS_ICON.danger.surface, STATUS_ICON.danger.fg)}>
        <Icon name="close" className="w-2.5 h-2.5" />
      </span>
    );
  if (status === "skipped")
    return (
      <span className={cn(box, "border border-line text-muted")}>
        <Icon name="minus" className="w-2.5 h-2.5" />
      </span>
    );
  return <span className={cn(box, "border border-line-hover")} />;
}

/** The agent's plan: steps with their status and a progress count. The running step is marked aria-current. */
export function TaskList({ title, steps, className }: { title?: React.ReactNode; steps: TaskStep[]; className?: string }) {
  const t = useSemiLocale();
  const done = steps.filter((s) => s.status === "done" || s.status === "skipped").length;
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className={cn("w-full rounded-card border border-line bg-panel p-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        {title && (
          <h3 id={id} className="flex-1 min-w-0 truncate text-ui font-medium text-contrast">
            {title}
          </h3>
        )}
        <span className="ml-auto text-caption text-muted tabular-nums">{t.taskProgress(done, steps.length)}</span>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} aria-current={s.status === "running" ? "step" : undefined} className="flex gap-2.5">
            <span className="pt-0.5">
              <TaskMark status={s.status} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-ui", s.status === "done" || s.status === "skipped" ? "text-muted" : "text-contrast", s.status === "skipped" && "line-through", s.status === "running" && "font-medium")}>
                {s.label}
                <span className="sr-only"> · {t.taskStatus[s.status]}</span>
              </span>
              {s.detail && <span className={cn("block text-label", s.status === "error" ? "text-body" : "text-muted")}>{s.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Approval ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * An action the agent wants to take that needs a person's OK (send an email, delete files, spend money). Shows what
 * it will do, then Cho phép / Từ chối; once decided, the outcome replaces the buttons so the log stays readable.
 */
export function ActionConfirmation({
  title,
  icon = "shield",
  state = "pending",
  danger = false,
  approveLabel,
  rejectLabel,
  onApprove,
  onReject,
  className,
  children,
}: {
  /** What it will do, as a question or a short line (“Gửi email cho 3 khách hàng?”). */
  title: React.ReactNode;
  icon?: IconName;
  state?: "pending" | "approved" | "rejected";
  /** The action cannot be undone: the approve button is red. */
  danger?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  onApprove: () => void;
  onReject: () => void;
  className?: string;
  /** The details (recipients, files, the command). */
  children?: React.ReactNode;
}) {
  const t = useSemiLocale();
  const id = useId();
  const s = STATUS_ICON[danger ? "danger" : "warning"];
  return (
    <div role="group" aria-labelledby={id} className={cn("w-full rounded-card border bg-panel p-3", state === "pending" ? s.surface : "border-line", className)}>
      <div className="flex gap-2.5">
        <Icon name={icon} className={cn("w-4 h-4 mt-0.5 shrink-0", state === "pending" ? s.fg : "text-muted")} />
        <div className="min-w-0 flex-1 space-y-2">
          <div id={id} className="text-ui font-medium text-contrast">
            {title}
          </div>
          {children && <div className="text-label text-body">{children}</div>}
          {state === "pending" ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant={danger ? "danger" : "primary"} onClick={onApprove}>
                {approveLabel ?? t.approve}
              </Button>
              <Button size="sm" variant="secondary" onClick={onReject}>
                {rejectLabel ?? t.reject}
              </Button>
            </div>
          ) : (
            <Badge tone={state === "approved" ? "emerald" : "gray"} size="sm" icon={state === "approved" ? "check" : "close"}>
              {state === "approved" ? t.approved : t.rejected}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── File tree ───────────────────────────────────────────────────────────────────────────────────────────────────

export interface FileNode {
  name: string;
  /** A folder has children (an empty array for an empty folder). */
  children?: FileNode[];
  /** What the agent did to it: a letter mark and a colour on the name. */
  change?: "added" | "modified" | "deleted";
}

interface FlatNode {
  node: FileNode;
  path: string;
  level: number;
  parent: string | null;
  setSize: number;
  pos: number;
}

// the letter stays muted text (amber text misses AA on light surfaces); the colour is on a dot beside it
const CHANGE_MARK = { added: ["A", "text-success-fg"], modified: ["M", "text-warning-fg"], deleted: ["D", "text-danger-fg"] } as const;

/**
 * Files and folders (a repo, a diff, an export): a keyboard tree (role="tree"). ↑/↓ move, → opens a folder or enters
 * it, ← closes it or goes to the parent, Home / End, Enter selects a file (or toggles a folder). Paths are the names
 * joined by "/".
 */
export function FileTree({
  files,
  label,
  selected,
  onSelect,
  defaultExpanded,
  className,
}: {
  files: FileNode[];
  /** Accessible name of the tree. */
  label: string;
  /** Path of the selected file. */
  selected?: string;
  onSelect?: (path: string, node: FileNode) => void;
  /** Folder paths open at first (default: every folder). */
  defaultExpanded?: string[];
  className?: string;
}) {
  const t = useSemiLocale();
  const allFolders = useMemo(() => {
    const out: string[] = [];
    const walk = (nodes: FileNode[], base: string) =>
      nodes.forEach((n) => {
        if (!n.children) return;
        const p = base ? `${base}/${n.name}` : n.name;
        out.push(p);
        walk(n.children, p);
      });
    walk(files, "");
    return out;
  }, [files]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded ?? allFolders));
  const visible = useMemo(() => {
    const out: FlatNode[] = [];
    const walk = (nodes: FileNode[], base: string, level: number, parent: string | null) =>
      nodes.forEach((node, i) => {
        const path = base ? `${base}/${node.name}` : node.name;
        out.push({ node, path, level, parent, setSize: nodes.length, pos: i + 1 });
        if (node.children && expanded.has(path)) walk(node.children, path, level + 1, path);
      });
    walk(files, "", 1, null);
    return out;
  }, [files, expanded]);
  const [focus, setFocus] = useState<string>(() => selected ?? visible[0]?.path ?? "");
  const treeRef = useRef<HTMLUListElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    treeRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [focus]);
  const current = visible.find((v) => v.path === focus) ?? visible[0];

  const toggle = (path: string, open?: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open ?? !next.has(path)) next.add(path);
      else next.delete(path);
      return next;
    });
  const go = (path: string) => {
    moved.current = true;
    setFocus(path);
  };
  const activate = (v: FlatNode) => (v.node.children ? toggle(v.path) : onSelect?.(v.path, v.node));
  const onKey = (e: React.KeyboardEvent) => {
    if (!current) return;
    const i = visible.indexOf(current);
    const isFolder = Boolean(current.node.children);
    const open = expanded.has(current.path);
    const act: Record<string, () => void> = {
      ArrowDown: () => visible[i + 1] && go(visible[i + 1].path),
      ArrowUp: () => visible[i - 1] && go(visible[i - 1].path),
      Home: () => go(visible[0].path),
      End: () => go(visible[visible.length - 1].path),
      ArrowRight: () => (isFolder ? (open ? visible[i + 1]?.parent === current.path && go(visible[i + 1].path) : toggle(current.path, true)) : undefined),
      ArrowLeft: () => (isFolder && open ? toggle(current.path, false) : current.parent && go(current.parent)),
      Enter: () => activate(current),
      " ": () => activate(current),
    };
    if (act[e.key]) {
      e.preventDefault();
      act[e.key]();
    }
  };

  return (
    <ul ref={treeRef} role="tree" aria-label={label} onKeyDown={onKey} className={cn("text-ui", className)}>
      {visible.map((v) => {
        const isFolder = Boolean(v.node.children);
        const open = expanded.has(v.path);
        const mark = v.node.change && CHANGE_MARK[v.node.change];
        const isSel = !isFolder && v.path === selected;
        return (
          <li
            key={v.path}
            role="treeitem"
            aria-level={v.level}
            aria-setsize={v.setSize}
            aria-posinset={v.pos}
            aria-expanded={isFolder ? open : undefined}
            aria-selected={isFolder ? undefined : isSel}
            tabIndex={v.path === current?.path ? 0 : -1}
            onFocus={() => setFocus(v.path)}
            onClick={() => {
              go(v.path);
              activate(v);
            }}
            style={{ paddingLeft: `${(v.level - 1) * 16 + 8}px` }}
            className={cn("flex items-center gap-1.5 h-7 pr-2 rounded-control cursor-pointer select-none", isSel ? "bg-raised text-contrast font-medium" : "text-body hover:bg-raised", FOCUS_RING)}
          >
            {isFolder ? chevron(open) : <span className="w-3.5 shrink-0" />}
            <Icon name={isFolder ? (open ? "folderOpen" : "folder") : "file"} className="w-4 h-4 text-muted shrink-0" />
            <span className={cn("flex-1 min-w-0 truncate", v.node.change === "deleted" && "line-through text-muted")}>{v.node.name}</span>
            {mark && (
              <span className="inline-flex items-center gap-1 text-caption font-semibold text-muted tabular-nums">
                <span aria-hidden className={cn("w-1.5 h-1.5 rounded-full bg-current", mark[1])} />
                <span aria-hidden>{mark[0]}</span>
                <span className="sr-only">{t.fileChange[v.node.change!]}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ─── Context meter ───────────────────────────────────────────────────────────────────────────────────────────────

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/**
 * How much of the model's context window is used: a small ring and the percent (role="meter"), with the token counts
 * in a tooltip. Turns amber from 80% and red from 95%, when the app should summarise or start a new chat.
 */
export function ContextMeter({ used, total, label, showValue = true, className }: { /** Tokens used. */ used: number; /** Context window size in tokens. */ total: number; label?: string; showValue?: boolean; className?: string }) {
  const t = useSemiLocale();
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const tone = pct >= 95 ? "text-danger-fg" : pct >= 80 ? "text-warning-fg" : "text-accent-fg";
  const r = 6;
  const c = 2 * Math.PI * r;
  const detail = t.contextDetail(compact.format(used), compact.format(total), pct);
  return (
    <Tooltip content={detail}>
      <span
        role="meter"
        tabIndex={0}
        aria-label={label ?? t.contextUsage}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(used, total)}
        aria-valuetext={detail}
        className={cn("inline-flex items-center gap-1.5 rounded-control px-1 h-6 text-caption text-muted tabular-nums", FOCUS_RING, className)}
      >
        <svg viewBox="0 0 16 16" className={cn("w-4 h-4 -rotate-90 shrink-0", tone)} aria-hidden>
          <circle cx="8" cy="8" r={r} fill="none" stroke="var(--color-line)" strokeWidth={2.5} />
          <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />
        </svg>
        {showValue && <span>{pct}%</span>}
      </span>
    </Tooltip>
  );
}
