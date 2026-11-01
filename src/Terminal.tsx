"use client";

// Output of a command an agent or a job ran: the command, its streamed output and how it ended. Mono, because it is
// code. ANSI colour codes are stripped (no colour parsing); long lines scroll sideways.
import React, { useEffect, useRef } from "react";
import { Badge } from "./Badge";
import { Spinner } from "./Button";
import { ChatCopyButton } from "./Chat";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;

/**
 * Follows the end of the output while it streams, unless people scrolled up to read. The log is focusable (keyboard
 * scrolling) and not a live region: output read aloud line by line would drown everything else.
 */
export function Terminal({
  command,
  output,
  title,
  status = "done",
  exitCode,
  maxHeight = 320,
  className,
}: {
  /** The command line, shown first after “$”. */
  command?: string;
  output: string;
  /** Name above the output (default: the command). */
  title?: string;
  status?: "running" | "done";
  /** Shown once done: 0 green, anything else red. */
  exitCode?: number;
  /** Height in px before the output scrolls. */
  maxHeight?: number;
  className?: string;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLPreElement>(null);
  const stuck = useRef(true);
  const text = output.replace(ANSI, "");
  useEffect(() => {
    const el = ref.current;
    if (el && stuck.current) el.scrollTop = el.scrollHeight;
  }, [text]);
  const name = title ?? command ?? "Terminal";
  return (
    <div className={cn("w-full rounded-card border border-line bg-field overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b border-divider px-3 h-9">
        <Icon name="terminal" className="w-4 h-4 text-muted shrink-0" />
        <span className="flex-1 min-w-0 truncate text-caption font-medium text-muted">{name}</span>
        {status === "running" ? (
          <Spinner className="w-3.5 h-3.5 text-accent-fg" label={t.toolStatus.running} />
        ) : (
          exitCode !== undefined && (
            <Badge tone={exitCode === 0 ? "emerald" : "rose"} size="sm">
              {t.exitCode(exitCode)}
            </Badge>
          )
        )}
        <ChatCopyButton text={(command ? `$ ${command}\n` : "") + text} />
      </div>
      <pre
        ref={ref}
        tabIndex={0}
        aria-label={name}
        onScroll={(e) => {
          const el = e.currentTarget;
          stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        style={{ maxHeight }}
        className="overflow-auto p-3 text-label leading-relaxed text-body font-mono outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
      >
        {command && (
          <div>
            <span className="text-muted select-none">$ </span>
            <span className="text-contrast">{command}</span>
          </div>
        )}
        {text}
      </pre>
    </div>
  );
}
