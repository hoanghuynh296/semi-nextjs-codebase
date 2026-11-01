"use client";

// Code to read or copy: a mono block with a copy button, an optional title (file name, language) and wrapping off, so
// long lines scroll sideways. Plain text, no highlighting (no library; short snippets read fine).
import React, { useState } from "react";
import { Button } from "./Button";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export function CodeBlock({ code, title, className }: { code: string; /** File name or language above the code ("app/layout.tsx"). */ title?: string; className?: string }) {
  const t = useSemiLocale();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const button = (
    <Button size="sm" variant="ghost" iconOnly icon={copied ? "check" : "copy"} aria-label={copied ? t.copied : t.copy} title={copied ? t.copied : t.copy} onClick={copy} className={title ? "" : "!absolute right-2 top-2"} />
  );
  return (
    <div className={cn("relative rounded-control border border-line bg-field", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-divider px-3 h-9">
          <span className="text-caption font-medium text-muted truncate">{title}</span>
          {button}
        </div>
      )}
      {!title && button}
      <pre tabIndex={0} className={cn("overflow-x-auto p-3 text-label leading-relaxed text-body outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-control", !title && "pr-12")}>
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
