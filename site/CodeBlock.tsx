"use client";

import React, { useState } from "react";
import { Button } from "../src/Button";
import { cn } from "../styles/utils";

/** Code with a copy button (no highlighting: the code is short and reads fine in the mono font). */
export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className={cn("relative rounded-control border border-line bg-field", className)}>
      <Button
        size="sm"
        iconOnly
        icon={copied ? "check" : "copy"}
        aria-label={copied ? "Đã copy" : "Copy code"}
        title={copied ? "Đã copy" : "Copy code"}
        onClick={copy}
        className="!absolute right-2 top-2"
      />
      <pre tabIndex={0} className="overflow-x-auto p-3 pr-12 text-label leading-relaxed text-body outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-control">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
