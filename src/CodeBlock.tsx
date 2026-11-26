"use client";

// Code to read or copy: a mono block with a copy button, an optional title (file name, language) and wrapping off, so
// long lines scroll sideways. Plain text, no highlighting (no library; short snippets read fine). On a touch phone the
// copy button is 44px (BTN_HIT): the title row grows to h-12 around it (44px + its border); without a title the pre
// keeps it clear (pr-14) and is tall enough to hold it (min-h-13 = 4px + 44px + 4px).
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
    <Button size="sm" variant="ghost" iconOnly icon={copied ? "check" : "copy"} aria-label={copied ? t.copied : t.copy} title={copied ? t.copied : t.copy} onClick={copy} className={title ? "" : "!absolute right-2 top-2 pointer-coarse:max-sm:right-1 pointer-coarse:max-sm:top-1"} />
  );
  return (
    <div data-semi="CodeBlock" className={cn("relative rounded-control border border-line bg-field", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-divider px-3 h-9 pointer-coarse:max-sm:h-12">
          <span className="text-chrome font-medium text-muted truncate">{title}</span>
          {button}
        </div>
      )}
      {!title && button}
      <pre tabIndex={0} className={cn("overflow-x-auto p-3 text-ui leading-relaxed text-body outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-control", !title && "pr-12 pointer-coarse:max-sm:pr-14 pointer-coarse:max-sm:min-h-13")}>
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
